
const LessonProgress = require("../models/LessonProgress");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

// Verify that the logged-in student is enrolled
const verifyEnrollment = async (studentId, courseId) => {
  return await Enrollment.findOne({
    studentId,
    courseId,
    status: { $in: ["enrolled", "completed"] },
  });
};

// Get progress for one course
const getProgress = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can access course progress.",
      });
    }

    const { courseId } = req.params;

    if (typeof courseId !== "string" || !courseId.trim()) {
      return res.status(400).json({
        message: "Course ID is required.",
      });
    }

    const cleanCourseId = courseId.trim();

    const enrollment = await verifyEnrollment(
      req.user.userId,
      cleanCourseId
    );

    if (!enrollment) {
      return res.status(403).json({
        message: "You must enroll in this course to access progress.",
      });
    }

    const course = await Course.findOne({
      courseId: cleanCourseId,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const totalLessons = course.lessons.length;

    const progress = await LessonProgress.findOne({
      studentId: req.user.userId,
      courseId: cleanCourseId,
    });

    const completedLessons = progress
      ? progress.completedLessons.filter(
          (index) => Number.isInteger(index) &&
            index >= 0 &&
            index < totalLessons
        )
      : [];

    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : 0;

    return res.status(200).json({
      courseId: cleanCourseId,
      completedLessons,
      totalLessons,
      progressPercentage,
    });
  } catch (error) {
    console.error("Get progress error:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve lesson progress.",
    });
  }
};

// Save progress for one course
const saveProgress = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can update course progress.",
      });
    }

    const { courseId, completedLessons } = req.body;

    if (
      typeof courseId !== "string" ||
      !courseId.trim() ||
      !Array.isArray(completedLessons)
    ) {
      return res.status(400).json({
        message: "Valid courseId and completedLessons are required.",
      });
    }

    const cleanCourseId = courseId.trim();

    const enrollment = await verifyEnrollment(
      req.user.userId,
      cleanCourseId
    );

    if (!enrollment) {
      return res.status(403).json({
        message: "You must enroll in this course before updating progress.",
      });
    }

    const course = await Course.findOne({
      courseId: cleanCourseId,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const totalLessons = course.lessons.length;

    if (totalLessons < 1) {
      return res.status(400).json({
        message: "This course does not have any lessons yet.",
      });
    }

    const validLessons = completedLessons.every(
      (lessonIndex) =>
        Number.isInteger(lessonIndex) &&
        lessonIndex >= 0 &&
        lessonIndex < totalLessons
    );

    if (!validLessons) {
      return res.status(400).json({
        message: "Completed lesson indexes are invalid.",
      });
    }

    const uniqueLessons = [...new Set(completedLessons)].sort(
      (a, b) => a - b
    );

    const progress = await LessonProgress.findOneAndUpdate(
      {
        studentId: req.user.userId,
        courseId: cleanCourseId,
      },
      {
        $set: {
          completedLessons: uniqueLessons,
          totalLessons,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const progressPercentage = Math.round(
      (progress.completedLessons.length / totalLessons) * 100
    );

    return res.status(200).json({
      message: "Lesson progress saved successfully.",
      courseId: progress.courseId,
      completedLessons: progress.completedLessons,
      totalLessons,
      progressPercentage,
    });
  } catch (error) {
    console.error("Save progress error:", error.message);

    return res.status(500).json({
      message: "Failed to save lesson progress.",
    });
  }
};

module.exports = {
  getProgress,
  saveProgress,
};
