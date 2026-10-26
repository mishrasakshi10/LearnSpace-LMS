
const express = require("express");
const router = express.Router();

const {
  getProgress,
  saveProgress,
} = require("../controllers/progressController");

const authMiddleware = require("../middleware/authMiddleware");

// Retrieve progress for a course
router.get("/:courseId", authMiddleware, getProgress);

// Save progress for a course
router.put("/", authMiddleware, saveProgress);

module.exports = router;
