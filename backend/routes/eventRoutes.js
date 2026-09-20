const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { currentUser, requireClubAdmin, optionalUser } = require('../middlewares/authMiddleware');

router.post('/', requireClubAdmin, eventController.createEvent);
router.get('/', optionalUser, eventController.getEvents);
router.post('/:event_id/interested', currentUser, eventController.toggleInterested);
router.delete('/:event_id', requireClubAdmin, eventController.deleteEvent);

module.exports = router;
