const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const bcrypt = require('bcryptjs');
const helpers = require('../utils/helpers');
const { sendOtpEmail } = require('../utils/mailer');

const CLUB_ADMIN_KEY = process.env.CLUB_ADMIN_KEY || 'default-club-key';
const ADMIN_SENIOR_KEY = process.env.ADMIN_SENIOR_KEY || 'default-senior-key';

exports.signup = async (req, res) => {
  try {
    let { name, email, password, role, roll_number, secret_key } = req.body;
    email = email.toLowerCase().trim();
    roll_number = roll_number.trim().toUpperCase();
    const ownerMode = helpers.isOwnerEmail(email);

    if (!ownerMode && !helpers.validateCollegeEmail(email)) {
      return res.status(400).json({ detail: `Only @${process.env.COLLEGE_DOMAIN || 'nitkkr.ac.in'} emails allowed` });
    }

    const { year, branch, prefix } = helpers.extractRollInfo(roll_number);

    if (!ownerMode && !['STAFF', 'FACULTY'].includes(roll_number) && !year) {
      return res.status(400).json({ detail: `Unrecognised roll number prefix '${prefix}'. Must be 1211/1221/1231/1241/1251` });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    role = role.toLowerCase();
    if (role === 'senior') role = 'student';
    if (!['student', 'club_admin', 'faculty_incharge'].includes(role)) {
      return res.status(400).json({ detail: 'Invalid role' });
    }

    if (role === 'club_admin' && secret_key !== CLUB_ADMIN_KEY) {
      return res.status(400).json({ detail: 'Invalid club admin key' });
    }

    if (role === 'faculty_incharge' && secret_key !== ADMIN_SENIOR_KEY) {
      return res.status(400).json({ detail: 'Invalid faculty key — contact administrator' });
    }

    if (ownerMode) role = 'owner';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name, email, password: hashedPassword, role,
      roll_number, year, branch,
      email_verified: true, verified: true
    });

    await user.save();
    const token = helpers.generateToken(user._id, role);
    res.json({ message: 'Account created!', token, user });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) return res.status(404).json({ detail: 'User not found' });
    if (user.email_verified) return res.status(400).json({ detail: 'Already verified' });
    
    if (user.otp !== otp) return res.status(400).json({ detail: 'Incorrect OTP' });
    if (new Date() > user.otp_expiry) return res.status(400).json({ detail: 'OTP expired. Request a new one.' });

    user.email_verified = true;
    user.otp = null;
    await user.save();

    const token = helpers.generateToken(user._id, user.role);
    res.json({ message: 'Email verified!', token, user });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ detail: 'User not found' });
    if (user.email_verified) return res.status(400).json({ detail: 'Already verified' });

    const otp = helpers.generateOtp();
    user.otp = otp;
    user.otp_expiry = new Date(Date.now() + 15 * 60000); // 15 mins
    await user.save();
    
    // Send email asynchronously
    sendOtpEmail(email, otp);
    
    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const password = req.body.password;

    if (helpers.isOwnerEmail(email)) {
      if (password === helpers.getAdminPassword()) {
        let user = await User.findOne({ email });
        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          user = new User({
            name: 'Super Admin', email, password: hashedPassword, role: 'owner',
            email_verified: true, verified: true
          });
          await user.save();
        }
        const token = helpers.generateToken(user._id, user.role);
        return res.json({ token, user });
      }
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ detail: 'Wrong email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ detail: 'Wrong email or password' });

    const token = helpers.generateToken(user._id, user.role);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.resetPasswordRequest = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ detail: 'User not found' });

    const otp = helpers.generateOtp();
    user.reset_otp = otp;
    user.reset_otp_expiry = new Date(Date.now() + 15 * 60000);
    await user.save();

    sendOtpEmail(email, otp);

    res.json({ message: 'OTP sent to your email.', user_first_name: user.name.split(' ')[0] });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.resetPasswordConfirm = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ detail: 'User not found' });

    if (user.reset_otp !== otp) return res.status(400).json({ detail: 'Incorrect OTP' });
    if (new Date() > user.reset_otp_expiry) return res.status(400).json({ detail: 'OTP expired. Request a new one.' });
    if (new_password.length < 8) return res.status(400).json({ detail: 'Password must be at least 8 characters' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    user.reset_otp = null;
    user.reset_otp_expiry = null;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.me = async (req, res) => {
  res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    if (name) req.user.name = name;
    if (bio !== undefined) req.user.bio = bio;
    
    await req.user.save();
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If this email is registered, you will receive an OTP shortly.' });

    const otp = helpers.generateOtp();
    const expires_at = new Date(Date.now() + 15 * 60000);
    
    await EmailOtp.findOneAndUpdate(
      { email },
      { email, otp, expires_at },
      { upsert: true }
    );
    
    sendOtpEmail(email, otp);
    
    res.json({ message: 'If this email is registered, you will receive an OTP shortly.' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email: rawEmail, otp, new_password } = req.body;
    const email = rawEmail.toLowerCase().trim();
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ detail: 'No account with this email' });
    
    const otpDoc = await EmailOtp.findOne({ email });
    if (!otpDoc) return res.status(400).json({ detail: 'No OTP found. Request a new one.' });
    if (otpDoc.otp !== otp) return res.status(400).json({ detail: 'Wrong OTP' });
    if (new Date() > otpDoc.expires_at) return res.status(400).json({ detail: 'OTP expired. Request a new one.' });
    if (new_password.length < 8) return res.status(400).json({ detail: 'Password must be at least 8 characters' });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    user.email_verified = true;
    await user.save();
    
    await EmailOtp.deleteOne({ email });
    const token = helpers.generateToken(user._id, user.role);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};
