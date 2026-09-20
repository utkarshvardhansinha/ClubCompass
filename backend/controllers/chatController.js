const axios = require('axios');
const Message = require('../models/Message');
const User = require('../models/User');

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return res.json({ reply: 'AI chat requires GROQ_API_KEY configuration. Please add your Groq API key.' });
    }
    
    const clubs = await require('../models/Club').find({}).limit(50);
    const clubSummary = clubs.map(c => `- ${c.name} (${c.domain}): ${c.tagline}`).join('\n');
    
    const sysPrompt = `You are the NIT Kurukshetra Club Compass assistant. Help students explore clubs.
Available clubs at NIT KKR:
${clubSummary}
Be friendly, helpful, and concise. Keep responses under 200 words.`;

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 300
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
      timeout: 20000
    });
    
    res.json({ reply: response.data.choices[0].message.content });
  } catch (err) {
    console.error(`[CHAT EXCEPTION]`, err.message);
    res.json({ reply: `AI error: ${err.message}` });
  }
};

exports.sendDm = async (req, res) => {
  try {
    if (!req.user.email_verified) return res.status(403).json({ detail: 'Email not verified' });
    const { to_user_id, body } = req.body;
    
    const target = await User.findById(to_user_id);
    if (!target) return res.status(404).json({ detail: 'User not found' });
    
    const msg = new Message({
      from_id: req.user._id.toString(),
      to_id: to_user_id,
      body
    });
    
    await msg.save();
    res.json({ id: msg._id, ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getThreads = async (req, res) => {
  try {
    const uid = req.user._id.toString();
    const msgs = await Message.find({
      $or: [{ from_id: uid }, { to_id: uid }]
    });
    
    msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    const threads = {};
    msgs.forEach(m => {
      const other = m.from_id === uid ? m.to_id : m.from_id;
      threads[other] = {
        last_msg: m.body,
        last_time: m.created_at,
        unread: !m.read && m.to_id === uid
      };
    });
    
    const result = [];
    for (const otherId in threads) {
      const otherUser = await User.findById(otherId);
      if (otherUser) {
        result.push({
          user: otherUser.toJSON(),
          ...threads[otherId]
        });
      }
    }
    
    result.sort((a, b) => new Date(b.last_time) - new Date(a.last_time));
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getDmThread = async (req, res) => {
  try {
    const uid = req.user._id.toString();
    const { user_id } = req.params;
    
    const msgs = await Message.find({
      $or: [
        { from_id: uid, to_id: user_id },
        { from_id: user_id, to_id: uid }
      ]
    }).limit(500);
    
    msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    await Message.updateMany({ from_id: user_id, to_id: uid, read: false }, { $set: { read: true } });
    
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ to_id: req.user._id.toString(), read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};
