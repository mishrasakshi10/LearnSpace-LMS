
const Quiz = require("../models/Quiz");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// Create a quiz for an instructor's own course
exports.createQuiz = async (req, res) => {
  try {
    const { courseId, title, questions } = req.body;

    if (
      typeof courseId !== "string" ||
      !courseId.trim() ||
      typeof title !== "string" ||
      !title.trim() ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        message: "Course ID, quiz title, and questions are required.",
      });
    }

    // Verify that the course belongs to this instructor
    const course = await Course.findOne({
      courseId: courseId.trim(),
      instructorId: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found or you do not have permission.",
      });
    }

    // Validate questions
    for (const question of questions) {
      if (
        typeof question.questionText !== "string" ||
        !question.questionText.trim() ||
        !Array.isArray(question.options) ||
        question.options.length < 2 ||
        question.options.some(
          (option) =>
            typeof option !== "string" || !option.trim()
        ) ||
        !Number.isInteger(question.correctAnswer) ||
        question.correctAnswer < 0 ||
        question.correctAnswer >= question.options.length
      ) {
        return res.status(400).json({
          message:
            "Please provide valid questions, options, and correct answers.",
        });
      }
    }

    const quiz = await Quiz.create({
      courseId: course.courseId,
      title: title.trim(),
      questions: questions.map((question) => ({
        questionText: question.questionText.trim(),
        options: question.options.map((option) => option.trim()),
        correctAnswer: question.correctAnswer,
      })),
    });

    return res.status(201).json({
      message: "Quiz created successfully.",
      quiz,
    });
  } catch (error) {
    console.error("Create quiz error:", error);

    return res.status(500).json({
      message: "Unable to create quiz.",
    });
  }
};

// Get quiz for a course (hide correct answers)
exports.getQuizByCourse = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      courseId: req.params.courseId,
    }).select("-questions.correctAnswer");

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found for this course.",
      });
    }

    return res.status(200).json({ quiz });
  } catch (error) {
    console.error("Get quiz error:", error);

    return res.status(500).json({
      message: "Unable to load quiz.",
    });
  }
};

// Submit quiz answers and calculate score
exports.submitQuiz = async (req, res) => {
  try {
    // Only students can submit quizzes
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can attempt quizzes.",
      });
    }

    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be provided as an array.",
      });
    }

    // Find quiz
    const quiz = await Quiz.findOne({
      courseId: req.params.courseId,
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }

    // Verify student enrollment
    const enrollment = await Enrollment.findOne({
      studentId: req.user.userId,
      courseId: req.params.courseId,
      status: { $in: ["enrolled", "completed"] },
    });

    if (!enrollment) {
      return res.status(403).json({
        message:
          "You must be enrolled in this course to attempt the quiz.",
      });
    }

    // Validate submitted answers
    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        message: "Please answer every question.",
      });
    }

    const validAnswers = answers.every(
      (answer, index) =>
        Number.isInteger(answer) &&
        answer >= 0 &&
        answer < quiz.questions[index].options.length
    );

    if (!validAnswers) {
      return res.status(400).json({
        message: "One or more submitted answers are invalid.",
      });
    }

    // Calculate score on the server
    let score = 0;

    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        score++;
      }
    });

    const percentage = Math.round(
      (score / quiz.questions.length) * 100
    );

    return res.status(200).json({
      message: "Quiz submitted successfully.",
      totalQuestions: quiz.questions.length,
      score,
      percentage,
    });
  } catch (error) {
    console.error("Submit quiz error:", error);

    return res.status(500).json({
      message: "Unable to submit quiz.",
    });
  }
};
