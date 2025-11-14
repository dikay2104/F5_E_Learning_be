const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const vnpayService = require('../services/vnpayService');

//đăng kí khóa học
const createEnrollment = async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.id;

    try {
        //kiểm tra xem đã đăng kí chưa
        const existingEnrollment = await Enrollment.findOne({ course: courseId, user: userId });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'You are already enrollment in this course.' });
        }
        //lấy thông tin khóa học
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        //xử lí khóa học free và mua
        if (course.price === 0) {
            //khóa học miễn phí
            const newEnrollment = new Enrollment({
                course: courseId,
                user: userId,
                status: 'active'
            });
            await newEnrollment.save();

            //tăng số lượng học viên
            course.studentsCount += 1;
            await course.save();

            res.status(201).json({
                message: 'Successfully enrollment in the free coursed!',
                data: newEnrollment
            });

        } else {
            //khóa học trả khí sử dụng vnpay
            res.status(200).json({
                message: 'This is a paid course. Redirecting to payment...',
                paymentRequired: true,
            });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error enrolling in course', error: err.message });
    }
};

//lấy các khóa học đã đăng kí 
const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({
            user: req.user.id,
            status: 'active'
        })
        .populate({
            path: 'course',
            select: 'title thumbnail description duration price studentsCount level category'
        });
        res.status(200).json({ data: enrollments });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching enrollments', error: err.message });
    }
};

//thanh toán khóa học có trả phí 
const createPayment = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;

        //Kiểm tra khóa học 
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(400).json({ message: 'The course does not exist.' });
        }

        if (course.status !== 'approved') {
            return res.status(400).json({ message: 'The course has not been approved yet' });
        }
        
        //kiểm tra đã đăng kí chưa
        const existingEnrollment = await Enrollment.findOne({
            user: userId,
            course: courseId
        });

        if (existingEnrollment) {
            if (existingEnrollment.status === 'active') {
                return res.status(400).json({ message: 'You have already enrolled in this course.'});
            }
            if (existingEnrollment.status === 'pending_payment') {
                return res.status(400).json({ message: 'You already have a pending payment transaction.'});
            }
        }

        //tạo enrollment với pending payment
        const enrollment = new Enrollment({
            user: userId,
            course: courseId,
            status: 'pending_payment',
            enrolledAt: new Date()
        });
        await enrollment.save();

        //tạo thông tin thanh toán
        const orderId = `ENROLL_${enrollment._id}_${Date.now()}`;
        const orderInfo = `Course payment: ${course.title}`;
        const amount = course.price;

        //tạo url thanh toán VNpay
        const paymentUrl = vnpayService.createPaymentUrl(req, amount, orderInfo, orderId);

        //cập nhật enrollment với thông tin thanh toán
        enrollment.payment = {
            orderId: orderId,
            amount: amount,
            paymentUrl: paymentUrl,
            status: 'pending'
        };
        await enrollment.save();

        res.json({
            message: 'Payment created successfully.',
            paymentUrl: paymentUrl,
            enrollmentId: enrollment._id
        });
    } catch (error) {
        console.error('Payment creation failed: ', error);
        res.status(500).json({ message: 'Server error.' });
    } 
};

//xử lý callback từ vnpay
const handlePaymentCallback = async (req, res) => {
    try {
        const vnp_Params = req.query;

        //xác thực chữ ký
        const isValidSignature = vnpayService.verifyReturn(vnp_Params);

        if (!isValidSignature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        const orderId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionNo = vnp_Params['vnp_TransactionNo'];

        //tìm enrollment dựa trên orderId
        const enrollment = await Enrollment.findOne({
            'payment.orderId': orderId
        }).populate('course');

        if (!enrollment) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (responseCode === '00') {
            // Chỉ update và tăng studentsCount nếu trạng thái chưa active (atomic)
            const updated = await Enrollment.findOneAndUpdate(
              { 'payment.orderId': orderId, status: { $ne: 'active' } },
              {
                $set: {
                  status: 'active',
                  'payment.status': 'completed',
                  'payment.transactionNo': transactionNo,
                  'payment.completedAt': new Date()
                }
              }
            );
            if (updated) {
              await Course.findByIdAndUpdate(
                enrollment.course._id,
                { $inc: { studentsCount: 1 } }
              );
            }
            res.json({
                message: 'Payment successful',
                enrollmentId: enrollment._id
            });
        } else {
            //thanh toán thất bại
            enrollment.status = 'cancelled';
            enrollment.payment.status = 'failed';
            enrollment.payment.failedAt = new Date();
            await enrollment.save();

            res.json({
                message: 'Payment failed',
                enrollmentId: enrollment._id
            });
        }
    } catch (error) {
        console.error('Callback processing error:', error);
        res.status(500).json({ message: 'Server error'});
    }
};

const confirmEnrollment = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('FE gửi orderId:', orderId);
    const enrollment = await Enrollment.findOne({ 'payment.orderId': orderId });
    if (!enrollment) {
      console.log('Không tìm thấy enrollment với orderId:', orderId);
      return res.status(404).json({ message: 'Enrollment not found', orderId });
    }
    if (enrollment.status === 'active') {
      console.log('Enrollment đã active:', enrollment._id);
      return res.json({ message: 'Already active' });
    }
    // Chỉ update và tăng studentsCount nếu trạng thái chưa active (atomic)
    const updated = await Enrollment.findOneAndUpdate(
      { 'payment.orderId': orderId, status: { $ne: 'active' } },
      {
        $set: {
          status: 'active',
          'payment.status': 'completed',
          'payment.completedAt': new Date()
        }
      }
    );
    if (updated) {
      await Course.findByIdAndUpdate(
        enrollment.course,
        { $inc: { studentsCount: 1 } }
      );
    }
    console.log('Xác nhận enrollment thành công:', enrollment._id);
    res.json({ message: 'Enrollment confirmed' });
  } catch (err) {
    console.error('Lỗi xác nhận enrollment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
    createEnrollment,
    getMyEnrollments,
    createPayment, 
    handlePaymentCallback,
    confirmEnrollment
};
