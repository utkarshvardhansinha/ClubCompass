const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: [{ type: String }], // Array of User IDs
}, { _id: false });

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, default: '' },
  options: [pollOptionSchema],
  tags: [{ type: String }],
  club_id: { type: String, default: null },
  author_id: { type: String, required: true }, // User ID
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

pollSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Poll', pollSchema);
