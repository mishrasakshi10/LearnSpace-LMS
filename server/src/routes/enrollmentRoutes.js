const express = require("express");
const router = express.Router();

const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Payment = require("../models/Payment");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// POST /api/enrollments
// Free courses can be enrolled in directly.
// Paid courses must go through the demo checkout first.
router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can enroll in courses.",
      });
    }

    const { courseId } = req.body;

    if (!courseId || !String(courseId).trim()) {
      return res.status(400).json({
        message: "Course ID is required.",
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

    // Paid courses cannot bypass the demo checkout.
    if (Number(course.price) > 0) {
      const successfulPayment = await Payment.findOne({
        studentId: req.user.userId,
        courseId: course.courseId,
        status: "successful",
      });

      if (!successfulPayment) {
        return res.status(402).json({
          message: "Please complete the demo payment before enrolling.",
          paymentRequired: true,
        });
      }
    }

    const enrollment = await Enrollment.create({
      studentId: req.user.userId,
      courseId: course.courseId,
      courseTitle: course.title,
    });

    return res.status(201).json({
      message: "Successfully enrolled in the course!",
      enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You are already enrolled in this course.",
      });
    }

    console.error("Enrollment error:", error);

    return res.status(500).json({
      message: "Unable to enroll in the course. Please try again.",
    });
  }
});

// GET /api/enrollments
// Retrieve the current student's enrollments.
router.get("/", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can view student enrollments.",
      });
    }

    const enrollments = await Enrollment.find({
      studentId: req.user.userId,
    }).sort({ enrolledAt: -1 });

    return res.status(200).json({
      enrollments,
    });
  } catch (error) {
    console.error("Fetch enrollments error:", error);

    return res.status(500).json({
      message: "Unable to load enrollments.",
    });
  }
});

module.exports = router;