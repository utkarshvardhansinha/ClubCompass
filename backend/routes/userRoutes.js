const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { currentUser } = require('../middlewares/authMiddleware');

router.get('/search', currentUser, userController.searchUsers);
router.get('/:user_id', currentUser, userController.getUser);

module.exports = router;
