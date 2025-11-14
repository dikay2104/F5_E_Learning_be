// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require("../middlewares/authMiddleware");

router.get('/', authMiddleware.verifyToken, notificationController.getNotifications);
router.patch('/:id/read', authMiddleware.verifyToken, notificationController.markAsRead);
router.patch('/read/all', authMiddleware.verifyToken, notificationController.markAllAsRead);
router.delete('/:id', authMiddleware.verifyToken, notificationController.deleteNotification);
module.exports = router;