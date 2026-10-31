
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const courseController = require("../controllers/courseController");

// All routes require a valid login.
router.use(authMiddleware);

// Only instructors can create, edit, or delete their own courses.
const instructorOnly = (req, res, next) => {
  if (req.user.role !== "instructor") {
    return res.status(403).json({
      message: "Access denied. Instructor account required.",
    });
  }

  next();
};

// Create a course
router.post("/", instructorOnly, courseController.createCourse);

// List courses belonging to the logged-in instructor
router.get("/mine", instructorOnly, courseController.getMyCourses);

// Update a course
router.put("/:courseId", instructorOnly, courseController.updateCourse);

// Delete a course
router.delete("/:courseId", instructorOnly, courseController.deleteCourse);

module.exports = router;
