const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const authMiddleware = require('../middlewares/authMiddleware');

//yêu cầu đăng nhập 
router.use(authMiddleware.verifyToken);

//đăng kí khóa học 
router.post('/', enrollmentController.createEnrollment);

//lấy các khóa học của tôi
router.get('/me', enrollmentController.getMyEnrollments);

//thanh toán
router.post('/payment', enrollmentController.createPayment);
router.get('/payment/callback', enrollmentController.handlePaymentCallback);
router.post('/confirm', enrollmentController.confirmEnrollment);

module.exports = router;