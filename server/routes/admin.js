const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.use(verifyAdmin); // Protect all admin routes

// Subjects
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/subjects', verifyAdmin, adminController.createSubject);
router.get('/subjects', verifyAdmin, adminController.getSubjects);
router.delete('/subjects/:id', verifyAdmin, adminController.deleteSubject);

// Questions
router.post('/questions', verifyAdmin, adminController.createQuestion);
router.get('/questions', verifyAdmin, adminController.getQuestions);
router.get('/questions/export', verifyAdmin, adminController.exportQuestions); // Specific route before generic :id
router.put('/questions/bulk-move', verifyAdmin, adminController.bulkMoveQuestions); // Specific route before generic :id
router.delete('/questions/:id', verifyAdmin, adminController.deleteQuestion);
router.put('/questions/:id', verifyAdmin, adminController.updateQuestion);


// User Management
router.get('/users', verifyAdmin, adminController.getUsers);
router.put('/users/:id', verifyAdmin, adminController.updateUser);
router.post('/users', verifyAdmin, adminController.createUser);

// Import Routes (Preview & Confirm)
router.post('/import/preview', verifyAdmin, upload.single('file'), adminController.previewImport);
router.post('/import/confirm', verifyAdmin, adminController.confirmImport);

// Legacy Import (Optional, can be removed if frontend is fully updated)
router.post('/upload-questions', verifyAdmin, upload.single('file'), adminController.uploadQuestions);
router.post('/bulk-questions', verifyAdmin, adminController.bulkCreateQuestions);

// Exams
router.post('/exams', verifyAdmin, adminController.createExam);
router.get('/exams', verifyAdmin, adminController.getExams);
router.delete('/exams/:id', verifyAdmin, adminController.deleteExam);

// Results
router.get('/results', verifyAdmin, adminController.getAllResults);

module.exports = router;
