const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware.verifyToken);

// Lưu tiến độ xem video
router.post('/lesson/:lessonId', progressController.saveProgress);

// Lấy tiến độ các bài học trong khóa học
router.get('/course/:courseId', progressController.getProgressByCourse);

// Lấy tiến độ tổng quan của user
router.get('/user', progressController.getUserProgress);

// Lấy tiến độ chi tiết của một bài học
router.get('/lesson/:lessonId', progressController.getLessonProgress);

// Xóa tiến độ của một bài học (reset progress)
router.delete('/lesson/:lessonId', progressController.deleteLessonProgress);

// Lấy thống kê tiến độ cho teacher (xem tiến độ học viên)
router.get('/course/:courseId/stats', progressController.getCourseProgressStats);

module.exports = router; 