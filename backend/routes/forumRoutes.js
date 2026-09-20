const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { currentUser, optionalUser } = require('../middlewares/authMiddleware');

// Posts
router.get('/posts', optionalUser, forumController.getPosts);
router.get('/posts/v2', optionalUser, forumController.getPosts);
router.get('/posts/:post_id', optionalUser, forumController.getPost);
router.post('/posts', currentUser, forumController.createPost);
router.post('/posts/anon', currentUser, forumController.createAnonPost);
router.post('/posts/:post_id/upvote', currentUser, forumController.upvotePost);
router.delete('/posts/:post_id', currentUser, forumController.deletePost);

// Comments
router.get('/posts/:post_id/comments', optionalUser, forumController.getComments);
router.post('/posts/:post_id/comments', currentUser, forumController.addComment);
router.delete('/comments/:comment_id', currentUser, forumController.deleteComment);

// Polls
router.get('/polls', optionalUser, forumController.getPolls);
router.post('/polls', currentUser, forumController.createPoll);
router.post('/polls/:poll_id/vote/:option_idx', currentUser, forumController.votePoll);
router.delete('/polls/:poll_id', currentUser, forumController.deletePoll);

module.exports = router;
