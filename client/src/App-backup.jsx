import { useEffect, useState } from "react";
import "./App.css";
import InstructorDashboard from "./InstructorDashboard";


const API_URL = "http://localhost:5000/api/auth";
const ENROLLMENT_API_URL = "http://localhost:5000/api/enrollments";
const PROGRESS_API_URL = "http://localhost:5000/api/progress";

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

  // Lesson progress is loaded from and saved to the backend.
  const [completedLessons, setCompletedLessons] = useState({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressMessageType, setProgressMessageType] = useState("");

  const getCourseProgress = (courseId, totalLessons = 3) => {
    const completed = completedLessons[String(courseId)] || [];
    return Math.round((completed.length / totalLessons) * 100);
  };

  const toggleLessonComplete = async (courseId, lessonIndex) => {
    const token = localStorage.getItem("lmsToken");

    if (!token) {
      setProgressMessage("Please sign in to save lesson progress.");
      setProgressMessageType("error");
      return;
    }

    const courseKey = String(courseId);
    const current = completedLessons[courseKey] || [];
    const next = current.includes(lessonIndex)
      ? current.filter((index) => index !== lessonIndex)
      : [...current, lessonIndex];

    setIsSavingProgress(true);
    setProgressMessage("");
    setProgressMessageType("");

    try {
      const response = await fetch(PROGRESS_API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: courseKey,
          completedLessons: next,
          totalLessons: 3,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to save lesson progress.");
      }

      setCompletedLessons((previous) => ({
        ...previous,
        [courseKey]: data.completedLessons || next,
      }));
      setProgressMessage("Lesson progress saved.");
      setProgressMessageType("success");
    } catch (error) {
      setProgressMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Your progress was not saved."
          : error.message || "Unable to save lesson progress."
      );
      setProgressMessageType("error");
    } finally {
      setIsSavingProgress(false);
    }
  };

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

  // Load saved lesson progress whenever a student opens a course.
  useEffect(() => {
    if (page !== "student" || !selectedCourse) {
      setProgressMessage("");
      setProgressMessageType("");
      return;
    }

    const token = localStorage.getItem("lmsToken");
    if (!token) {
      setProgressMessage("Please sign in to view saved lesson progress.");
      setProgressMessageType("error");
      return;
    }

    let cancelled = false;

    const loadProgress = async () => {
      setIsLoadingProgress(true);
      setProgressMessage("");
      setProgressMessageType("");

      try {
        const response = await fetch(
          `${PROGRESS_API_URL}/${encodeURIComponent(String(selectedCourse.id))}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load lesson progress.");
        }

        if (!cancelled) {
          setCompletedLessons((previous) => ({
            ...previous,
            [String(selectedCourse.id)]: data.completedLessons || [],
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setProgressMessage(
            error.message === "Failed to fetch"
              ? "Cannot connect to the server to load progress."
              : error.message || "Unable to load lesson progress."
          );
          setProgressMessageType("error");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProgress(false);
        }
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [page, selectedCourse]);

  // Load the student's saved enrollments for the dashboard and course details.
  useEffect(() => {
    if (page !== "student") {
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
  }, [page]);

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

      // Three lessons per course so saved progress indexes remain compatible
      // with the current backend API (totalLessons: 3).
      const lessonMaterials = {
        1: [
          {
            title: "Lesson 1: HTML Page Structure",
            description: "Learn how HTML describes the content of a web page.",
            content: "HTML uses elements to organize headings, paragraphs, links, images, and other content. Most elements have an opening tag and a closing tag.",
            example: '<h1>Hello, world!</h1>\n<p>This is my first web page.</p>',
          },
          {
            title: "Lesson 2: Styling with CSS",
            description: "Use CSS to control colors, spacing, and layout.",
            content: "CSS rules contain a selector and declarations. Each declaration has a property and a value. You can place CSS in a separate stylesheet and link it to your HTML page.",
            example: 'h1 {\n  color: blue;\n  text-align: center;\n}',
          },
          {
            title: "Lesson 3: JavaScript Basics",
            description: "Start adding behavior to web pages.",
            content: "JavaScript can store values in variables, respond to events, and update page content. Open the browser developer console to try simple expressions.",
            example: 'const message = "Hello from JavaScript";\nconsole.log(message);',
          },
        ],
        2: [
          {
            title: "Lesson 1: Introduction to Java",
            description: "Understand Java and run your first program.",
            content: "Java is a general-purpose programming language. A basic Java application can start in the main method. Save this example in a file named Main.java, then compile and run it with a JDK.",
            example: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, Java!");\n  }\n}',
          },
          {
            title: "Lesson 2: Variables and Data Types",
            description: "Store text, numbers, and true/false values.",
            content: "Variables store values. Common types include int for whole numbers, double for decimal numbers, char for a single character, boolean for true or false, and String for text. Choose a type that fits the data you need to represent.",
            example: 'public class Main {\n  public static void main(String[] args) {\n    String name = "Sakshi";\n    int age = 22;\n    double score = 85.5;\n    boolean learning = true;\n\n    System.out.println(name);\n    System.out.println(age);\n    System.out.println(score);\n    System.out.println(learning);\n  }\n}',
          },
          {
            title: "Lesson 3: Conditions and Loops",
            description: "Make decisions and repeat instructions.",
            content: "An if/else statement chooses a branch based on a condition. A for loop repeats a block of code. In this example, the program checks a number and then prints the numbers 1 through 3.",
            example: 'public class Main {\n  public static void main(String[] args) {\n    int number = 5;\n\n    if (number > 0) {\n      System.out.println("Positive");\n    } else {\n      System.out.println("Zero or negative");\n    }\n\n    for (int i = 1; i <= 3; i++) {\n      System.out.println(i);\n    }\n  }\n}',
          },
        ],
        3: [
          {
            title: "Lesson 1: User-Centered Design",
            description: "Start with the people who will use the product.",
            content: "User-centered design considers users' goals, needs, and limitations. Identify the target users and the task they need to complete before deciding how the interface should look.",
          },
          {
            title: "Lesson 2: Color and Typography",
            description: "Create readable and consistent visual styles.",
            content: "Use a limited color palette and clear typographic hierarchy. Maintain readable text sizes, sufficient contrast, and consistent spacing so users can scan the interface easily.",
          },
          {
            title: "Lesson 3: Wireframes and Feedback",
            description: "Plan a screen before creating the final design.",
            content: "A wireframe is a simplified layout showing where content and controls belong. Share a wireframe with someone, observe whether they can complete the main task, and improve the layout based on their feedback.",
          },
        ],
        4: [
          {
            title: "Lesson 1: Tables and Relationships",
            description: "Learn how relational databases organize information.",
            content: "A table stores records in rows and attributes in columns. A primary key uniquely identifies each row, while a foreign key can connect a record to another table.",
            example: 'CREATE TABLE Students (\n  student_id INT PRIMARY KEY,\n  name VARCHAR(100) NOT NULL\n);',
          },
          {
            title: "Lesson 2: Querying Data with SQL",
            description: "Retrieve and filter records using SELECT.",
            content: "SELECT chooses columns, FROM names the table, and WHERE filters rows. Use ORDER BY when you need results in a particular order.",
            example: 'SELECT name\nFROM Students\nWHERE student_id > 10\nORDER BY name;',
          },
          {
            title: "Lesson 3: Joining Tables",
            description: "Combine related information from multiple tables.",
            content: "A JOIN combines rows from tables using a related column. An INNER JOIN returns rows with matching values in both tables.",
            example: 'SELECT Students.name, Enrollments.course_id\nFROM Students\nINNER JOIN Enrollments\n  ON Students.student_id = Enrollments.student_id;',
          },
        ],
        5: [
          {
            title: "Lesson 1: Python Variables",
            description: "Store values and work with basic data types.",
            content: "Python variables are created when you assign a value. Common values include strings, integers, floating-point numbers, and booleans.",
            example: 'name = "Sakshi"\nage = 22\nscore = 85.5\nprint(name, age, score)',
          },
          {
            title: "Lesson 2: Conditions and Loops",
            description: "Control which instructions run and how often.",
            content: "Use if/else to choose between actions. A for loop can visit each item in a sequence or iterate over a range of numbers.",
            example: 'number = 5\nif number > 0:\n    print("Positive")\n\nfor i in range(1, 4):\n    print(i)',
          },
          {
            title: "Lesson 3: Reusable Functions",
            description: "Group instructions into functions.",
            content: "Functions are defined with def. They can accept parameters and return a result, helping you reuse logic instead of repeating code.",
            example: 'def add(a, b):\n    return a + b\n\nprint(add(2, 3))',
          },
        ],
        6: [
          {
            title: "Lesson 1: React Components",
            description: "Build interfaces from reusable pieces.",
            content: "A React component is a JavaScript function that returns UI. Component names conventionally begin with a capital letter.",
            example: 'function Welcome() {\n  return <h1>Welcome to LearnSpace</h1>;\n}',
          },
          {
            title: "Lesson 2: Props and State",
            description: "Pass data into components and track changing values.",
            content: "Props pass information from a parent component to a child. State stores information that can change over time and cause the UI to render again.",
            example: 'function Greeting({ name }) {\n  return <p>Hello, {name}!</p>;\n}',
          },
          {
            title: "Lesson 3: Handling Events",
            description: "Respond to clicks and other user actions.",
            content: "React event handlers let components respond to user interactions. Pass a function to an event prop such as onClick.",
            example: 'function ClickButton() {\n  return (\n    <button onClick={() => alert("Hello!")}>\n      Click me\n    </button>\n  );\n}',
          },
        ],
      };

      const lessons = lessonMaterials[selectedCourse.id] || lessonMaterials[1];
      const completedForCourse =
        completedLessons[String(selectedCourse.id)] || [];
      const courseProgress = getCourseProgress(selectedCourse.id, lessons.length);

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
                    Explore the lesson explanations and examples below. Mark each lesson complete when you have finished studying it.
                  </p>

                  <div style={{ margin: "16px 0" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "8px",
                        fontWeight: 600,
                      }}
                    >
                      <span>Your progress</span>
                      <span>{courseProgress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label="Course completion"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={courseProgress}
                      style={{
                        height: "10px",
                        background: "#e8eaf0",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${courseProgress}%`,
                          height: "100%",
                          background: "#4f46e5",
                          borderRadius: "999px",
                          transition: "width 180ms ease",
                        }}
                      />
                    </div>
                    <small>
                      {completedForCourse.length} of {lessons.length} lessons completed
                    </small>
                  </div>

                  {progressMessage && (
                    <p
                      role="status"
                      aria-live="polite"
                      style={{
                        background: progressMessageType === "success" ? "#e8f8ee" : "#fff0f0",
                        color: progressMessageType === "success" ? "#18794e" : "#c0392b",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        margin: "12px 0",
                      }}
                    >
                      {progressMessage}
                    </p>
                  )}

                  {isLoadingProgress && (
                    <p role="status">Loading saved progress...</p>
                  )}

                  <div className="course-lesson-list">
                    {lessons.map((lesson, index) => {
                      const isCompleted = completedForCourse.includes(index);
                      return (
                        <article className="course-lesson-row" key={lesson.title}>
                          <span className="course-lesson-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="course-lesson-text">
                            <strong>{lesson.title}</strong>
                            <small>{lesson.description}</small>
                            <p>{lesson.content}</p>
                            {lesson.example && (
                              <pre
                                style={{
                                  padding: "12px",
                                  borderRadius: "8px",
                                  background: "#f3f4f6",
                                  color: "#1f2937",
                                  whiteSpace: "pre-wrap",
                                  overflowX: "auto",
                                  fontSize: "13px",
                                  maxWidth: "100%",
                                }}
                              >
                                <code>{lesson.example}</code>
                              </pre>
                            )}
                            <small>{isCompleted ? "Completed" : "Not completed yet"}</small>
                          </div>
                          <button
                            type="button"
                            className="student-course-action"
                            onClick={() =>
                              toggleLessonComplete(selectedCourse.id, index)
                            }
                            aria-pressed={isCompleted}
                            disabled={isLoadingProgress || isSavingProgress}
                          >
                            {isSavingProgress
                              ? "Saving..."
                              : isCompleted
                                ? "✓ Completed"
                                : "Mark complete"}
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  <p className="course-preview-notice">
                    Lesson progress is saved to your account and loaded from the server. Course materials are being developed progressively.
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
                <span className="student-eyebrow">YOUR LEARNING JOURNEY</span>
                <h2>My Enrolled Courses</h2>
                <p>Pick up where you left off with your enrolled courses.</p>
              </div>
              <span className="student-role-pill">
                {enrollments.length} {enrollments.length === 1 ? "course" : "courses"}
              </span>
            </div>

            {isLoadingEnrollments ? (
              <p role="status">Loading your enrolled courses...</p>
            ) : enrollmentMessage && enrollmentMessageType === "error" ? (
              <p role="status" aria-live="polite" className="form-message">
                {enrollmentMessage}
              </p>
            ) : enrollments.length === 0 ? (
              <div className="student-empty-state">
                <span aria-hidden="true">📚</span>
                <h3>You haven't enrolled in any courses yet</h3>
                <p>Explore the courses below and enroll in one to see it here.</p>
              </div>
            ) : (
              <div className="student-course-grid">
                {enrollments.map((enrollment) => {
                  const course = SAMPLE_COURSES.find(
                    (item) => String(item.id) === String(enrollment.courseId)
                  );

                  return (
                    <article
                      className="student-course-card"
                      key={`${enrollment.courseId}-${enrollment._id || enrollment.enrolledAt || ""}`}
                    >
                      <div
                        className={`student-course-art ${
                          course ? `course-art-${course.id}` : ""
                        }`}
                      >
                        <span className="student-course-icon" aria-hidden="true">
                          {course?.icon || "📘"}
                        </span>
                        <span className="student-course-category">
                          {course?.category || "Enrolled course"}
                        </span>
                      </div>

                      <div className="student-course-body">
                        <div className="student-course-meta">
                          <span>{enrollment.status || "enrolled"}</span>
                          <span>
                            {course?.duration || "Course"}
                          </span>
                        </div>

                        <h3>{course?.title || enrollment.courseTitle}</h3>
                        <p>
                          {course?.description ||
                            "This course is saved in your enrollment list."}
                        </p>

                        <div className="student-course-footer">
                          <span>Saved to your learning space</span>
                          {course ? (
                            <button
                              type="button"
                              className="student-course-action"
                              onClick={() => {
                                setSelectedCourse(course);
                                setEnrollmentMessage("");
                                setEnrollmentMessageType("");
                              }}
                            >
                              Continue learning <span aria-hidden="true">→</span>
                            </button>
                          ) : (
                            <span className="student-role-pill">Enrolled</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
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
  if (page === "instructor") {
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("lmsUser") || "null");
    } catch {
      user = null;
    }

    return (
      <InstructorDashboard
        user={user}
        onSignOut={handleSignOut}
      />
    );
  }

  if (page === "admin") {
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("lmsUser") || "null");
    } catch {
      user = null;
    }

    return (
      <main className="auth-page">
        <section className="form-panel">
          <div className="form-container">
            <div className="mobile-brand">
              <span className="brand-icon">L</span>
              <span>LearnSpace</span>
            </div>

            <div className="form-heading">
              <span className="form-eyebrow">PLATFORM MANAGEMENT</span>
              <h2>Admin Dashboard</h2>
              <p>
                {user?.name
                  ? `Welcome, ${user.name}!`
                  : "Welcome to LearnSpace!"}
              </p>
              <p>Manage users, courses, and the LearnSpace platform.</p>
              <p><strong>Role:</strong> admin</p>
            </div>

            <div className="dashboard-features">
              {["Manage Users", "Manage Courses", "Platform Overview"].map(
                (feature) => (
                  <div className="benefit" key={feature}>
                    <span className="benefit-check">✓</span>
                    {feature}
                  </div>
                )
              )}
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
