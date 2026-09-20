const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Poll = require('../models/Poll');
const User = require('../models/User');

const enrichPost = async (post, currentUid = null, viewerRole = null) => {
  const p = post.toJSON ? post.toJSON() : post;
  const count = await Comment.countDocuments({ post_id: p.id });
  const isAnon = p.anonymous || false;
  let authorData = { name: '[deleted]', role: 'student' };
  let realName = null;

  if (isAnon) {
    authorData = { name: 'Anonymous', role: 'student', year: null, branch: '', roll_number: '' };
    if (['faculty_incharge', 'club_admin', 'owner'].includes(viewerRole)) {
      const realAuthor = await User.findById(p.author_id);
      if (realAuthor) realName = realAuthor.name;
    }
  } else {
    const author = await User.findById(p.author_id);
    if (author) authorData = author.toJSON();
  }

  const result = {
    ...p,
    upvotes: p.upvotes ? p.upvotes.length : 0,
    upvoted: currentUid ? (p.upvotes || []).includes(currentUid) : false,
    comment_count: count,
    author: authorData,
  };
  if (realName) result.real_name = realName;
  return result;
};

// ── POSTS ─────────────────────────────────────────────────────────────

exports.getPosts = async (req, res) => {
  try {
    const { tag, club_id, sort = 'new' } = req.query;
    let query = {};
    if (tag) query.tags = tag;
    if (club_id) query.club_id = club_id;
    
    let posts = await Post.find(query).limit(100);
    
    if (sort === 'top') {
      posts.sort((a, b) => (b.upvotes ? b.upvotes.length : 0) - (a.upvotes ? a.upvotes.length : 0));
    } else {
      posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    const uid = req.user ? req.user._id.toString() : null;
    const vrole = req.user ? req.user.role : null;
    
    const enriched = await Promise.all(posts.map(p => enrichPost(p, uid, vrole)));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getPost = async (req, res) => {
  try {
    const p = await Post.findById(req.params.post_id);
    if (!p) return res.status(404).json({ detail: 'Post not found' });
    
    const uid = req.user ? req.user._id.toString() : null;
    const vrole = req.user ? req.user.role : null;
    res.json(await enrichPost(p, uid, vrole));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    if (!req.user.email_verified) return res.status(403).json({ detail: 'Email not verified' });
    
    const post = new Post({
      ...req.body,
      author_id: req.user._id.toString()
    });
    await post.save();
    
    res.json(await enrichPost(post, req.user._id.toString(), req.user.role));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.createAnonPost = async (req, res) => {
  try {
    if (!req.user.email_verified) return res.status(403).json({ detail: 'Email not verified' });
    
    const post = new Post({
      ...req.body,
      author_id: req.user._id.toString(),
      anonymous: true
    });
    await post.save();
    
    res.json(await enrichPost(post, req.user._id.toString(), req.user.role));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.upvotePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    const p = await Post.findById(post_id);
    if (!p) return res.status(404).json({ detail: 'Not found' });
    
    const uid = req.user._id.toString();
    const isUpvoted = p.upvotes.includes(uid);
    
    if (isUpvoted) {
      await Post.findByIdAndUpdate(post_id, { $pull: { upvotes: uid } });
    } else {
      await Post.findByIdAndUpdate(post_id, { $addToSet: { upvotes: uid } });
    }
    
    const updated = await Post.findById(post_id);
    res.json({ upvotes: updated.upvotes.length, upvoted: !isUpvoted });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    const p = await Post.findById(post_id);
    if (!p) return res.status(404).json({ detail: 'Not found' });
    
    if (p.author_id !== req.user._id.toString() && !['faculty_incharge','club_admin','owner'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Not allowed' });
    }
    
    await Post.findByIdAndDelete(post_id);
    await Comment.deleteMany({ post_id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

// ── COMMENTS ──────────────────────────────────────────────────────────

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post_id: req.params.post_id });
    comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    const uid = req.user ? req.user._id.toString() : null;
    const vrole = req.user ? req.user.role : null;
    
    const result = await Promise.all(comments.map(async c => {
      const author = await User.findById(c.author_id);
      return {
        id: c._id,
        body: c.body,
        author: author ? author.toJSON() : { name: '[deleted]', role: 'student' },
        created_at: c.created_at,
        can_delete: uid && (c.author_id === uid || ['faculty_incharge','club_admin','owner'].includes(vrole))
      };
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    if (!req.user.email_verified) return res.status(403).json({ detail: 'Email not verified' });
    
    const p = await Post.findById(req.params.post_id);
    if (!p) return res.status(404).json({ detail: 'Not found' });
    
    const comment = new Comment({
      post_id: req.params.post_id,
      body: req.body.body,
      author_id: req.user._id.toString()
    });
    await comment.save();
    
    const author = await User.findById(req.user._id);
    res.json({
      id: comment._id,
      body: comment.body,
      author: author.toJSON(),
      created_at: comment.created_at,
      can_delete: true
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const c = await Comment.findById(req.params.comment_id);
    if (!c) return res.status(404).json({ detail: 'Not found' });
    
    if (c.author_id !== req.user._id.toString() && !['faculty_incharge','club_admin','owner'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Not allowed' });
    }
    
    await Comment.findByIdAndDelete(req.params.comment_id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

// ── POLLS ─────────────────────────────────────────────────────────────

const fmtPoll = async (poll, uid = null) => {
  const p = poll.toJSON ? poll.toJSON() : poll;
  const author = await User.findById(p.author_id);
  
  let total = 0;
  p.options.forEach(o => total += (o.votes ? o.votes.length : 0));
  
  let my_vote = null;
  const opts = p.options.map((o, i) => {
    if (uid && o.votes && o.votes.includes(uid)) my_vote = i;
    const v = o.votes ? o.votes.length : 0;
    return {
      text: o.text,
      votes: v,
      pct: total ? Math.round((v / total) * 100) : 0
    };
  });
  
  return {
    ...p,
    options: opts,
    total_votes: total,
    my_vote,
    author: author ? author.toJSON() : { name: '[deleted]', role: 'student' }
  };
};

exports.createPoll = async (req, res) => {
  try {
    if (!req.user.email_verified) return res.status(403).json({ detail: 'Email not verified' });
    if (!req.body.options || req.body.options.length < 2) return res.status(400).json({ detail: 'Need at least 2 options' });
    
    const options_data = req.body.options.map(opt => ({ text: opt, votes: [] }));
    const poll = new Poll({
      title: req.body.title,
      body: req.body.body || '',
      options: options_data,
      tags: req.body.tags || [],
      club_id: req.body.club_id || null,
      author_id: req.user._id.toString()
    });
    await poll.save();
    
    res.json(await fmtPoll(poll, req.user._id.toString()));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getPolls = async (req, res) => {
  try {
    const polls = await Poll.find({}).limit(100);
    polls.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const uid = req.user ? req.user._id.toString() : null;
    const result = await Promise.all(polls.map(p => fmtPoll(p, uid)));
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { poll_id, option_idx } = req.params;
    const idx = parseInt(option_idx);
    
    const p = await Poll.findById(poll_id);
    if (!p) return res.status(404).json({ detail: 'Not found' });
    if (idx >= p.options.length) return res.status(400).json({ detail: 'Invalid option' });
    
    const uid = req.user._id.toString();
    
    // Remove existing vote
    p.options.forEach(o => {
      o.votes = o.votes.filter(v => v !== uid);
    });
    // Add new vote
    p.options[idx].votes.push(uid);
    
    await p.save();
    res.json(await fmtPoll(p, uid));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.deletePoll = async (req, res) => {
  try {
    const { poll_id } = req.params;
    const p = await Poll.findById(poll_id);
    if (!p) return res.status(404).json({ detail: 'Not found' });
    
    if (p.author_id !== req.user._id.toString() && !['faculty_incharge','club_admin','owner'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Not allowed' });
    }
    
    await Poll.findByIdAndDelete(poll_id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};
