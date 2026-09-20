const User = require('../models/User');
const Club = require('../models/Club');
const Post = require('../models/Post');
const Event = require('../models/Event');
const helpers = require('../utils/helpers');
const bcrypt = require('bcryptjs');

exports.getKeys = (req, res) => {
  if (req.body.admin_pass !== helpers.getAdminPassword()) {
    return res.status(403).json({ detail: 'Wrong password' });
  }
  res.json({
    senior_key: process.env.ADMIN_SENIOR_KEY || 'default-senior-key',
    club_admin_key: process.env.CLUB_ADMIN_KEY || 'default-club-key'
  });
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email: rawEmail, password, role: rawRole, club_id, department } = req.body;
    const email = rawEmail.toLowerCase().trim();
    const role = rawRole.toLowerCase();
    const u = req.user;

    if (u.role === 'club_admin') {
      if (role !== 'club_admin') return res.status(403).json({ detail: 'Club admins can only create other club admins' });
      if (!club_id || club_id !== u.managed_club_id) return res.status(403).json({ detail: 'You can only assign admins to your own club' });
    }

    if (!['club_admin', 'faculty_incharge'].includes(role)) {
      return res.status(400).json({ detail: 'Role must be club_admin or faculty_incharge' });
    }
    
    if (await User.findOne({ email })) return res.status(400).json({ detail: 'Email already registered' });
    if (password.length < 6) return res.status(400).json({ detail: 'Password must be at least 6 characters' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const doc = {
      name, email, password: hashedPassword, role,
      roll_number: 'STAFF', year: null, branch: department || '',
      email_verified: true, verified: true,
      department: department || '',
      created_by_owner: true
    };

    if (role === 'club_admin' && club_id) {
      doc.managed_club_id = club_id;
      await Club.findByIdAndUpdate(club_id, { admin_id: null }); // placeholder, mongoose sets on save
    }

    const user = new User(doc);
    await user.save();
    
    if (role === 'club_admin' && club_id) {
      await Club.findByIdAndUpdate(club_id, { admin_id: user._id.toString() });
    }

    res.json({ message: 'Staff account created!', user });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.listStaff = async (req, res) => {
  try {
    let query = { role: { $in: ['club_admin', 'faculty_incharge'] } };
    if (req.user.role === 'club_admin') {
      query.managed_club_id = req.user.managed_club_id;
      query.role = 'club_admin';
    }

    const staff = await User.find(query).limit(200);
    const result = [];
    
    for (const s of staff) {
      const item = s.toJSON();
      if (s.managed_club_id) {
        const club = await Club.findById(s.managed_club_id);
        item.managed_club_name = club ? club.name : 'Unknown Club';
      } else {
        item.managed_club_name = '';
      }
      result.push(item);
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.resetStaffPassword = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { password } = req.body;
    
    const target = await User.findById(user_id);
    if (!target) return res.status(404).json({ detail: 'User not found' });
    
    if (req.user.role === 'club_admin') {
      if (target.role !== 'club_admin' || target.managed_club_id !== req.user.managed_club_id) {
        return res.status(403).json({ detail: 'You can only manage admins from your own club' });
      }
    }
    
    if (password.length < 6) return res.status(400).json({ detail: 'Password must be at least 6 characters' });
    
    const salt = await bcrypt.genSalt(10);
    target.password = await bcrypt.hash(password, salt);
    await target.save();
    
    res.json({ ok: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.assignClub = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { club_id } = req.body;
    
    const club = await Club.findById(club_id);
    if (!club) return res.status(404).json({ detail: 'Club not found' });
    
    await User.findByIdAndUpdate(user_id, { managed_club_id: club_id });
    await Club.findByIdAndUpdate(club_id, { admin_id: user_id });
    
    res.json({ ok: true, club_name: club.name });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const target = await User.findById(user_id);
    if (!target) return res.status(404).json({ detail: 'User not found' });
    
    if (req.user.role === 'club_admin') {
      if (target.role !== 'club_admin' || target.managed_club_id !== req.user.managed_club_id) {
        return res.status(403).json({ detail: 'You can only delete admins from your own club' });
      }
    }
    if (target.role === 'owner') return res.status(403).json({ detail: 'Cannot delete owner account' });
    
    if (target.managed_club_id) {
      await Club.findByIdAndUpdate(target.managed_club_id, { $unset: { admin_id: "" } });
    }
    
    await User.findByIdAndDelete(user_id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.ownerStats = async (req, res) => {
  try {
    res.json({
      total_users: await User.countDocuments(),
      total_clubs: await Club.countDocuments(),
      total_posts: await Post.countDocuments(),
      total_events: await Event.countDocuments(),
      total_staff: await User.countDocuments({ role: { $in: ['club_admin', 'faculty_incharge'] } }),
      club_admins: await User.countDocuments({ role: 'club_admin' }),
      faculty: await User.countDocuments({ role: 'faculty_incharge' })
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};
