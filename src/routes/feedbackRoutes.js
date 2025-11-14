const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const authMiddleware = require("../middlewares/authMiddleware");

// Cho phép public lấy feedbacks theo course (nếu có query course)
router.get("/", feedbackController.getAllFeedbacks);

// Lấy danh sách tất cả feedback (admin)
router.get(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("admin"),
  feedbackController.getAllFeedbacks
);

// Xóa feedback 
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("admin"),
  feedbackController.deleteFeedback
);

// Admin reply feedback 
router.post(
  "/:id/reply",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("admin"),
  feedbackController.replyFeedback
);

// Student gửi feedback
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("student"),
  feedbackController.createFeedback
);

module.exports = router;
