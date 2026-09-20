const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'club_admin', 'faculty_incharge', 'owner'], 
    default: 'student' 
  },
  roll_number: { type: String },
  year: { type: Number },
  branch: { type: String },
  department: { type: String, default: '' },
  email_verified: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  bio: { type: String, default: '' },
  managed_club_id: { type: String, default: '' }, // For club admins
  
  // Quiz
  quiz_result: { type: mongoose.Schema.Types.Mixed, default: null },
  
  // Bookmarks & Watchlist
  bookmarks: [{ type: String }],
  watchlist: [{
    club_id: { type: String },
    note: { type: String, default: '' },
    added_at: { type: Date, default: Date.now }
  }],
  
  // OTPs for email verification/reset
  otp: { type: String, default: null },
  otp_expiry: { type: Date, default: null },
  reset_otp: { type: String, default: null },
  reset_otp_expiry: { type: Date, default: null },
  
  created_by_owner: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// Expose 'id' instead of '_id' and remove password when converting to JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.otp;
    delete ret.otp_expiry;
    delete ret.reset_otp;
    delete ret.reset_otp_expiry;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
