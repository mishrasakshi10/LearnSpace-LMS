
const LessonProgress = require("../models/LessonProgress");

// Get progress for one course
const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId || !courseId.trim()) {
      return res.status(400).json({
        message: "Course ID is required.",
      });
    }

    const progress = await LessonProgress.findOne({
      studentId: req.user.userId,
      courseId: courseId.trim(),
    });

    if (!progress) {
      return res.status(200).json({
        courseId: courseId.trim(),
        completedLessons: [],
        totalLessons: 3,
        progressPercentage: 0,
      });
    }

    const progressPercentage = Math.round(
      (progress.completedLessons.length / progress.totalLessons) * 100
    );

    return res.status(200).json({
      courseId: progress.courseId,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
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
    const { courseId, completedLessons, totalLessons } = req.body;

    if (
      typeof courseId !== "string" ||
      !courseId.trim() ||
      !Array.isArray(completedLessons) ||
      !Number.isInteger(totalLessons) ||
      totalLessons < 1
    ) {
      return res.status(400).json({
        message: "Valid courseId, completedLessons, and totalLessons are required.",
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

    // Remove duplicate lesson indexes.
    const uniqueLessons = [...new Set(completedLessons)].sort(
      (a, b) => a - b
    );

    const progress = await LessonProgress.findOneAndUpdate(
      {
        studentId: req.user.userId,
        courseId: courseId.trim(),
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
      (progress.completedLessons.length / progress.totalLessons) * 100
    );

    return res.status(200).json({
      message: "Lesson progress saved successfully.",
      courseId: progress.courseId,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
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
