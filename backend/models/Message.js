const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from_id: { type: String, required: true }, // User ID
  to_id: { type: String, required: true }, // User ID
  body: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

messageSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Message', messageSchema);
