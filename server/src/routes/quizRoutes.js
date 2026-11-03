
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const quizController = require("../controllers/quizController");

router.use(authMiddleware);

const instructorOnly = (req, res, next) => {
  if (req.user.role !== "instructor") {
    return res.status(403).json({
      message: "Access denied. Instructor account required.",
    });
  }

  next();
};

// Instructor creates a quiz
router.post("/", instructorOnly, quizController.createQuiz);

// Logged-in users can view a course quiz
router.get("/:courseId", quizController.getQuizByCourse);

// Logged-in users can submit quiz answers
router.post("/:courseId/submit", quizController.submitQuiz);

module.exports = router;
