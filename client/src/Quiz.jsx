import { useEffect, useState } from "react";
import "./Quiz.css";

const QUIZ_API_URL = "http://localhost:5000/api/quizzes";

function Quiz({ courseId, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("lmsToken");

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${QUIZ_API_URL}/${encodeURIComponent(courseId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load quiz.");
        }

        setQuiz(data.quiz || null);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId && token) {
      loadQuiz();
    } else {
      setError("Please sign in to access the quiz.");
      setLoading(false);
    }
  }, [courseId, token]);

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setAnswers((previous) => ({
      ...previous,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || submitting) return;

    if (Object.keys(answers).length !== quiz.questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const selectedAnswers = quiz.questions.map(
        (_, index) => answers[index]
      );

      const response = await fetch(
        `${QUIZ_API_URL}/${encodeURIComponent(courseId)}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answers: selectedAnswers,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit quiz.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Quiz submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const restartQuiz = () => {
    setAnswers({});
    setResult(null);
    setError("");
  };

  if (loading) {
    return (
      <main className="quiz-page">
        <div className="quiz-container">
          <p className="quiz-loading">Loading your quiz...</p>
        </div>
      </main>
    );
  }

  if (error && !quiz) {
    return (
      <main className="quiz-page">
        <div className="quiz-container">
          <button className="quiz-back-btn" onClick={onBack}>
            ← Back to course
          </button>

          <div className="quiz-empty">
            <span>📝</span>
            <h2>Quiz unavailable</h2>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <main className="quiz-page">
        <div className="quiz-container">
          <button className="quiz-back-btn" onClick={onBack}>
            ← Back to course
          </button>

          <div className="quiz-empty">
            <span>📚</span>
            <h2>No quiz available yet</h2>
            <p>Your instructor has not added a quiz for this course.</p>
          </div>
        </div>
      </main>
    );
  }

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <main className="quiz-page">
      <div className="quiz-container">
        <button className="quiz-back-btn" onClick={onBack}>
          ← Back to course
        </button>

        <section className="quiz-hero">
          <div className="quiz-hero-icon">📝</div>

          <span className="quiz-eyebrow">LEARNING CHECKPOINT</span>

          <h1>{quiz.title || "Course Quiz"}</h1>

          <p>
            Test your understanding and see how much you have learned.
          </p>

          <div className="quiz-stats">
            <span>📋 {totalQuestions} Questions</span>
            <span>✍️ {answeredCount} Answered</span>
          </div>
        </section>

        {error && (
          <div className="quiz-error" role="alert">
            {error}
          </div>
        )}

        {result ? (
          <section className="quiz-result">
            <div className="quiz-result-icon">
              {result.percentage >= 70 ? "🏆" : "💪"}
            </div>

            <span className="quiz-eyebrow">QUIZ COMPLETED</span>

            <h2>
              {result.percentage >= 70
                ? "Excellent Work!"
                : "Good Effort!"}
            </h2>

            <p>You have successfully submitted your quiz.</p>

            <div className="quiz-score">
              <strong>{result.percentage}%</strong>
              <span>Your Score</span>
            </div>

            <div className="quiz-result-details">
              <div>
                <strong>{result.score}</strong>
                <span>Correct answers</span>
              </div>

              <div>
                <strong>{result.totalQuestions}</strong>
                <span>Total questions</span>
              </div>
            </div>

            <button
              type="button"
              className="quiz-primary-btn"
              onClick={onBack}
            >
              Back to Course →
            </button>

            <button
              type="button"
              className="quiz-secondary-btn"
              onClick={restartQuiz}
            >
              Try Again
            </button>
          </section>
        ) : (
          <>
            <div className="quiz-progress-section">
              <div className="quiz-progress-label">
                <span>Your progress</span>
                <strong>
                  {answeredCount}/{totalQuestions}
                </strong>
              </div>

              <div className="quiz-progress-track">
                <div
                  className="quiz-progress-fill"
                  style={{
                    width: `${(answeredCount / totalQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="quiz-question-list">
              {quiz.questions.map((question, questionIndex) => (
                <article className="quiz-question-card" key={question._id || questionIndex}>
                  <div className="quiz-question-heading">
                    <span className="quiz-question-number">
                      QUESTION {String(questionIndex + 1).padStart(2, "0")}
                    </span>

                    <span className="quiz-question-count">
                      {questionIndex + 1} of {totalQuestions}
                    </span>
                  </div>

                  <h3>{question.questionText}</h3>

                  <div className="quiz-options">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className={`quiz-option ${
                          answers[questionIndex] === optionIndex
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={optionIndex}
                          checked={answers[questionIndex] === optionIndex}
                          onChange={() =>
                            handleAnswerChange(questionIndex, optionIndex)
                          }
                        />

                        <span className="quiz-option-letter">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>

                        <span className="quiz-option-text">{option}</span>

                        {answers[questionIndex] === optionIndex && (
                          <span className="quiz-selected-check">✓</span>
                        )}
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="quiz-submit-section">
              <p>
                {answeredCount === totalQuestions
                  ? "All questions answered. You are ready to submit!"
                  : `You have ${totalQuestions - answeredCount} unanswered question(s).`}
              </p>

              <button
                type="button"
                className="quiz-primary-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Quiz →"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default Quiz;