
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const liveClassController = require("../controllers/liveClassController");

router.use(authMiddleware);

// Role restrictions
const instructorOnly = (req, res, next) => {
  if (req.user.role !== "instructor") {
    return res.status(403).json({
      message: "Instructor account required.",
    });
  }

  next();
};

const studentOnly = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({
      message: "Student account required.",
    });
  }

  next();
};

// Instructor: Schedule a live class
router.post(
  "/",
  instructorOnly,
  liveClassController.createLiveClass
);

// Instructor: View own live classes
router.get(
  "/mine",
  instructorOnly,
  liveClassController.getMyLiveClasses
);

// Student: View classes for enrolled courses
router.get(
  "/student",
  studentOnly,
  liveClassController.getStudentLiveClasses
);

// Instructor and enrolled student: Get LiveKit access token
router.post(
  "/:id/token",
  liveClassController.joinLiveClass
);

// Instructor: Update live class status
router.patch(
  "/:id/status",
  instructorOnly,
  liveClassController.updateLiveClassStatus
);

module.exports = router;
