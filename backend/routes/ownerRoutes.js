const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { requireOwner } = require('../middlewares/authMiddleware');

router.post('/keys', ownerController.getKeys);
router.post('/staff', requireOwner, ownerController.createStaff);
router.get('/staff', requireOwner, ownerController.listStaff);
router.patch('/staff/:user_id/password', requireOwner, ownerController.resetStaffPassword);
router.patch('/staff/:user_id/club', requireOwner, ownerController.assignClub);
router.delete('/staff/:user_id', requireOwner, ownerController.deleteStaff);
router.get('/stats', requireOwner, ownerController.ownerStats);

module.exports = router;
