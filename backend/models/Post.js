const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  tags: [{ type: String }],
  club_id: { type: String, default: null },
  author_id: { type: String, required: true }, // User ID
  anonymous: { type: Boolean, default: false },
  upvotes: [{ type: String }], // Array of User IDs
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

postSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Post', postSchema);
