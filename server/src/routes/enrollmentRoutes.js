
const express = require("express");
const router = express.Router();

const Enrollment = require("../models/Enrollment");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/enrollments
// Enroll the currently logged-in student in a course
router.post("/", authMiddleware, async (req, res) => {
  try {
    // Only students can enroll
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can enroll in courses.",
      });
    }

    const { courseId, courseTitle } = req.body;

    if (
      courseId === undefined ||
      courseId === null ||
      !String(courseId).trim() ||
      typeof courseTitle !== "string" ||
      !courseTitle.trim()
    ) {
      return res.status(400).json({
        message: "Course ID and course title are required.",
      });
    }

    // Always use the verified student ID from the JWT
    const enrollment = await Enrollment.create({
      studentId: req.user.userId,
      courseId: String(courseId).trim(),
      courseTitle: courseTitle.trim(),
    });

    return res.status(201).json({
      message: "Successfully enrolled in the course!",
      enrollment,
    });
  } catch (error) {
    // The unique index blocks duplicate enrollments
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
// Retrieve the current student's enrollments
router.get("/", authMiddleware, async (req, res) => {
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
