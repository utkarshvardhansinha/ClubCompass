const Club = require('../models/Club');
const User = require('../models/User');

exports.getClubs = async (req, res) => {
  try {
    const { domain, search } = req.query;
    let query = {};
    if (domain) query.domain = domain;
    if (search) query.name = new RegExp(search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    
    const clubs = await Club.find(query).limit(200);
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.club_id);
    if (!club) return res.status(404).json({ detail: 'Club not found' });
    res.json(club);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.updateClub = async (req, res) => {
  try {
    const { club_id } = req.params;
    const u = req.user;
    
    if (!['owner', 'faculty_incharge'].includes(u.role)) {
      if (u.managed_club_id !== club_id) {
        return res.status(403).json({ detail: 'You can only edit your own club' });
      }
    }
    
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ detail: 'Nothing to update' });
    }
    
    const club = await Club.findByIdAndUpdate(club_id, req.body, { new: true });
    res.json(club);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.deleteClub = async (req, res) => {
  try {
    const { club_id } = req.params;
    const u = req.user;
    
    if (!['owner', 'faculty_incharge'].includes(u.role)) {
      if (u.managed_club_id !== club_id) {
        return res.status(403).json({ detail: 'You can only delete your own club' });
      }
    }
    
    await Club.findByIdAndDelete(club_id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.createClub = async (req, res) => {
  try {
    const COLORS = {
      "Technical":"#6366f1","Cultural":"#ec4899",
      "Sports":"#f97316","Literary":"#14b8a6",
      "Social":"#22c55e","Management":"#f59e0b"
    };
    
    const color = COLORS[req.body.domain] || "#888";
    const club = new Club({ ...req.body, color });
    await club.save();
    res.json(club);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};
