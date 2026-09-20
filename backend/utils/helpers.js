const jwt = require('jsonwebtoken');

const COLLEGE_DOMAIN = process.env.COLLEGE_DOMAIN || 'nitkkr.ac.in';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'utkarshvardhansinha.dev@gmail.com';
const YEAR_PREFIX_MAP = { '1251': 1, '1241': 2, '1231': 2, '1221': 3, '1211': 4 };
const BRANCH_MAP = {
  '01': 'CE', '02': 'CS', '03': 'IT', '04': 'EE', '05': 'EC', '06': 'ME',
  '07': 'PI', '08': 'AI', '09': 'II', '10': 'MC', '11': 'RA', '12': 'AD',
  '13': 'MV', '14': 'SE', '15': 'BA', '16': 'MCA', '17': 'MBA', '18': 'MSc', '19': 'PhD'
};

const extractRollInfo = (roll) => {
  roll = roll.trim().toUpperCase();
  const prefix = roll.substring(0, 4);
  const year = YEAR_PREFIX_MAP[prefix];
  const branchCode = roll.length >= 6 ? roll.substring(4, 6) : '??';
  const branch = BRANCH_MAP[branchCode] || branchCode;
  return { year, branch, prefix };
};

const validateCollegeEmail = (email) => {
  return email.toLowerCase().endsWith(`@${COLLEGE_DOMAIN}`);
};

const isOwnerEmail = (email) => {
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
};

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET_KEY || 'default-dev-secret-change-me-in-production';
  return jwt.sign({ sub: userId, role }, secret, { expiresIn: '7d' });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOwnerEmail = () => OWNER_EMAIL;
const getAdminPassword = () => process.env.ADMIN_PASSWORD || 'admin123';

module.exports = {
  extractRollInfo,
  validateCollegeEmail,
  isOwnerEmail,
  generateToken,
  generateOtp,
  getOwnerEmail,
  getAdminPassword
};
