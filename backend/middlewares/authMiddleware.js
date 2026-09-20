const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'default-dev-secret-change-me-in-production';

// Equivalent to current_user
const currentUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.sub);
    
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
};

// Equivalent to optional_user
const optionalUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.sub);
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }
  next();
};

// Equivalent to require_club_admin
const requireClubAdmin = async (req, res, next) => {
  await currentUser(req, res, () => {
    if (!['club_admin', 'owner', 'faculty_incharge'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Club admin access required' });
    }
    next();
  });
};

// Equivalent to require_owner
const requireOwner = async (req, res, next) => {
  await currentUser(req, res, () => {
    if (!['owner', 'club_admin', 'faculty_incharge'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Owner, Admin or Faculty access required' });
    }
    next();
  });
};

module.exports = {
  currentUser,
  optionalUser,
  requireClubAdmin,
  requireOwner
};
