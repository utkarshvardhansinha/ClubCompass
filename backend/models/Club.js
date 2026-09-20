const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true },
  tagline: { type: String, required: true },
  description: { type: String, required: true },
  members: { type: Number, default: 0 },
  founded: { type: Number, default: 2020 },
  email: { type: String, default: '' },
  tags: [{ type: String }],
  icon: { type: String, default: '🎯' },
  image_url: { type: String },
  events: [{ type: String }],
  recruitment_info: { type: String, default: '' },
  color: { type: String, default: '#888' },
  admin_id: { type: String }, // User ID of the assigned club_admin
  
  // Ratings from reviews
  avg_rating: { type: Number, default: null },
  review_count: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

clubSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Club', clubSchema);
