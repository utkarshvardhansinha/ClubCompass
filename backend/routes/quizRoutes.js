const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { currentUser } = require('../middlewares/authMiddleware');

router.get('/questions', quizController.questions);
router.post('/submit', currentUser, quizController.submitQuiz);
router.get('/result', currentUser, quizController.quizResult);

module.exports = router;
