const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const authMiddleware = require("../middlewares/authMiddleware");

// Lấy danh sách khóa học chờ phê duyệt (chỉ admin)
router.get(
  "/pending",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("admin"),
  courseController.getPendingCourses
);
// Phê duyệt khóa học (chỉ admin)
router.put('/:courseId/approve', authMiddleware.verifyToken, authMiddleware.requireRole('admin'), courseController.approveCourse);
// Từ chối khóa học (chỉ admin)
router.put('/:courseId/reject', authMiddleware.verifyToken, authMiddleware.requireRole('admin'), courseController.rejectCourse);


// Public routes: Xem danh sách & chi tiết khoá học
router.get('/', courseController.getAllCourse);
router.get('/pagination', authMiddleware.verifyToken, courseController.getCoursePagination);
router.get('/:courseId', authMiddleware.verifyToken, courseController.getCourseById);

// Protected routes: Chỉ giáo viên hoặc admin mới được tạo/sửa/xoá
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("teacher", "admin"),
  courseController.createCourse
);

router.put(
  "/:courseId",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("teacher", "admin"),
  courseController.updateCourse
);

router.delete(
  "/:courseId",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("teacher", "admin"),
  courseController.deleteCourse
);

router.put(
  "/:courseId/submit",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("teacher", "admin"),
  courseController.submitCourse
);

router.get('/:courseId', courseController.getCourseById);


module.exports = router;
