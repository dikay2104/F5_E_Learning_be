const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

//---- Router tĩnh -----

// Lấy danh sách tất cả user (chỉ admin)
router.get(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("admin"),
  userController.getAllUsers
);

// Ban user (chỉ admin)
router.put('/:id/ban', authMiddleware.verifyToken, authMiddleware.requireRole('admin'), userController.banUser);
// Unban user (chỉ admin)
router.put('/:id/unban', authMiddleware.verifyToken, authMiddleware.requireRole('admin'), userController.unbanUser);

// [GET] /api/users/profile - yêu cầu token
router.get(
  "/profile/me",
  authMiddleware.verifyToken,
  userController.getCurrentUserProfile
);
router.put(
  "/profile",
  authMiddleware.verifyToken,
  userController.updateUserProfile
);
// [GET] test middleware
router.get(
  "/admin-data",
  authMiddleware.verifyToken,
  authMiddleware.requireRole("admin"),
  (req, res) => {
    res.json({ message: "Chào admin!" });
  }
);

//---- Router động -----
// [GET] /api/users/:id - công khai (test)
router.get("/:id", userController.getUserProfile);

module.exports = router;
