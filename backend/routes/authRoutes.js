const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { currentUser } = require('../middlewares/authMiddleware');

router.post('/signup', authController.signup);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);
router.post('/reset-password-request', authController.resetPasswordRequest);
router.post('/reset-password-confirm', authController.resetPasswordConfirm);
router.get('/me', currentUser, authController.me);
router.patch('/profile', currentUser, authController.updateProfile);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
