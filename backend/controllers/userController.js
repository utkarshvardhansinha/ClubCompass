const User = require('../models/User');

exports.searchUsers = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) return res.json([]);

    const regex = new RegExp(q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    const users = await User.find({
      $or: [
        { name: regex },
        { roll_number: regex }
      ]
    }).limit(10);

    const filtered = users.filter(u => u._id.toString() !== req.user._id.toString());
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.user_id);
    if (!target) return res.status(404).json({ detail: 'User not found' });
    res.json(target);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};
