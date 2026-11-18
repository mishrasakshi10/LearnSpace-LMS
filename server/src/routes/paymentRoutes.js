const express = require("express");
const router = express.Router();

const Course = require("../models/Course");
const Payment = require("../models/Payment");
const Enrollment = require("../models/Enrollment");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// POST /api/payments/demo-checkout
// This is a demonstration only. No real money is charged.
router.post("/demo-checkout", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can make course payments.",
      });
    }

    const { courseId, outcome } = req.body;

    if (!courseId || !["success", "failed"].includes(outcome)) {
      return res.status(400).json({
        message: "A valid course ID and payment outcome are required.",
      });
    }

    const course = await Course.findOne({
      courseId: String(courseId).trim(),
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      studentId: req.user.userId,
      courseId: course.courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        message: "You are already enrolled in this course.",
        enrollment: existingEnrollment,
      });
    }

    const isSuccessful = outcome === "success";

    const payment = await Payment.create({
      studentId: req.user.userId,
      instructorId: course.instructorId,
      courseId: course.courseId,
      courseTitle: course.title,
      amount: Number(course.price) || 0,
      currency: "INR",
      paymentMethod: "Demo Payment",
      transactionId: `DEMO-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`,
      status: isSuccessful ? "successful" : "failed",
      paidAt: isSuccessful ? new Date() : null,
    });

    if (!isSuccessful) {
      return res.status(200).json({
        message: "Demo payment failed. You have not been enrolled.",
        payment,
        enrollment: null,
      });
    }

    const enrollment = await Enrollment.create({
      studentId: req.user.userId,
      courseId: course.courseId,
      courseTitle: course.title,
    });

    return res.status(201).json({
      message: "Demo payment successful! You are now enrolled.",
      payment,
      enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You are already enrolled in this course.",
      });
    }

    console.error("Demo payment error:", error);

    return res.status(500).json({
      message: "Unable to process demo payment. Please try again.",
    });
  }
});

// GET /api/payments/instructor/revenue
// Show revenue belonging only to the logged-in instructor.
router.get("/instructor/revenue", async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({
        message: "Only instructors can view revenue.",
      });
    }

    const instructorId = req.user.userId;

    const successfulPayments = await Payment.find({
      instructorId,
      status: "successful",
    }).sort({ paidAt: -1 });

    const failedPayments = await Payment.find({
      instructorId,
      status: "failed",
    }).sort({ createdAt: -1 });

    const totalRevenue = successfulPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    const courseRevenueMap = {};

    successfulPayments.forEach((payment) => {
      const id = payment.courseId;

      if (!courseRevenueMap[id]) {
        courseRevenueMap[id] = {
          courseId: id,
          courseTitle: payment.courseTitle,
          totalRevenue: 0,
          successfulPayments: 0,
        };
      }

      courseRevenueMap[id].totalRevenue += payment.amount;
      courseRevenueMap[id].successfulPayments += 1;
    });

    return res.status(200).json({
      totalRevenue,
      successfulPayments: successfulPayments.length,
      failedPayments: failedPayments.length,
      courseRevenue: Object.values(courseRevenueMap).sort(
        (a, b) => b.totalRevenue - a.totalRevenue
      ),
      recentTransactions: [...successfulPayments, ...failedPayments]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
        .slice(0, 10),
    });
  } catch (error) {
    console.error("Instructor revenue error:", error);

    return res.status(500).json({
      message: "Unable to load instructor revenue.",
    });
  }
});

module.exports = router;