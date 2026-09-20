const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post_id: { type: String, required: true },
  body: { type: String, required: true },
  author_id: { type: String, required: true }, // User ID
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

commentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Comment', commentSchema);
