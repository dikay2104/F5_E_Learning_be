const express = require('express');
const { getAdminSummary, getMonthlyRevenue } = require('../controllers/adminStatsController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get(
  '/summary',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  getAdminSummary
);

router.get(
  '/revenue-by-month',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  getMonthlyRevenue
);

module.exports = router;