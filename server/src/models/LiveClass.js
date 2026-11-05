
const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    courseId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    courseTitle: {
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

    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
      default: 60,
    },

    roomName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LiveClass", liveClassSchema);
