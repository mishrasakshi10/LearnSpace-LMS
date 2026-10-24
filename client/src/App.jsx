
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/auth";
const ENROLLMENT_API_URL = "http://localhost:5000/api/enrollments";

const VALID_ROLES = ["student", "instructor", "admin"];

const SAMPLE_COURSES = [
  {
    id: 1,
    title: "Web Development Fundamentals",
    category: "Development",
    level: "Beginner",
    duration: "6 weeks",
    instructor: "LearnSpace Team",
    description: "Learn HTML, CSS, and JavaScript to build your first website.",
    icon: "💻",
  },
  {
    id: 2,
    title: "Java Programming Essentials",
    category: "Programming",
    level: "Beginner",
    duration: "8 weeks",
    instructor: "LearnSpace Team",
    description: "Understand Java basics, object-oriented programming, and more.",
    icon: "☕",
  },
  {
    id: 3,
    title: "UI/UX Design Basics",
    category: "Design",
    level: "Beginner",
    duration: "4 weeks",
    instructor: "LearnSpace Team",
    description: "Explore design principles, wireframes, and user-friendly interfaces.",
    icon: "🎨",
  },
  {
    id: 4,
    title: "Database and SQL",
    category: "Database",
    level: "Beginner",
    duration: "5 weeks",
    instructor: "LearnSpace Team",
    description: "Practice tables, queries, joins, and relational database concepts.",
    icon: "🗄️",
  },
  {
    id: 5,
    title: "Python for Beginners",
    category: "Programming",
    level: "Beginner",
    duration: "6 weeks",
    instructor: "LearnSpace Team",
    description: "Start coding with Python through simple practical examples.",
    icon: "🐍",
  },
  {
    id: 6,
    title: "React Essentials",
    category: "Development",
    level: "Intermediate",
    duration: "5 weeks",
    instructor: "LearnSpace Team",
    description: "Build interactive interfaces with components, props, and state.",
    icon: "⚛️",
  },
];

// Decode a JWT payload for client-side session restoration.
// The backend must still verify the token for protected API requests.
function getRoleFromToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    let payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    payload += "=".repeat((4 - (payload.length % 4)) % 4);

    const decoded = JSON.parse(atob(payload));
    return decoded.role || null;
  } catch {
    return null;
  }
}

// Restore the logged-in user's dashboard after a browser refresh.
function getInitialPage() {
  try {
    const token = localStorage.getItem("lmsToken");
    const savedUser = localStorage.getItem("lmsUser");

    if (!token || !savedUser) {
      return "login";
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token");
    }

    let payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    payload += "=".repeat((4 - (payload.length % 4)) % 4);

    const decoded = JSON.parse(atob(payload));
    const user = JSON.parse(savedUser);

    if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
      throw new Error("Session expired");
    }

    const role = user.role || decoded.role;

    if (
      !VALID_ROLES.includes(role) ||
      decoded.role !== role ||
      !decoded.userId
    ) {
      throw new Error("Invalid session");
    }

    return role;
  } catch {
    localStorage.removeItem("lmsToken");
    localStorage.removeItem("lmsUser");
    return "login";
  }
}

function App() {
  // FIX: Restore the user's dashboard instead of always opening registration.
  const [page, setPage] = useState(getInitialPage);

  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enrollment state.
  const [enrollments, setEnrollments] = useState([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState("");
  const [enrollmentMessageType, setEnrollmentMessageType] = useState("");

  const isRegister = page === "register";

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  };

  const switchPage = (nextPage) => {
    setPage(nextPage);
    setSelectedCourse(null);
    setMessage("");
    setMessageType("");
    setShowPassword(false);
    setShowConfirmPassword(false);

    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "student",
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem("lmsToken");
    localStorage.removeItem("lmsUser");

    setSelectedCourse(null);
    setEnrollments([]);
    setEnrollmentMessage("");
    setEnrollmentMessageType("");

    switchPage("login");
  };

  // Registration and login.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const email = formData.email.trim().toLowerCase();

    if (isRegister && !formData.name.trim()) {
      showMessage("Please enter your full name.");
      return;
    }

    if (isRegister && formData.password !== formData.confirmPassword) {
      showMessage("Passwords do not match. Please try again.");
      return;
    }

    if (isRegister && formData.password.length < 8) {
      showMessage("Password must contain at least 8 characters.");
      return;
    }

    if (isRegister && !["student", "instructor"].includes(formData.role)) {
      showMessage("Please select a valid account role.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isRegister ? "register" : "login";

      const body = isRegister
        ? {
            name: formData.name.trim(),
            email,
            password: formData.password,
            role: formData.role,
          }
        : {
            email,
            password: formData.password,
          };

      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isRegister
              ? "Registration failed. Please try again."
              : "Login failed. Check your email and password.")
        );
      }

      if (isRegister) {
        showMessage(
          data.message ||
            "Account created successfully! You can now sign in.",
          "success"
        );

        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "student",
        });

        return;
      }

      if (!data.token) {
        throw new Error(
          "The backend did not return a login token. Please check your login API."
        );
      }

      const tokenRole = getRoleFromToken(data.token);
      const responseRole = data.user?.role || null;

      if (tokenRole && responseRole && tokenRole !== responseRole) {
        throw new Error(
          "The account role in the login response does not match the token."
        );
      }

      const userRole = responseRole || tokenRole;

      if (!VALID_ROLES.includes(userRole)) {
        throw new Error(
          "Unable to identify your account role. Please check your login API."
        );
      }

      const savedUser = {
        ...(data.user || {}),
        email: data.user?.email || email,
        role: userRole,
      };

      localStorage.setItem("lmsToken", data.token);
      localStorage.setItem("lmsUser", JSON.stringify(savedUser));

      setEnrollments([]);
      setSelectedCourse(null);

      setPage(userRole);
      setMessage("");
      setMessageType("");
    } catch (error) {
      showMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Make sure your server is running on port 5000."
          : error.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load the student's saved enrollments when a course is opened.
  useEffect(() => {
    if (page !== "student" || !selectedCourse) {
      return;
    }

    const token = localStorage.getItem("lmsToken");

    if (!token) {
      setEnrollments([]);
      setEnrollmentMessage("Please sign in to view your enrollments.");
      setEnrollmentMessageType("error");
      return;
    }

    let cancelled = false;

    const loadEnrollments = async () => {
      setIsLoadingEnrollments(true);
      setEnrollmentMessage("");
      setEnrollmentMessageType("");

      try {
        const response = await fetch(ENROLLMENT_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your enrollments."
          );
        }

        if (!cancelled) {
          setEnrollments(data.enrollments || []);
        }
      } catch (error) {
        if (!cancelled) {
          setEnrollmentMessage(
            error.message === "Failed to fetch"
              ? "Cannot connect to the enrollment server."
              : error.message
          );
          setEnrollmentMessageType("error");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEnrollments(false);
        }
      }
    };

    loadEnrollments();

    return () => {
      cancelled = true;
    };
  }, [page, selectedCourse?.id]);

  const isCourseEnrolled = selectedCourse
    ? enrollments.some(
        (enrollment) =>
          String(enrollment.courseId) === String(selectedCourse.id)
      )
    : false;

  // Enroll the logged-in student in the selected course.
  const handleEnroll = async () => {
    if (!selectedCourse || isEnrolling || isCourseEnrolled) {
      return;
    }

    const token = localStorage.getItem("lmsToken");

    if (!token) {
      setEnrollmentMessage("Please sign in before enrolling.");
      setEnrollmentMessageType("error");
      return;
    }

    setIsEnrolling(true);
    setEnrollmentMessage("");
    setEnrollmentMessageType("");

    try {
      const response = await fetch(ENROLLMENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: String(selectedCourse.id),
          courseTitle: selectedCourse.title,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to enroll in this course."
        );
      }

      if (data.enrollment) {
        setEnrollments((previous) => {
          const exists = previous.some(
            (enrollment) =>
              String(enrollment.courseId) ===
              String(data.enrollment.courseId)
          );

          return exists ? previous : [...previous, data.enrollment];
        });
      } else {
        const refreshResponse = await fetch(ENROLLMENT_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const refreshedData = await refreshResponse.json().catch(() => ({}));

        if (refreshResponse.ok) {
          setEnrollments(refreshedData.enrollments || []);
        }
      }

      setEnrollmentMessage(
        data.message || "Successfully enrolled in the course!"
      );
      setEnrollmentMessageType("success");
    } catch (error) {
      setEnrollmentMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Please try again."
          : error.message
      );
      setEnrollmentMessageType("error");

      if (error.message === "You are already enrolled in this course.") {
        try {
          const response = await fetch(ENROLLMENT_API_URL, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok) {
            setEnrollments(data.enrollments || []);
          }
        } catch {
          // Keep the original error message visible.
        }
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // Student dashboard.
  if (page === "student") {
    let student = null;

    try {
      student = JSON.parse(localStorage.getItem("lmsUser") || "null");
    } catch {
      student = null;
    }

    const categories = [
      "All",
      ...new Set(SAMPLE_COURSES.map((course) => course.category)),
    ];

    const filteredCourses = SAMPLE_COURSES.filter((course) => {
      const search = courseSearch.trim().toLowerCase();

      const matchesSearch =
        course.title.toLowerCase().includes(search) ||
        course.description.toLowerCase().includes(search) ||
        course.category.toLowerCase().includes(search) ||
        course.instructor.toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "All" ||
        course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Course details.
    if (selectedCourse) {
      const courseLearning = {
        1: [
          "Structure web pages using HTML",
          "Style layouts with CSS",
          "Add interactivity using JavaScript",
          "Build a responsive website",
        ],
        2: [
          "Understand Java syntax and data types",
          "Use conditions, loops, and methods",
          "Learn object-oriented programming",
          "Write and organize Java programs",
        ],
        3: [
          "Understand user-centered design",
          "Explore colors, typography, and layouts",
          "Create basic wireframes",
          "Design clear and usable interfaces",
        ],
        4: [
          "Understand tables and relationships",
          "Write SQL queries",
          "Filter and sort database records",
          "Practice joins and database concepts",
        ],
        5: [
          "Understand Python variables and data types",
          "Use conditions and loops",
          "Write reusable functions",
          "Create small Python programs",
        ],
        6: [
          "Understand React components",
          "Work with props and state",
          "Handle user interactions",
          "Build reusable UI elements",
        ],
      };

      const lessons = [
        "Introduction and learning goals",
        "Core concepts and fundamentals",
        "Guided practice and recap",
      ];

      const outcomes = courseLearning[selectedCourse.id] || courseLearning[1];

      return (
        <main className="course-detail-page">
          <header className="student-topbar">
            <a
              className="student-brand"
              href="#dashboard"
              onClick={(event) => {
                event.preventDefault();
                setSelectedCourse(null);
              }}
            >
              <span className="brand-icon">L</span>
              <span>LearnSpace</span>
            </a>

            <div className="student-topbar-right">
              <span className="student-role-pill">Student</span>
              <button
                type="button"
                className="student-signout"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </header>

          <section className="course-detail-content">
            <button
              type="button"
              className="course-detail-back"
              onClick={() => setSelectedCourse(null)}
            >
              <span aria-hidden="true">←</span> Back to courses
            </button>

            <section
              className={`course-detail-hero course-art-${selectedCourse.id}`}
            >
              <div className="course-detail-hero-copy">
                <span className="course-detail-kicker">
                  LEARNSPACE COURSE
                </span>
                <span className="course-detail-category">
                  {selectedCourse.category}
                </span>
                <h1>{selectedCourse.title}</h1>
                <p>{selectedCourse.description}</p>

                <div className="course-detail-instructor">
                  <span className="course-instructor-avatar">
                    {selectedCourse.instructor.charAt(0)}
                  </span>
                  <span>
                    <small>Course instructor</small>
                    <strong>{selectedCourse.instructor}</strong>
                  </span>
                </div>
              </div>

              <div className="course-detail-hero-art">
                <span aria-hidden="true">{selectedCourse.icon}</span>
                <span className="course-hero-sparkle">✦</span>
              </div>
            </section>

            <section className="course-detail-stats" aria-label="Course summary">
              <article className="course-stat-card">
                <span className="course-stat-icon">◷</span>
                <div>
                  <small>Duration</small>
                  <strong>{selectedCourse.duration}</strong>
                </div>
              </article>

              <article className="course-stat-card">
                <span className="course-stat-icon">▣</span>
                <div>
                  <small>Difficulty</small>
                  <strong>{selectedCourse.level}</strong>
                </div>
              </article>

              <article className="course-stat-card">
                <span className="course-stat-icon">▤</span>
                <div>
                  <small>Category</small>
                  <strong>{selectedCourse.category}</strong>
                </div>
              </article>
            </section>

            <div className="course-detail-layout">
              <div className="course-detail-main">
                <section className="course-detail-panel">
                  <span className="course-section-eyebrow">
                    COURSE OVERVIEW
                  </span>
                  <h2>About this course</h2>
                  <p>{selectedCourse.description}</p>
                  <p>
                    This course is designed to help you build your knowledge
                    step by step. Explore the learning outcomes and sample
                    content below.
                  </p>
                </section>

                <section className="course-detail-panel">
                  <span className="course-section-eyebrow">
                    YOUR LEARNING GOALS
                  </span>
                  <h2>What you’ll learn</h2>

                  <div className="course-outcomes">
                    {outcomes.map((outcome) => (
                      <div className="course-outcome" key={outcome}>
                        <span aria-hidden="true">✓</span>
                        <p>{outcome}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="course-detail-panel">
                  <span className="course-section-eyebrow">
                    START LEARNING
                  </span>
                  <h2>Course content</h2>
                  <p className="course-content-intro">
                    Preview the sample learning sections for this course.
                  </p>

                  <div className="course-lesson-list">
                    {lessons.map((lesson, index) => (
                      <div className="course-lesson-row" key={lesson}>
                        <span className="course-lesson-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="course-lesson-text">
                          <strong>{lesson}</strong>
                          <small>Sample lesson · Preview only</small>
                        </span>
                        <span
                          className="course-lesson-lock"
                          aria-label="Preview only"
                        >
                          ◇
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="course-preview-notice">
                    These are sample learning sections. Full lessons will be
                    added later.
                  </p>
                </section>
              </div>

              <aside className="course-detail-sidebar">
                <div className="course-sidebar-icon">
                  {selectedCourse.icon}
                </div>

                <span className="course-section-eyebrow">
                  YOUR NEXT STEP
                </span>

                <h3>
                  {isCourseEnrolled
                    ? "You're enrolled!"
                    : "Ready to grow your skills?"}
                </h3>

                <p>
                  {isCourseEnrolled
                    ? "Your enrollment is saved. You can return to this course anytime."
                    : "Enroll now to add this course to your learning journey."}
                </p>

                {isLoadingEnrollments && (
                  <p role="status">Checking your enrollment...</p>
                )}

                {enrollmentMessage && (
                  <p
                    role="status"
                    aria-live="polite"
                    style={{
                      background:
                        enrollmentMessageType === "success"
                          ? "#e8f8ee"
                          : "#fff0f0",
                      color:
                        enrollmentMessageType === "success"
                          ? "#18794e"
                          : "#c0392b",
                      padding: "12px",
                      borderRadius: "8px",
                      marginTop: "12px",
                    }}
                  >
                    {enrollmentMessage}
                  </p>
                )}

                <button
                  type="button"
                  className="submit-button"
                  onClick={handleEnroll}
                  disabled={
                    isEnrolling ||
                    isLoadingEnrollments ||
                    isCourseEnrolled
                  }
                  style={{ marginTop: "16px" }}
                >
                  {isEnrolling
                    ? "Enrolling..."
                    : isCourseEnrolled
                      ? "Already enrolled ✓"
                      : "Enroll in this course"}
                </button>

                <div className="course-sidebar-divider" />

                <div className="course-sidebar-detail">
                  <span>Instructor</span>
                  <strong>{selectedCourse.instructor}</strong>
                </div>

                <div className="course-sidebar-detail">
                  <span>Course length</span>
                  <strong>{selectedCourse.duration}</strong>
                </div>

                <div className="course-sidebar-detail">
                  <span>Level</span>
                  <strong>{selectedCourse.level}</strong>
                </div>

                <button
                  type="button"
                  className="course-sidebar-back"
                  onClick={() => setSelectedCourse(null)}
                >
                  Explore other courses <span aria-hidden="true">→</span>
                </button>
              </aside>
            </div>
          </section>
        </main>
      );
    }

    // Student course dashboard.
    return (
      <main className="student-dashboard">
        <header className="student-topbar">
          <a
            className="student-brand"
            href="#dashboard"
            onClick={(event) => event.preventDefault()}
          >
            <span className="brand-icon">L</span>
            <span>LearnSpace</span>
          </a>

          <div className="student-topbar-right">
            <span className="student-role-pill">Student</span>
            <button
              type="button"
              className="student-signout"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="student-dashboard-content">
          <div className="student-welcome">
            <div>
              <span className="student-eyebrow">YOUR LEARNING SPACE</span>
              <h1>
                Welcome back{student?.name ? `, ${student.name}` : ""}! 👋
              </h1>
              <p>What would you like to learn today?</p>
            </div>
            <div className="student-welcome-mark" aria-hidden="true">
              ✨
            </div>
          </div>

          <section className="student-summary" aria-label="Learning summary">
            <div className="student-summary-card">
              <span className="student-summary-icon">📚</span>
              <div>
                <strong>{SAMPLE_COURSES.length}</strong>
                <span>Courses to explore</span>
              </div>
            </div>

            <div className="student-summary-card">
              <span className="student-summary-icon">🎯</span>
              <div>
                <strong>Learn</strong>
                <span>At your own pace</span>
              </div>
            </div>

            <div className="student-summary-card">
              <span className="student-summary-icon">🌱</span>
              <div>
                <strong>Start today</strong>
                <span>Build a new skill</span>
              </div>
            </div>
          </section>

          <section className="student-courses-section">
            <div className="student-courses-heading">
              <div>
                <span className="student-eyebrow">GROW YOUR SKILLS</span>
                <h2>Explore courses</h2>
                <p>Find a course that matches your interests.</p>
              </div>
            </div>

            <label className="student-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.target.value)}
                placeholder="Search courses, topics, or instructors..."
                aria-label="Search courses"
              />
            </label>

            <div className="student-category-list" aria-label="Filter by category">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`student-category-button ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="student-course-grid">
              {filteredCourses.map((course) => (
                <article className="student-course-card" key={course.id}>
                  <div className={`student-course-art course-art-${course.id}`}>
                    <span className="student-course-icon" aria-hidden="true">
                      {course.icon}
                    </span>
                    <span className="student-course-category">
                      {course.category}
                    </span>
                  </div>

                  <div className="student-course-body">
                    <div className="student-course-meta">
                      <span>{course.level}</span>
                      <span>{course.duration}</span>
                    </div>

                    <h3>{course.title}</h3>
                    <p>{course.description}</p>

                    <div className="student-course-footer">
                      <span>By {course.instructor}</span>
                      <button
                        type="button"
                        className="student-course-action"
                        onClick={() => {
                          setSelectedCourse(course);
                          setEnrollmentMessage("");
                          setEnrollmentMessageType("");
                        }}
                      >
                        View course <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="student-empty-state">
                <span aria-hidden="true">🔎</span>
                <h3>No courses found</h3>
                <p>
                  Try another search term or choose a different category.
                </p>
                <button
                  type="button"
                  className="student-course-action"
                  onClick={() => {
                    setCourseSearch("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </section>
      </main>
    );
  }

  // Instructor and admin dashboards.
  if (page === "instructor" || page === "admin") {
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("lmsUser") || "null");
    } catch {
      user = null;
    }

    const isInstructor = page === "instructor";

    const dashboard = {
      eyebrow: isInstructor ? "YOUR TEACHING SPACE" : "PLATFORM MANAGEMENT",
      title: isInstructor ? "Instructor Dashboard" : "Admin Dashboard",
      description: isInstructor
        ? "Prepare courses, manage classes, and help students learn new skills."
        : "Manage users, courses, and the LearnSpace platform.",
      features: isInstructor
        ? [
            "Create and Manage Courses",
            "Manage Live Classes",
            "View Student Progress",
          ]
        : ["Manage Users", "Manage Courses", "Platform Overview"],
    };

    return (
      <main className="auth-page">
        <section className="form-panel">
          <div className="form-container">
            <div className="mobile-brand">
              <span className="brand-icon">L</span>
              <span>LearnSpace</span>
            </div>

            <div className="form-heading">
              <span className="form-eyebrow">{dashboard.eyebrow}</span>
              <h2>{dashboard.title}</h2>
              <p>
                {user?.name
                  ? `Welcome, ${user.name}!`
                  : "Welcome to LearnSpace!"}
              </p>
              <p>{dashboard.description}</p>
              <p>
                <strong>Role:</strong> {page}
              </p>
            </div>

            <div className="dashboard-features">
              {dashboard.features.map((feature) => (
                <div className="benefit" key={feature}>
                  <span className="benefit-check">✓</span>
                  {feature}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="submit-button"
              onClick={handleSignOut}
            >
              Sign out <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  // Registration and login pages.
  return (
    <main className="auth-page">
      <section className="auth-layout">
        <aside className="welcome-panel">
          <a
            className="brand"
            href="#home"
            onClick={(event) => event.preventDefault()}
          >
            <span className="brand-icon">L</span>
            <span>LearnSpace</span>
          </a>

          <div className="welcome-content">
            <span className="eyebrow">YOUR LEARNING JOURNEY STARTS HERE</span>

            <h1>Learn new skills. Unlock your potential.</h1>

            <p>
              One place to discover courses, learn from expert instructors,
              and make progress toward your goals.
            </p>

            <div className="learning-illustration" aria-hidden="true">
              <div className="orbit orbit-one"></div>
              <div className="orbit orbit-two"></div>
              <div className="book book-back"></div>

              <div className="book book-front">
                <span>LEARN</span>
                <div className="book-line"></div>
                <div className="book-line short"></div>
                <div className="book-line"></div>
              </div>

              <div className="floating-star">✦</div>
              <div className="floating-dot"></div>
            </div>

            <div className="benefits">
              <div className="benefit">
                <span className="benefit-check">✓</span>
                Learn at your own pace
              </div>
              <div className="benefit">
                <span className="benefit-check">✓</span>
                Connect with instructors
              </div>
              <div className="benefit">
                <span className="benefit-check">✓</span>
                Track your learning progress
              </div>
            </div>
          </div>

          <p className="panel-footer">Learn something new every day.</p>
        </aside>

        <section className="form-panel">
          <div className="form-container">
            <div className="mobile-brand">
              <span className="brand-icon">L</span>
              <span>LearnSpace</span>
            </div>

            <div className="form-heading">
              <span className="form-eyebrow">
                {isRegister ? "GET STARTED FOR FREE" : "WELCOME BACK"}
              </span>

              <h2>
                {isRegister
                  ? "Create your account"
                  : "Sign in to LearnSpace"}
              </h2>

              <p>
                {isRegister
                  ? "Join our learning community in just a few steps."
                  : "Enter your details to continue learning."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div className="form-group">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>

                <div className="password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      isRegister
                        ? "At least 8 characters"
                        : "Enter your password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    minLength={isRegister ? 8 : undefined}
                    required
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {isRegister && (
                <>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm password</label>

                    <div className="password-wrapper">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Enter your password again"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        className="show-password"
                        onClick={() =>
                          setShowConfirmPassword((previous) => !previous)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="role">I want to join as</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                </>
              )}

              {message && (
                <p
                  className="form-message"
                  role="status"
                  aria-live="polite"
                  style={{
                    background:
                      messageType === "success" ? "#e8f8ee" : "#fff0f0",
                    color:
                      messageType === "success" ? "#18794e" : "#c0392b",
                  }}
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isRegister
                    ? "Creating account..."
                    : "Signing in..."
                  : isRegister
                    ? "Create account"
                    : "Sign in"}

                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="signin-text">
              {isRegister
                ? "Already have an account? "
                : "Don't have an account? "}

              <a
                href={isRegister ? "#login" : "#register"}
                onClick={(event) => {
                  event.preventDefault();
                  switchPage(isRegister ? "login" : "register");
                }}
              >
                {isRegister ? "Sign in" : "Create account"}
              </a>
            </p>

            <p className="privacy-text">
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
