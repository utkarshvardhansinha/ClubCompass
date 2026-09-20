const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
  try {
    const club = await require('../models/Club').findById(req.body.club_id);
    const event = new Event({
      ...req.body,
      club_name: club ? club.name : '',
      club_icon: club ? club.icon : '🎯',
      domain: req.body.domain || (club ? club.domain : ''),
      created_by: req.user._id
    });
    
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const { domain } = req.query;
    let query = {};
    if (domain) query.domain = domain;
    
    const events = await Event.find(query).limit(200);
    events.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    
    const uid = req.user ? req.user._id.toString() : null;
    const result = events.map(e => ({
      ...e.toJSON(),
      interested_count: e.interested.length,
      is_interested: uid ? e.interested.includes(uid) : false
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.toggleInterested = async (req, res) => {
  try {
    const e = await Event.findById(req.params.event_id);
    if (!e) return res.status(404).json({ detail: 'Not found' });
    
    const uid = req.user._id.toString();
    const isInterested = e.interested.includes(uid);
    
    if (isInterested) {
      await Event.findByIdAndUpdate(req.params.event_id, { $pull: { interested: uid } });
      return res.json({ is_interested: false });
    } else {
      await Event.findByIdAndUpdate(req.params.event_id, { $addToSet: { interested: uid } });
      return res.json({ is_interested: true });
    }
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.event_id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};
