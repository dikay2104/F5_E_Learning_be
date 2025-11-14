const express = require('express');
const { getTeacherStatistics } = require('../controllers/statisticsController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/teacher', authMiddleware.verifyToken, getTeacherStatistics);

module.exports = router;
