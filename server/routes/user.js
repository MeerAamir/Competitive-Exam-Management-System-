const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/exams', userController.getAvailableExams);
router.get('/exam/:id/questions', userController.getExamQuestions); // New endpoint for fetching questions
router.post('/exam/submit', userController.submitExam);
router.get('/my-results', userController.getMyResults);

module.exports = router;
