
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    // Keep the course ID compatible with existing enrollment records.
    courseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    instructorName: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },

    // Lessons belonging to this course.
    lessons: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },

        description: {
          type: String,
          default: "",
        },

        videoUrl: {
          type: String,
          default: "",
        },

        order: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);
