// controllers/enrollmentController.js

const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { createPaymentUrl } = require('../services/payosService');
const { sendCourseEnrollmentEmail } = require('../services/emailService');


// =========================
//  CREATE ENROLLMENT (FREE)
// =========================
const createEnrollment = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  try {
    const existing = await Enrollment.findOne({ course: courseId, user: userId });

    if (existing && existing.status === "active") {
      return res.status(400).json({ message: "You are already enrolled." });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.price === 0) {
      const enrollment = new Enrollment({
        course: courseId,
        user: userId,
        status: "active"
      });

      await enrollment.save();
      await Course.findByIdAndUpdate(courseId, { $inc: { studentsCount: 1 } });

      return res.status(201).json({
        message: "Enrolled in free course successfully!",
        data: enrollment
      });
    }

    return res.json({
      message: "This is a paid course",
      paymentRequired: true
    });

  } catch (err) {
    console.error("Create enrollment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// =============================
//  GET ENROLLMENTS OF USER
// =============================
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      user: req.user.id,
      status: "active"
    }).populate("course");

    res.json({ data: enrollments });

  } catch (err) {
    console.error("Get enrollments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// =============================
//  CREATE PAYMENT (PAYOS)
// =============================
const createPayment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status !== "approved")
      return res.status(400).json({ message: "Course not approved" });

    let existing = await Enrollment.findOne({ user: userId, course: courseId });

    if (existing?.status === "active")
      return res.status(400).json({ message: "Already enrolled" });

    if (existing?.status === "pending_payment")
      return res.status(400).json({ message: "Pending transaction exists" });

    // Create new enrollment
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
      status: "pending_payment",
      enrolledAt: new Date()
    });

    await enrollment.save();

    // Create orderCode for PayOS
    const orderCode = Number(`${Date.now()}`.slice(-9));
    const amount = course.price;
    const description = `Pay course: ${course.title}`;

    const returnUrl =
    process.env.CLIENT_URL +
    `/payment/success?orderCode=${orderCode}&courseId=${courseId}`;

    const cancelUrl = process.env.CLIENT_URL + `/payment/cancel`;

    // Create PayOS link
    const checkoutUrl = await createPaymentUrl(
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl
    );

    // Save payment info
    enrollment.payment = {
      orderId: orderCode,
      amount,
      status: "pending",
      paymentUrl: checkoutUrl
    };

    await enrollment.save();

    res.json({
      message: "Payment created",
      paymentUrl: checkoutUrl,
      enrollmentId: enrollment._id
    });

  } catch (err) {
    console.error("PayOS createPayment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// =============================
//  CONFIRM PAYMENT (OPTIONAL)
// =============================
const confirmEnrollment = async (req, res) => {
  try {
    const { orderCode } = req.body;

    const enrollment = await Enrollment.findOne({
      "payment.orderId": orderCode
    }).populate("course").populate("user"); // populate thêm user & course

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    if (enrollment.status === "active") {
      return res.json({ message: "Already active" }); 
    }

    enrollment.status = "active";
    enrollment.payment.status = "completed";
    enrollment.payment.completedAt = new Date();

    await enrollment.save();
    await Course.findByIdAndUpdate(enrollment.course._id || enrollment.course, { $inc: { studentsCount: 1 } });

    // Gửi email thông tin khóa học, không để lỗi email làm fail confirm
    try {
      await sendCourseEnrollmentEmail(enrollment.user, enrollment.course);
    } catch (emailErr) {
      console.error("Send course enrollment email error:", emailErr);
    }

    res.json({ message: "Enrollment confirmed" });

  } catch (err) {
    console.error("Confirm enrollment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  createEnrollment,
  getMyEnrollments,
  createPayment,
  confirmEnrollment
};
