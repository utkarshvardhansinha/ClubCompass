const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  club_id: { type: String, required: true },
  club_name: { type: String, default: '' },
  club_icon: { type: String, default: '🎯' },
  domain: { type: String, default: '' },
  description: { type: String, default: '' },
  event_date: { type: String, required: true }, // Format: YYYY-MM-DD
  event_time: { type: String, default: '' },
  location: { type: String, default: 'NIT Kurukshetra' },
  
  interested: [{ type: String }], // Array of User IDs
  created_by: { type: String, required: true }, // User ID of creator
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

eventSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Event', eventSchema);
