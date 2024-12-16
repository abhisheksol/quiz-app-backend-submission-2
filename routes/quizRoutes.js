const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Create a new quiz (admin only)
// router.post('/create', quizController.createQuiz);

// Get all quizzes (admin/user)
router.get('/', quizController.getQuizzes);

// Get quiz details by quiz ID
router.get('/:id', quizController.getQuizDetails);

// Update quiz (admin only)
router.put('/:id', quizController.updateQuiz);

// Delete quiz (admin only)
router.delete('/:id', quizController.deleteQuiz);


  
 
router.post('/submit', quizController.submitQuiz);


router.post('/create-with-questions', quizController.createQuizWithQuestions);


module.exports = router;
