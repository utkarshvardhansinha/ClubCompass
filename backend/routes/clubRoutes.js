const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const { requireClubAdmin } = require('../middlewares/authMiddleware');

router.get('/', clubController.getClubs);
router.post('/', requireClubAdmin, clubController.createClub);
router.get('/:club_id', clubController.getClub);
router.patch('/:club_id', requireClubAdmin, clubController.updateClub);
router.delete('/:club_id', requireClubAdmin, clubController.deleteClub);

module.exports = router;
