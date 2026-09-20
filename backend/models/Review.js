const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  club_id: { type: String, required: true },
  user_id: { type: String, required: true }, // User ID
  rating: { type: Number, required: true, min: 1, max: 5 },
  liked: { type: String, default: '' },
  improved: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

reviewSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Review', reviewSchema);
