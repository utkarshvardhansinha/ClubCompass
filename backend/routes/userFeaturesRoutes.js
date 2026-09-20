const express = require('express');
const router = express.Router();
const userFeaturesController = require('../controllers/userFeaturesController');
const { currentUser, optionalUser } = require('../middlewares/authMiddleware');

router.post('/bookmarks', currentUser, userFeaturesController.addBookmark);
router.get('/bookmarks', currentUser, userFeaturesController.getBookmarks);
router.delete('/bookmarks/:club_id', currentUser, userFeaturesController.removeBookmark);

router.post('/watchlist', currentUser, userFeaturesController.addWatchlist);
router.get('/watchlist', currentUser, userFeaturesController.getWatchlist);
router.patch('/watchlist/:club_id', currentUser, userFeaturesController.updateNote);
router.delete('/watchlist/:club_id', currentUser, userFeaturesController.removeWatchlist);

router.post('/reviews', currentUser, userFeaturesController.createReview);
router.get('/reviews/:club_id', optionalUser, userFeaturesController.getReviews);
router.delete('/reviews/:review_id', currentUser, userFeaturesController.deleteReview);

router.get('/profile/:user_id', optionalUser, userFeaturesController.getProfile);

module.exports = router;
