const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expires_at: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
