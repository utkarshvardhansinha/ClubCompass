const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { currentUser, optionalUser } = require('../middlewares/authMiddleware');

router.post('/chat', optionalUser, chatController.chat);
router.post('/dm', currentUser, chatController.sendDm);
router.get('/dm/threads/list', currentUser, chatController.getThreads);
router.get('/dm/unread/count', currentUser, chatController.unreadCount);
router.get('/dm/:user_id', currentUser, chatController.getDmThread);

module.exports = router;
