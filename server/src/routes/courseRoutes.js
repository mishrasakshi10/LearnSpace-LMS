
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const courseController = require("../controllers/courseController");

// All routes require a valid login.
router.use(authMiddleware);

// Only instructors can create, edit, delete courses and manage lessons.
const instructorOnly = (req, res, next) => {
  if (req.user.role !== "instructor") {
    return res.status(403).json({
      message: "Access denied. Instructor account required.",
    });
  }

  next();
};

// Create a course (Instructor only)
router.post("/", instructorOnly, courseController.createCourse);

// List courses belonging to the logged-in instructor
router.get("/mine", instructorOnly, courseController.getMyCourses);

// List all courses for logged-in users
router.get("/", courseController.getAllCourses);

// Get one course with its lessons
router.get("/:courseId", courseController.getCourseById);

// Add a lesson (Instructor only)
router.post(
  "/:courseId/lessons",
  instructorOnly,
  courseController.addLesson
);

// Delete a lesson (Instructor only)
router.delete(
  "/:courseId/lessons/:lessonId",
  instructorOnly,
  courseController.deleteLesson
);

// Update a course (Instructor only)
router.put("/:courseId", instructorOnly, courseController.updateCourse);

// Delete a course (Instructor only)
router.delete("/:courseId", instructorOnly, courseController.deleteCourse);

module.exports = router;
