
const mongoose = require("mongoose");

const lessonProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: String,
      required: true,
      trim: true,
    },

    completedLessons: {
      type: [Number],
      default: [],
    },

    totalLessons: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// One progress document per student per course.
lessonProgressSchema.index(
  { studentId: 1, courseId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "LessonProgress",
  lessonProgressSchema
);
