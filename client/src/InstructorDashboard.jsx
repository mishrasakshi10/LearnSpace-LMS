import { useEffect, useMemo, useState } from "react";
import "./InstructorDashboard.css";
import LiveClassroom from "./LiveClassroom";
import Logo from "./Logo";

const API_URL = "http://localhost:5000/api/courses";
const QUIZ_API_URL = "http://localhost:5000/api/quizzes";
const LIVE_CLASS_API_URL = "http://localhost:5000/api/live-classes";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  level: "Beginner",
  price: "",
  image: "",
};

const emptyLessonForm = {
  title: "",
  description: "",
  videoUrl: "",
};

const emptyLiveClassForm = {
  title: "",
  description: "",
  courseId: "",
  scheduledDate: "",
  scheduledTime: "",
  duration: 60,
};

const createEmptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
});

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("lmsUser") || "{}");
  } catch {
    return {};
  }
}

function getCourseStyle(course) {
  const title = (course.title || "").toLowerCase();
  const category = (course.category || "").toLowerCase();
  const value = `${title} ${category}`;

  if (value.includes("mysql") || value.includes("database") || value.includes("sql")) {
    return { icon: "🗄️", theme: "cyan" };
  }
  if (value.includes("java")) return { icon: "☕", theme: "orange" };
  if (value.includes("python")) return { icon: "🐍", theme: "blue" };
  if (value.includes("react")) return { icon: "⚛️", theme: "cyan" };
  if (value.includes("javascript")) return { icon: "JS", theme: "yellow" };
  if (value.includes("html") || value.includes("css")) return { icon: "🌐", theme: "pink" };
  if (value.includes("node")) return { icon: "🟢", theme: "green" };

  return { icon: "💻", theme: "violet" };
}

function getTodayLocalDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function InstructorDashboard({ user: userProp, onSignOut }) {
  const [user, setUser] = useState(userProp || getStoredUser());
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonSaving, setLessonSaving] = useState(false);

  // Quiz management state
  const [quizCourseId, setQuizCourseId] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([createEmptyQuestion()]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSaving, setQuizSaving] = useState(false);
  const [existingQuiz, setExistingQuiz] = useState(null);
  const [quizStatus, setQuizStatus] = useState("");

  // Live Classes state
  const [liveClasses, setLiveClasses] = useState([]);
  const [liveClassForm, setLiveClassForm] = useState(emptyLiveClassForm);
  const [liveClassLoading, setLiveClassLoading] = useState(false);
  const [liveClassSaving, setLiveClassSaving] = useState(false);

  // Active LiveKit classroom
  const [activeLiveClass, setActiveLiveClass] = useState(null);

  useEffect(() => {
    if (userProp) setUser(userProp);
  }, [userProp]);

  const requestApi = async (url, options = {}) => {
    const token = localStorage.getItem("lmsToken");

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || "Something went wrong.");
    }

    return data;
  };

  const loadCourses = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await requestApi(`${API_URL}/mine`);
      setCourses(Array.isArray(data) ? data : data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveClasses = async () => {
    setLiveClassLoading(true);
    setError("");

    try {
      const data = await requestApi(`${LIVE_CLASS_API_URL}/mine`);
      setLiveClasses(data.liveClasses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLiveClassLoading(false);
    }
  };

  // Schedule a live class
  const handleLiveClassSubmit = async (e) => {
    e.preventDefault();
    setLiveClassSaving(true);
    setError("");
    setMessage("");

    try {
      const scheduledAt = new Date(
        `${liveClassForm.scheduledDate}T${liveClassForm.scheduledTime}`
      );

      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
        throw new Error("Please select a future date and time.");
      }

      if (!liveClassForm.courseId) {
        throw new Error("Please select a course.");
      }

      const payload = {
        title: liveClassForm.title.trim(),
        description: liveClassForm.description.trim(),
        courseId: liveClassForm.courseId,
        scheduledAt: scheduledAt.toISOString(),
        duration: Number(liveClassForm.duration),
      };

      const data = await requestApi(LIVE_CLASS_API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage(data.message || "Live class scheduled successfully.");
      setLiveClassForm(emptyLiveClassForm);
      await loadLiveClasses();
    } catch (err) {
      setError(err.message);
    } finally {
      setLiveClassSaving(false);
    }
  };

  // Change live class status
  const changeLiveClassStatus = async (id, status) => {
    setError("");
    setMessage("");

    try {
      const data = await requestApi(`${LIVE_CLASS_API_URL}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setMessage(data.message || "Live class status updated.");
      await loadLiveClasses();
    } catch (err) {
      setError(err.message);
    }
  };

  // Start a scheduled class and open LiveKit classroom
  const startAndJoinLiveClass = async (liveClass) => {
    setError("");
    setMessage("");

    try {
      const data = await requestApi(
        `${LIVE_CLASS_API_URL}/${liveClass._id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "live" }),
        }
      );

      setMessage(data.message || "Live class started successfully.");

      await loadLiveClasses();
      setActiveLiveClass(liveClass);
    } catch (err) {
      setError(err.message);
    }
  };

  // Rejoin an existing live class
  const joinExistingLiveClass = (liveClass) => {
    console.log("Selected live class:", liveClass);
    console.log("Live class ID:", liveClass?._id);

    setError("");
    setMessage("");

    if (!liveClass?._id) {
      setError("Live class ID is missing. Please refresh and try again.");
      return;
    }

    setActiveLiveClass(liveClass);
  };

  // Exit classroom
  const exitLiveClassroom = () => {
    setActiveLiveClass(null);
    loadLiveClasses();
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load live classes whenever Manage Lessons is opened
  useEffect(() => {
    if (page === "lessons") {
      loadLiveClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const instructorName = user?.name || user?.fullName || "Instructor";

  const initials = instructorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const totalLessons = useMemo(
    () => courses.reduce((sum, course) => sum + (course.lessons?.length || 0), 0),
    [courses]
  );

  const totalStudents = useMemo(
    () =>
      courses.reduce(
        (sum, course) =>
          sum + (course.enrolledStudents?.length || course.students?.length || 0),
        0
      ),
    [courses]
  );

  const navigate = (nextPage) => {
    setPage(nextPage);
    setSidebarOpen(false);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormChange = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  // Course management
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      price: Number(form.price) || 0,
    };

    try {
      if (editingId) {
        await requestApi(`${API_URL}/${encodeURIComponent(editingId)}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Course updated successfully.");
      } else {
        await requestApi(API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Course created successfully.");
      }

      resetForm();
      await loadCourses();
      setPage("courses");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editCourse = (course) => {
    setEditingId(course.courseId || course._id);
    setForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      level: course.level || "Beginner",
      price: course.price ?? "",
      image: course.image || course.imageUrl || "",
    });
    navigate("create");
  };

  const deleteCourse = async (course) => {
    const id = course.courseId || course._id;
    if (!window.confirm(`Delete "${course.title}"?`)) return;

    try {
      await requestApi(`${API_URL}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setMessage("Course deleted successfully.");
      await loadCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  // Recorded lesson management
  const openLessons = async (course) => {
    const id = course.courseId || course._id;
    setSelectedCourse(course);
    setLessons([]);
    setLessonForm(emptyLessonForm);
    setLessonLoading(true);
    setPage("lessons");
    setSidebarOpen(false);
    setError("");
    setMessage("");

    try {
      const data = await requestApi(`${API_URL}/${encodeURIComponent(id)}`);
      const fullCourse = data.course || data;
      setSelectedCourse(fullCourse);
      setLessons(fullCourse.lessons || data.lessons || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLessonLoading(false);
    }
  };

  const handleLessonChange = (e) => {
    setLessonForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const addLesson = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const id = selectedCourse.courseId || selectedCourse._id;
    setLessonSaving(true);
    setError("");
    setMessage("");

    try {
      const data = await requestApi(
        `${API_URL}/${encodeURIComponent(id)}/lessons`,
        {
          method: "POST",
          body: JSON.stringify(lessonForm),
        }
      );

      if (data.lessons) {
        setLessons(data.lessons);
      } else if (data.course?.lessons) {
        setLessons(data.course.lessons);
      } else {
        const refreshed = await requestApi(`${API_URL}/${encodeURIComponent(id)}`);
        setLessons((refreshed.course || refreshed).lessons || []);
      }

      setLessonForm(emptyLessonForm);
      setMessage("Lesson added successfully.");
      await loadCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setLessonSaving(false);
    }
  };

  const deleteLesson = async (lesson) => {
    if (!selectedCourse) return;
    if (!window.confirm(`Delete "${lesson.title}"?`)) return;

    const courseId = selectedCourse.courseId || selectedCourse._id;

    try {
      const data = await requestApi(
        `${API_URL}/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson._id)}`,
        { method: "DELETE" }
      );

      if (data.lessons) {
        setLessons(data.lessons);
      } else if (data.course?.lessons) {
        setLessons(data.course.lessons);
      } else {
        setLessons((current) => current.filter((item) => item._id !== lesson._id));
      }

      setMessage("Lesson deleted successfully.");
      await loadCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  // Quiz management
  const loadQuizForCourse = async (courseId) => {
    if (!courseId) {
      setExistingQuiz(null);
      setQuizStatus("Please select a course.");
      return;
    }

    setQuizLoading(true);
    setQuizStatus("");
    setExistingQuiz(null);
    setQuizTitle("");
    setQuizQuestions([createEmptyQuestion()]);

    try {
      const data = await requestApi(`${QUIZ_API_URL}/${encodeURIComponent(courseId)}`);
      setExistingQuiz(data.quiz || null);
      setQuizStatus(data.quiz ? "A quiz already exists for this course." : "");
    } catch (err) {
      if (err.message.toLowerCase().includes("quiz not found")) {
        setExistingQuiz(null);
        setQuizStatus("No quiz exists yet. Create one below.");
      } else {
        setQuizStatus(err.message);
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizCourseChange = (e) => {
    const courseId = e.target.value;
    setQuizCourseId(courseId);
    loadQuizForCourse(courseId);
  };

  const updateQuizQuestion = (questionIndex, field, value) => {
    setQuizQuestions((current) =>
      current.map((question, index) =>
        index === questionIndex ? { ...question, [field]: value } : question
      )
    );
  };

  const updateQuizOption = (questionIndex, optionIndex, value) => {
    setQuizQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) return question;
        const options = [...question.options];
        options[optionIndex] = value;
        return { ...question, options };
      })
    );
  };

  const addQuizQuestion = () => {
    setQuizQuestions((current) => [...current, createEmptyQuestion()]);
  };

  const removeQuizQuestion = (questionIndex) => {
    setQuizQuestions((current) =>
      current.length === 1
        ? current
        : current.filter((_, index) => index !== questionIndex)
    );
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!quizCourseId) {
      setError("Please select a course.");
      return;
    }

    const cleanedQuestions = quizQuestions.map((question) => ({
      questionText: question.questionText.trim(),
      options: question.options.map((option) => option.trim()).filter(Boolean),
      correctAnswer: Number(question.correctAnswer),
    }));

    const hasInvalidQuestion = cleanedQuestions.some(
      (question) =>
        !question.questionText ||
        question.options.length !== 4 ||
        !Number.isInteger(question.correctAnswer) ||
        question.correctAnswer < 0 ||
        question.correctAnswer >= question.options.length
    );

    if (!quizTitle.trim() || hasInvalidQuestion) {
      setError("Enter a quiz title and complete every question with all four options.");
      return;
    }

    setQuizSaving(true);

    try {
      const data = await requestApi(QUIZ_API_URL, {
        method: "POST",
        body: JSON.stringify({
          courseId: quizCourseId,
          title: quizTitle.trim(),
          questions: cleanedQuestions,
        }),
      });

      setExistingQuiz(data.quiz || {
        title: quizTitle.trim(),
        questions: cleanedQuestions,
      });

      setMessage(data.message || "Quiz created successfully.");
      setQuizStatus("Quiz uploaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setQuizSaving(false);
    }
  };

  const signOut = () => {
    setSidebarOpen(false);

    if (onSignOut) {
      onSignOut();
      return;
    }

    localStorage.removeItem("lmsToken");
    localStorage.removeItem("lmsUser");
    window.location.href = "/login";
  };

  // Quiz manager UI
  const renderQuizManager = () => (
    <section className="instructor-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">ASSESSMENTS</span>
          <h2>Manage Quizzes</h2>
          <p>Select one of your courses and create its quiz.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="course-empty-state">
          <h3>No courses available</h3>
          <p>Create a course before uploading a quiz.</p>
          <button className="button button-primary" onClick={() => navigate("create")}>
            Create Course
          </button>
        </div>
      ) : (
        <>
          <div className="instructor-form quiz-course-select">
            <label className="form-field">
              <span>Select course *</span>
              <select value={quizCourseId} onChange={handleQuizCourseChange}>
                <option value="">Choose a course</option>
                {courses.map((course) => {
                  const id = course.courseId || "";
                  return (
                    <option key={id || course._id} value={id}>
                      {course.title}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          {quizLoading ? (
            <div className="course-loading">
              <span className="loading-spinner" /> Checking course quiz...
            </div>
          ) : quizCourseId && existingQuiz ? (
            <div className="course-empty-state quiz-existing-state">
              <div className="empty-state-icon">✓</div>
              <h3>Quiz already uploaded</h3>
              <p><strong>{existingQuiz.title}</strong></p>
              <p>{existingQuiz.questions?.length || 0} questions in this quiz.</p>
              <small>Only one quiz is allowed per course currently.</small>
            </div>
          ) : quizCourseId ? (
            <form className="instructor-form quiz-builder-form" onSubmit={handleQuizSubmit}>
              <h3>Create Course Quiz</h3>
              {quizStatus && <p className="form-hint">{quizStatus}</p>}

              <label className="form-field full-field">
                <span>Quiz title *</span>
                <input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. JavaScript Basics Quiz"
                  required
                />
              </label>

              {quizQuestions.map((question, questionIndex) => (
                <div className="quiz-question-editor" key={questionIndex}>
                  <div className="quiz-question-editor-heading">
                    <h4>Question {questionIndex + 1}</h4>
                    {quizQuestions.length > 1 && (
                      <button
                        type="button"
                        className="button button-danger"
                        onClick={() => removeQuizQuestion(questionIndex)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <label className="form-field full-field">
                    <span>Question *</span>
                    <textarea
                      rows="2"
                      value={question.questionText}
                      onChange={(e) =>
                        updateQuizQuestion(questionIndex, "questionText", e.target.value)
                      }
                      required
                    />
                  </label>

                  <div className="form-grid quiz-options-grid">
                    {question.options.map((option, optionIndex) => (
                      <label className="form-field" key={optionIndex}>
                        <span>Option {optionIndex + 1} *</span>
                        <input
                          value={option}
                          onChange={(e) =>
                            updateQuizOption(questionIndex, optionIndex, e.target.value)
                          }
                          required
                        />
                      </label>
                    ))}
                  </div>

                  <label className="form-field quiz-correct-answer">
                    <span>Correct answer *</span>
                    <select
                      value={question.correctAnswer}
                      onChange={(e) =>
                        updateQuizQuestion(
                          questionIndex,
                          "correctAnswer",
                          Number(e.target.value)
                        )
                      }
                    >
                      {question.options.map((option, optionIndex) => (
                        <option key={optionIndex} value={optionIndex}>
                          Option {optionIndex + 1}
                          {option.trim() ? ` — ${option}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}

              <div className="form-footer quiz-form-footer">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={addQuizQuestion}
                >
                  + Add Question
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={quizSaving}
                >
                  {quizSaving ? "Uploading..." : "Upload Quiz"}
                </button>
              </div>
            </form>
          ) : (
            <div className="lesson-empty-state">
              Choose a course to check or create its quiz.
            </div>
          )}
        </>
      )}
    </section>
  );

  // Live classes section inside Manage Lessons
  const renderLiveClasses = () => (
    <section className="instructor-section live-classes-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">LIVE LEARNING</span>
          <h2>Live Classes</h2>
          <p>
            Schedule and manage real-time classes alongside your recorded lessons.
          </p>
        </div>

        <button
          className="button button-secondary"
          type="button"
          onClick={loadLiveClasses}
          disabled={liveClassLoading}
        >
          {liveClassLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="course-empty-state">
          <h3>No courses available</h3>
          <p>Create a course before scheduling a live class.</p>
          <button className="button button-primary" onClick={() => navigate("create")}>
            Create Course
          </button>
        </div>
      ) : (
        <form className="instructor-form" onSubmit={handleLiveClassSubmit}>
          <h3>Schedule a Live Class</h3>

          <div className="form-grid">
            <label className="form-field full-field">
              <span>Class title *</span>
              <input
                value={liveClassForm.title}
                onChange={(e) =>
                  setLiveClassForm({ ...liveClassForm, title: e.target.value })
                }
                placeholder="e.g. Introduction to MySQL"
                required
              />
            </label>

            <label className="form-field full-field">
              <span>Description</span>
              <textarea
                rows="3"
                value={liveClassForm.description}
                onChange={(e) =>
                  setLiveClassForm({ ...liveClassForm, description: e.target.value })
                }
                placeholder="What will students learn in this session?"
              />
            </label>

            <label className="form-field full-field">
              <span>Select course *</span>
              <select
                value={liveClassForm.courseId}
                onChange={(e) =>
                  setLiveClassForm({ ...liveClassForm, courseId: e.target.value })
                }
                required
              >
                <option value="">Choose a course</option>
                {courses.map((course) => (
                  <option
                    key={course.courseId || course._id}
                    value={course.courseId || ""}
                  >
                    {course.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Class date *</span>
              <input
                type="date"
                min={getTodayLocalDate()}
                value={liveClassForm.scheduledDate}
                onChange={(e) =>
                  setLiveClassForm({
                    ...liveClassForm,
                    scheduledDate: e.target.value,
                  })
                }
                required
              />
            </label>

            <label className="form-field">
              <span>Class time *</span>
              <input
                type="time"
                value={liveClassForm.scheduledTime}
                onChange={(e) =>
                  setLiveClassForm({
                    ...liveClassForm,
                    scheduledTime: e.target.value,
                  })
                }
                required
              />
            </label>

            <label className="form-field">
              <span>Duration (minutes) *</span>
              <input
                type="number"
                min="1"
                max="300"
                value={liveClassForm.duration}
                onChange={(e) =>
                  setLiveClassForm({
                    ...liveClassForm,
                    duration: e.target.value,
                  })
                }
                required
              />
            </label>
          </div>

          <div className="form-footer">
            <span className="form-hint">Select a future date and time.</span>
            <button
              className="button button-primary"
              type="submit"
              disabled={liveClassSaving}
            >
              {liveClassSaving ? "Scheduling..." : "Schedule Live Class"}
            </button>
          </div>
        </form>
      )}

      <div className="lesson-list">
        <div className="lesson-list-heading">
          <h3>Your Scheduled Classes</h3>
          <span>{liveClasses.length} total</span>
        </div>

        {liveClassLoading ? (
          <div className="course-loading">
            <span className="loading-spinner" /> Loading live classes...
          </div>
        ) : liveClasses.length === 0 ? (
          <div className="lesson-empty-state">
            No live classes scheduled yet. Schedule your first class above.
          </div>
        ) : (
          liveClasses.map((liveClass) => (
            <article className="lesson-item" key={liveClass._id}>
              <span className="lesson-number">▶</span>

              <div className="lesson-item-info">
                <h4>{liveClass.title}</h4>
                <p><strong>Course:</strong> {liveClass.courseTitle}</p>
                <p>{liveClass.description || "No description provided."}</p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(liveClass.scheduledAt).toLocaleString()}
                </p>
                <p><strong>Duration:</strong> {liveClass.duration} minutes</p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`live-class-status ${liveClass.status}`}>
                    {liveClass.status}
                  </span>
                </p>

                <div className="course-card-actions">
                  {liveClass.status === "scheduled" && (
                    <>
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => startAndJoinLiveClass(liveClass)}
                      >
                        Start Class
                      </button>

                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => {
                          if (window.confirm("Cancel this live class?")) {
                            changeLiveClassStatus(liveClass._id, "cancelled");
                          }
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {liveClass.status === "live" && (
                    <>
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => joinExistingLiveClass(liveClass)}
                      >
                        Join Classroom
                      </button>

                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() =>
                          changeLiveClassStatus(liveClass._id, "completed")
                        }
                      >
                        Mark Completed
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );

  // Instructor overview
  const renderOverview = () => (
    <>
      <section className="welcome-banner">
        <div className="welcome-banner-content">
          <span className="welcome-eyebrow">INSTRUCTOR WORKSPACE</span>
          <h1>Welcome back, {instructorName.split(" ")[0]}!</h1>
          <p>
            Manage your courses, create engaging lessons, and help your students
            keep learning.
          </p>
        </div>

        <div className="welcome-banner-decoration">
          <span className="welcome-decoration-circle circle-one" />
          <span className="welcome-decoration-circle circle-two" />
          <span className="welcome-decoration-circle circle-three" />
        </div>
      </section>

      <section className="instructor-stats">
        <article className="instructor-stat-card">
          <div className="stat-icon purple-icon">▣</div>
          <div>
            <span className="stat-label">Total courses</span>
            <strong>{courses.length}</strong>
          </div>
        </article>

        <article className="instructor-stat-card">
          <div className="stat-icon blue-icon">▶</div>
          <div>
            <span className="stat-label">Total lessons</span>
            <strong>{totalLessons}</strong>
          </div>
        </article>

        <article className="instructor-stat-card">
          <div className="stat-icon green-icon">♙</div>
          <div>
            <span className="stat-label">Enrolled students</span>
            <strong>{totalStudents}</strong>
          </div>
        </article>
      </section>

      <section className="instructor-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">QUICK ACTIONS</span>
            <h2>Manage your teaching</h2>
            <p>Choose what you would like to do next.</p>
          </div>
        </div>

        <div className="quick-actions">
          <button className="quick-action-card" onClick={() => navigate("courses")}>
            <span>▣</span>
            <strong>My Courses</strong>
            <small>View and manage your courses</small>
          </button>

          <button
            className="quick-action-card"
            onClick={() => {
              resetForm();
              navigate("create");
            }}
          >
            <span>＋</span>
            <strong>Create Course</strong>
            <small>Publish a new course</small>
          </button>

          <button
            className="quick-action-card"
            onClick={() => navigate("lessons")}
          >
            <span>📹</span>
            <strong>Manage Teaching</strong>
            <small>Manage recorded lessons and live classes</small>
          </button>
        </div>
      </section>
    </>
  );

  // Courses list
  const renderCourses = () => (
    <section className="instructor-section">
      <div className="section-heading courses-heading">
        <div>
          <span className="section-kicker">YOUR TEACHING LIBRARY</span>
          <h2>My Courses</h2>
          <p>View and manage the courses you have created.</p>
        </div>

        <button
          className="button button-primary"
          onClick={() => {
            resetForm();
            navigate("create");
          }}
        >
          + Create Course
        </button>
      </div>

      {loading ? (
        <div className="course-loading">
          <span className="loading-spinner" /> Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <div className="course-empty-state">
          <div className="empty-state-icon">▤</div>
          <h3>No courses yet</h3>
          <p>Create your first course to get started.</p>
          <button
            className="button button-primary"
            onClick={() => navigate("create")}
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="instructor-course-grid">
          {courses.map((course) => {
            const courseStyle = getCourseStyle(course);

            return (
              <article
                className="instructor-course-card"
                key={course.courseId || course._id}
              >
                <div className={`instructor-course-art ${courseStyle.theme}`}>
                  <span className="instructor-course-category">
                    {course.category || "Programming"}
                  </span>
                  <div className="instructor-course-icon">
                    {courseStyle.icon}
                  </div>
                  <span className="course-level-badge">
                    {course.level || "Beginner"}
                  </span>
                  <span className="instructor-course-decoration">
                    {courseStyle.icon}
                  </span>
                </div>

                <div className="course-card-body">
                  <span className="course-category">
                    {course.category || "General"}
                  </span>
                  <h3>{course.title}</h3>
                  <p>{course.description || "No description added yet."}</p>

                  <div className="course-card-meta">
                    <span>{course.lessons?.length || 0} lessons</span>
                    <strong>
                      {Number(course.price) > 0 ? `₹${course.price}` : "Free"}
                    </strong>
                  </div>

                  <div className="course-card-actions">
                    <button
                      className="button button-outline"
                      onClick={() => openLessons(course)}
                    >
                      Lessons
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={() => editCourse(course)}
                    >
                      Edit
                    </button>
                    <button
                      className="button button-danger"
                      onClick={() => deleteCourse(course)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  // Create or edit course
  const renderCreateCourse = () => (
    <section className="instructor-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">
            {editingId ? "UPDATE YOUR CONTENT" : "START TEACHING"}
          </span>
          <h2>{editingId ? "Edit Course" : "Create a New Course"}</h2>
          <p>Fill in the details of your course.</p>
        </div>
      </div>

      <form className="instructor-form" onSubmit={handleCourseSubmit}>
        <div className="form-grid">
          <label className="form-field">
            <span>Course title *</span>
            <input
              name="title"
              value={form.title}
              onChange={handleFormChange}
              required
            />
          </label>

          <label className="form-field">
            <span>Category *</span>
            <input
              name="category"
              value={form.category}
              onChange={handleFormChange}
              required
            />
          </label>

          <label className="form-field">
            <span>Level</span>
            <select name="level" value={form.level} onChange={handleFormChange}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>

          <label className="form-field">
            <span>Price (₹)</span>
            <input
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleFormChange}
            />
          </label>

          <label className="form-field full-field">
            <span>Course image URL</span>
            <input
              name="image"
              type="url"
              value={form.image}
              onChange={handleFormChange}
              placeholder="https://example.com/image.jpg"
            />
          </label>

          <label className="form-field full-field">
            <span>Description *</span>
            <textarea
              name="description"
              rows="5"
              value={form.description}
              onChange={handleFormChange}
              required
            />
          </label>
        </div>

        <div className="form-footer">
          <span className="form-hint">Fields marked * are required.</span>
          <div className="form-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                resetForm();
                navigate("courses");
              }}
            >
              Cancel
            </button>

            <button
              className="button button-primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Course"
                  : "Create Course"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );

  // Manage recorded lessons
  const renderLessons = () => (
    <section className="instructor-section lesson-manager">
      <div className="section-heading lesson-heading">
        <div>
          <span className="section-kicker">COURSE CONTENT</span>
          <h2>Recorded Lessons</h2>
          <p>
            {selectedCourse
              ? `Course: ${selectedCourse.title}`
              : "Select a course from My Courses to manage its lessons."}
          </p>
        </div>

        <button
          className="button button-secondary"
          onClick={() => navigate("courses")}
        >
          Back to Courses
        </button>
      </div>

      {!selectedCourse ? (
        <div className="lesson-empty-state">
          Please select a course from My Courses.
          <button
            className="button button-primary"
            onClick={() => navigate("courses")}
          >
            Go to My Courses
          </button>
        </div>
      ) : lessonLoading ? (
        <div className="course-loading">
          <span className="loading-spinner" /> Loading lessons...
        </div>
      ) : (
        <>
          <form className="lesson-form" onSubmit={addLesson}>
            <h3>Add a Recorded Lesson</h3>

            <div className="form-grid">
              <label className="form-field full-field">
                <span>Lesson title *</span>
                <input
                  name="title"
                  value={lessonForm.title}
                  onChange={handleLessonChange}
                  required
                />
              </label>

              <label className="form-field full-field">
                <span>Description</span>
                <textarea
                  name="description"
                  rows="3"
                  value={lessonForm.description}
                  onChange={handleLessonChange}
                />
              </label>

              <label className="form-field full-field">
                <span>Video URL</span>
                <input
                  type="url"
                  name="videoUrl"
                  value={lessonForm.videoUrl}
                  onChange={handleLessonChange}
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className="form-footer">
              <span className="form-hint">Lesson title is required.</span>
              <button
                className="button button-primary"
                type="submit"
                disabled={lessonSaving}
              >
                {lessonSaving ? "Adding..." : "Add Lesson"}
              </button>
            </div>
          </form>

          <div className="lesson-list">
            <div className="lesson-list-heading">
              <h3>Course Lessons</h3>
              <span>{lessons.length} total</span>
            </div>

            {lessons.length === 0 ? (
              <div className="lesson-empty-state">
                No lessons added yet. Add your first lesson above.
              </div>
            ) : (
              lessons.map((lesson, index) => (
                <article className="lesson-item" key={lesson._id || index}>
                  <span className="lesson-number">{index + 1}</span>

                  <div className="lesson-item-info">
                    <h4>{lesson.title}</h4>
                    <p>{lesson.description || "No description provided."}</p>
                    {lesson.videoUrl && (
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open lesson video ↗
                      </a>
                    )}
                  </div>

                  <button
                    className="button button-danger"
                    disabled={!lesson._id}
                    onClick={() => deleteLesson(lesson)}
                  >
                    Delete
                  </button>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );

  // Display LiveKit classroom when instructor joins
  if (activeLiveClass) {
    return (
      <LiveClassroom
        liveClassId={activeLiveClass._id}
        liveClassTitle={activeLiveClass.title}
        onExit={exitLiveClassroom}
      />
    );
  }

  return (
    <div className="instructor-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="instructor-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed sidebar */}
      <aside className={`instructor-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <button
          type="button"
          className="instructor-brand"
          onClick={() => navigate("overview")}
        >
          <Logo width={150} />
        </button>

        <div className="sidebar-menu-label">MAIN MENU</div>

        <nav className="instructor-sidebar-nav">
          <button
            type="button"
            className={`instructor-sidebar-link ${page === "overview" ? "active" : ""}`}
            onClick={() => navigate("overview")}
          >
            <span className="sidebar-link-icon">▦</span>
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`instructor-sidebar-link ${page === "courses" ? "active" : ""}`}
            onClick={() => navigate("courses")}
          >
            <span className="sidebar-link-icon">▣</span>
            <span>My Courses</span>
          </button>

          <button
            type="button"
            className={`instructor-sidebar-link ${page === "create" ? "active" : ""}`}
            onClick={() => {
              resetForm();
              navigate("create");
            }}
          >
            <span className="sidebar-link-icon">＋</span>
            <span>Create Course</span>
          </button>

          <button
            type="button"
            className={`instructor-sidebar-link ${page === "lessons" ? "active" : ""}`}
            onClick={() => navigate("lessons")}
          >
            <span className="sidebar-link-icon">▶</span>
            <span>Manage Lessons</span>
          </button>

          <button
            type="button"
            className={`instructor-sidebar-link ${page === "quizzes" ? "active" : ""}`}
            onClick={() => {
              setQuizCourseId("");
              setExistingQuiz(null);
              setQuizStatus("");
              navigate("quizzes");
            }}
          >
            <span className="sidebar-link-icon">✎</span>
            <span>Manage Quizzes</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <span className="instructor-avatar">{initials || "I"}</span>
            <div className="sidebar-profile-details">
              <strong>{instructorName}</strong>
              <span>Instructor</span>
            </div>
          </div>

          <button type="button" className="sidebar-signout" onClick={signOut}>
            <span>↪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main dashboard */}
      <main className="instructor-main">
        <header className="instructor-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="sidebar-menu-toggle"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              ☰
            </button>

            <div className="topbar-page-title">
              <span>Instructor Workspace</span>
              <strong>
                {page === "overview" && "Overview"}
                {page === "courses" && "My Courses"}
                {page === "create" && (editingId ? "Edit Course" : "Create Course")}
                {page === "lessons" && "Manage Lessons"}
                {page === "quizzes" && "Manage Quizzes"}
              </strong>
            </div>
          </div>

          <div className="instructor-topbar-right">
            <div className="instructor-profile">
              <span className="instructor-avatar">{initials || "I"}</span>
              <span className="instructor-profile-name">{instructorName}</span>
            </div>
          </div>
        </header>

        <div className="instructor-content">
          {error && (
            <div className="dashboard-alert error-alert">{error}</div>
          )}

          {message && (
            <div className="dashboard-alert success-alert">{message}</div>
          )}

          {page === "overview" && renderOverview()}
          {page === "courses" && renderCourses()}
          {page === "create" && renderCreateCourse()}

          {page === "lessons" && (
            <>
              {renderLessons()}
              {renderLiveClasses()}
            </>
          )}

          {page === "quizzes" && renderQuizManager()}

          <footer className="instructor-footer">
            © {new Date().getFullYear()} LearnSpace. Keep inspiring learners.
          </footer>
        </div>
      </main>
    </div>
  );
}