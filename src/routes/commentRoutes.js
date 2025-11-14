const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Lấy danh sách comment theo lesson (public)
router.get('/', commentController.getCommentsByLesson);

// Tạo comment mới (cần đăng nhập)
router.post('/', authMiddleware.verifyToken, authMiddleware.requireRole('student'), commentController.createComment);

// Sửa comment (cần đăng nhập, là chủ comment)
router.put('/:id', authMiddleware.verifyToken, authMiddleware.requireRole('student'), commentController.updateComment);

// Xóa comment (cần đăng nhập, là chủ comment)
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.requireRole('student'), commentController.deleteComment);

// Like/Dislike comment (cần đăng nhập)
router.post('/:id/like', authMiddleware.verifyToken, authMiddleware.requireRole('student'), commentController.likeComment);

// Trả lời comment (cần đăng nhập)
router.post('/:id/reply', authMiddleware.verifyToken, authMiddleware.requireRole('student'), commentController.replyComment);

module.exports = router; 