const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/course/:courseId', authMiddleware.verifyToken, lessonController.getLessonsByCourse);
router.get('/:lessonId', lessonController.getLessonById);

// Protected routes
router.get(
  '/',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('teacher', 'admin'),
  lessonController.getLessonPagination
);

router.post(
  '/',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('teacher', 'admin'),
  lessonController.createLesson
);

router.put(
  '/reorder',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('teacher', 'admin'),
  lessonController.reorderLessons
);

router.put(
  '/:lessonId',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('teacher', 'admin'),
  lessonController.updateLesson
);

router.delete(
  '/:lessonId',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('teacher', 'admin'),
  lessonController.deleteLesson
);

// Progress
router.post('/:lessonId/progress', authMiddleware.verifyToken, lessonController.saveProgress);
router.get('/course/:courseId/progress', authMiddleware.verifyToken, lessonController.getProgressByCourse);

module.exports = router;
