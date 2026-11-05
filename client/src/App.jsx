
import { useEffect, useState } from "react";
import "./App.css";
import InstructorDashboard from "./InstructorDashboard";
import Quiz from "./Quiz";
import LiveClassroom from "./LiveClassroom";
import AdminDashboard from "./AdminDashboard";
import Logo from "./Logo";

const API_URL = "http://localhost:5000/api/auth";
const COURSES_API_URL = "http://localhost:5000/api/courses";
const ENROLLMENT_API_URL = "http://localhost:5000/api/enrollments";
const PROGRESS_API_URL = "http://localhost:5000/api/progress";
const CERTIFICATE_API_URL = "http://localhost:5000/api/certificates";
const LIVE_CLASSES_API_URL = "http://localhost:5000/api/live-classes";

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

// Use the same ID format for courses returned by the backend.
function getCourseId(course) {
  return String(course?.courseId || course?._id || course?.id || "");
}

function getRoleFromToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    let payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    payload += "=".repeat((4 - (payload.length % 4)) % 4);

    return JSON.parse(atob(payload)).role || null;
  } catch {
    return null;
  }
}

function getInitialPage() {
  try {
    const token = localStorage.getItem("lmsToken");
    const savedUser = localStorage.getItem("lmsUser");

    if (!token || !savedUser) return "login";

    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token");

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

// Sample lessons are used only for the six built-in sample courses.
const lessonMaterials = {
  1: [
    {
      title: "Lesson 1: HTML Page Structure",
      description: "Learn how HTML describes the content of a web page.",
      content: "HTML uses elements to organize headings, paragraphs, links, images, and other content.",
      example: '<h1>Hello, world!</h1>\n<p>This is my first web page.</p>',
    },
    {
      title: "Lesson 2: Styling with CSS",
      description: "Use CSS to control colors, spacing, and layout.",
      content: "CSS rules contain a selector and declarations. Each declaration has a property and a value.",
      example: "h1 {\n  color: blue;\n  text-align: center;\n}",
    },
    {
      title: "Lesson 3: JavaScript Basics",
      description: "Start adding behavior to web pages.",
      content: "JavaScript can store values in variables, respond to events, and update page content.",
      example: 'const message = "Hello from JavaScript";\nconsole.log(message);',
    },
  ],
  2: [
    {
      title: "Lesson 1: Introduction to Java",
      description: "Understand Java and run your first program.",
      content: "Java is a general-purpose programming language. A basic Java application starts in the main method.",
      example: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, Java!");\n  }\n}',
    },
    {
      title: "Lesson 2: Variables and Data Types",
      description: "Store text, numbers, and true/false values.",
      content: "Common Java types include int, double, char, boolean, and String.",
      example: 'String name = "Sakshi";\nint age = 22;\ndouble score = 85.5;',
    },
    {
      title: "Lesson 3: Conditions and Loops",
      description: "Make decisions and repeat instructions.",
      content: "An if/else statement chooses a branch. A for loop repeats a block of code.",
      example: 'if (number > 0) {\n  System.out.println("Positive");\n}\n\nfor (int i = 1; i <= 3; i++) {\n  System.out.println(i);\n}',
    },
  ],
  3: [
    {
      title: "Lesson 1: User-Centered Design",
      description: "Start with the people who will use the product.",
      content: "User-centered design considers users' goals, needs, and limitations.",
    },
    {
      title: "Lesson 2: Color and Typography",
      description: "Create readable and consistent visual styles.",
      content: "Use a limited color palette, clear typographic hierarchy, and sufficient contrast.",
    },
    {
      title: "Lesson 3: Wireframes and Feedback",
      description: "Plan a screen before creating the final design.",
      content: "A wireframe is a simplified layout showing where content and controls belong.",
    },
  ],
  4: [
    {
      title: "Lesson 1: Tables and Relationships",
      description: "Learn how relational databases organize information.",
      content: "A table stores records in rows and attributes in columns. A primary key uniquely identifies each row.",
      example: "CREATE TABLE Students (\n  student_id INT PRIMARY KEY,\n  name VARCHAR(100) NOT NULL\n);",
    },
    {
      title: "Lesson 2: Querying Data with SQL",
      description: "Retrieve and filter records using SELECT.",
      content: "SELECT chooses columns, FROM names the table, and WHERE filters rows.",
      example: "SELECT name\nFROM Students\nWHERE student_id > 10\nORDER BY name;",
    },
    {
      title: "Lesson 3: Joining Tables",
      description: "Combine related information from multiple tables.",
      content: "A JOIN combines rows from tables using a related column.",
      example: "SELECT Students.name, Enrollments.course_id\nFROM Students\nINNER JOIN Enrollments\nON Students.student_id = Enrollments.student_id;",
    },
  ],
  5: [
    {
      title: "Lesson 1: Python Variables",
      description: "Store values and work with basic data types.",
      content: "Python variables are created when you assign a value.",
      example: 'name = "Sakshi"\nage = 22\nscore = 85.5\nprint(name, age, score)',
    },
    {
      title: "Lesson 2: Conditions and Loops",
      description: "Control which instructions run and how often.",
      content: "Use if/else to choose between actions. A for loop can visit each item in a sequence.",
      example: 'number = 5\nif number > 0:\n    print("Positive")\n\nfor i in range(1, 4):\n    print(i)',
    },
    {
      title: "Lesson 3: Reusable Functions",
      description: "Group instructions into functions.",
      content: "Functions are defined with def. They can accept parameters and return a result.",
      example: "def add(a, b):\n    return a + b\n\nprint(add(2, 3))",
    },
  ],
  6: [
    {
      title: "Lesson 1: React Components",
      description: "Build interfaces from reusable pieces.",
      content: "A React component is a JavaScript function that returns UI.",
      example: "function Welcome() {\n  return <h1>Welcome to LearnSpace</h1>;\n}",
    },
    {
      title: "Lesson 2: Props and State",
      description: "Pass data into components and track changing values.",
      content: "Props pass information from a parent to a child. State stores information that can change over time.",
      example: "function Greeting({ name }) {\n  return <p>Hello, {name}!</p>;\n}",
    },
    {
      title: "Lesson 3: Handling Events",
      description: "Respond to clicks and other user actions.",
      content: "React event handlers let components respond to user interactions.",
      example: 'function ClickButton() {\n  return <button onClick={() => alert("Hello!")}>Click me</button>;\n}',
    },
  ],
};

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

function App() {
  const [page, setPage] = useState(getInitialPage);
  const [activeStudentPage, setActiveStudentPage] = useState("dashboard");

  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseLoadError, setCourseLoadError] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);

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

  const [enrollments, setEnrollments] = useState([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState("");
  const [enrollmentMessageType, setEnrollmentMessageType] = useState("");

  const [completedLessons, setCompletedLessons] = useState({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressMessageType, setProgressMessageType] = useState("");

  // Certificate download state.
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false);
  const [certificateMessage, setCertificateMessage] = useState("");
  const [certificateMessageType, setCertificateMessageType] = useState("");

  // Student live-class state.
  const [liveClasses, setLiveClasses] = useState([]);
  const [isLoadingLiveClasses, setIsLoadingLiveClasses] = useState(false);
  const [liveClassesError, setLiveClassesError] = useState("");
  const [activeLiveClass, setActiveLiveClass] = useState(null);

  // Actual lessons fetched from the instructor-created course.
  const [serverLessons, setServerLessons] = useState([]);
  const [loadedLessonsCourseId, setLoadedLessonsCourseId] = useState("");
  const [isLoadingCourseLessons, setIsLoadingCourseLessons] = useState(false);
  const [courseLessonsError, setCourseLessonsError] = useState("");

  const isRegister = page === "register";

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const getCourseProgress = (courseId, totalLessons) => {
    if (!totalLessons) return 0;

    const completed = completedLessons[String(courseId)] || [];
    return Math.round((completed.length / totalLessons) * 100);
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
    setCourses([]);
    setEnrollments([]);
    setCompletedLessons({});
    setServerLessons([]);
    setLoadedLessonsCourseId("");
    setEnrollmentMessage("");
    setEnrollmentMessageType("");
    setActiveStudentPage("dashboard");

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
          data.message || "Account created successfully! You can now sign in.",
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
      setCompletedLessons({});
      setPage(userRole);
      setActiveStudentPage("dashboard");
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

  // Load courses from the backend.
  useEffect(() => {
    if (page !== "student") return;

    const token = localStorage.getItem("lmsToken");

    if (!token) {
      setCourses([]);
      setCourseLoadError("Please sign in to view courses.");
      return;
    }

    const controller = new AbortController();

    const loadCourses = async () => {
      setIsLoadingCourses(true);
      setCourseLoadError("");

      try {
        const response = await fetch(COURSES_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load courses.");
        }

        const backendCourses = Array.isArray(data.courses)
          ? data.courses
          : Array.isArray(data)
            ? data
            : [];

        if (!controller.signal.aborted) {
          setCourses(backendCourses);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setCourseLoadError(error.message || "Unable to load courses.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCourses(false);
        }
      }
    };

    loadCourses();

    return () => controller.abort();
  }, [page]);

  // Load the student's enrollments.
  useEffect(() => {
    if (page !== "student") return;

    const token = localStorage.getItem("lmsToken");

    if (!token) {
      setEnrollments([]);
      setEnrollmentMessage("Please sign in to view your enrollments.");
      setEnrollmentMessageType("error");
      return;
    }

    const controller = new AbortController();

    const loadEnrollments = async () => {
      setIsLoadingEnrollments(true);
      setEnrollmentMessage("");
      setEnrollmentMessageType("");

      try {
        const response = await fetch(ENROLLMENT_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your enrollments.");
        }

        if (!controller.signal.aborted) {
          setEnrollments(data.enrollments || []);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setEnrollmentMessage(
            error.message === "Failed to fetch"
              ? "Cannot connect to the enrollment server."
              : error.message
          );
          setEnrollmentMessageType("error");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingEnrollments(false);
        }
      }
    };

    loadEnrollments();

    return () => controller.abort();
  }, [page]);

  // Load live classes available to the enrolled student.
  useEffect(() => {
    if (page !== "student") return;

    const token = localStorage.getItem("lmsToken");

    if (!token) {
      setLiveClasses([]);
      setLiveClassesError("Please sign in to view live classes.");
      return;
    }

    const controller = new AbortController();

    const loadLiveClasses = async () => {
      setIsLoadingLiveClasses(true);
      setLiveClassesError("");

      try {
        const response = await fetch(`${LIVE_CLASSES_API_URL}/student`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load live classes.");
        }

        const classes = Array.isArray(data.liveClasses)
          ? data.liveClasses
          : Array.isArray(data.classes)
            ? data.classes
            : Array.isArray(data)
              ? data
              : [];

        if (!controller.signal.aborted) {
          setLiveClasses(classes);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setLiveClassesError(
            error.message || "Unable to load live classes."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingLiveClasses(false);
        }
      }
    };

    loadLiveClasses();

    return () => controller.abort();
  }, [page]);

  // Load the complete course, including lessons added by its instructor.
  useEffect(() => {
    if (page !== "student" || !selectedCourse) {
      setServerLessons([]);
      setLoadedLessonsCourseId("");
      setCourseLessonsError("");
      return;
    }

    const courseId = getCourseId(selectedCourse);
    const token = localStorage.getItem("lmsToken");

    if (!courseId || !token) {
      setServerLessons([]);
      setLoadedLessonsCourseId("");
      setCourseLessonsError("Please sign in to view course lessons.");
      return;
    }

    const controller = new AbortController();

    const loadCourseLessons = async () => {
      setIsLoadingCourseLessons(true);
      setCourseLessonsError("");
      setLoadedLessonsCourseId("");
      setServerLessons([]);

      try {
        const response = await fetch(
          `${COURSES_API_URL}/${encodeURIComponent(courseId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load course lessons.");
        }

        const fullCourse = data.course || data;

        const fetchedLessons = Array.isArray(fullCourse.lessons)
          ? fullCourse.lessons
          : Array.isArray(data.lessons)
            ? data.lessons
            : [];

        if (!controller.signal.aborted) {
          setServerLessons(fetchedLessons);
          setLoadedLessonsCourseId(courseId);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setCourseLessonsError(
            error.message || "Unable to load course lessons."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCourseLessons(false);
        }
      }
    };

    loadCourseLessons();

    return () => controller.abort();
  }, [page, selectedCourse]);

  // Load saved lesson progress for the selected course.
  useEffect(() => {
    if (page !== "student" || !selectedCourse) {
      setProgressMessage("");
      setProgressMessageType("");
      return;
    }

    const courseId = getCourseId(selectedCourse);
    const token = localStorage.getItem("lmsToken");

    if (!token || !courseId) {
      setProgressMessage("Please sign in to view saved lesson progress.");
      setProgressMessageType("error");
      return;
    }

    const controller = new AbortController();

    const loadProgress = async () => {
      setIsLoadingProgress(true);
      setProgressMessage("");
      setProgressMessageType("");

      try {
        const response = await fetch(
          `${PROGRESS_API_URL}/${encodeURIComponent(courseId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load lesson progress.");
        }

        if (!controller.signal.aborted) {
          setCompletedLessons((previous) => ({
            ...previous,
            [courseId]: data.completedLessons || [],
          }));
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setProgressMessage(
            error.message === "Failed to fetch"
              ? "Cannot connect to the server to load progress."
              : error.message || "Unable to load lesson progress."
          );
          setProgressMessageType("error");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProgress(false);
        }
      }
    };

    loadProgress();

    return () => controller.abort();
  }, [page, selectedCourse]);

  // Determine whether the selected course is already enrolled.
  const isCourseEnrolled = selectedCourse
    ? enrollments.some(
        (enrollment) =>
          String(enrollment.courseId) === getCourseId(selectedCourse)
      )
    : false;

  // Enroll the logged-in student.
  const handleEnroll = async () => {
    if (!selectedCourse || isEnrolling || isCourseEnrolled) return;

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
          courseId: getCourseId(selectedCourse),
          courseTitle: selectedCourse.title,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to enroll in this course.");
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

  // Save or remove a completed lesson.
  const toggleLessonComplete = async (
    courseId,
    lessonIndex,
    totalLessons
  ) => {
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
          totalLessons,
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

  // Download the course completion certificate.
  const handleDownloadCertificate = async () => {
    if (!selectedCourse || isDownloadingCertificate) return;

    const token = localStorage.getItem("lmsToken");
    const courseId = getCourseId(selectedCourse);

    if (!token) {
      setCertificateMessage("Please sign in to download your certificate.");
      setCertificateMessageType("error");
      return;
    }

    setIsDownloadingCertificate(true);
    setCertificateMessage("");
    setCertificateMessageType("");

    try {
      const response = await fetch(
        `${CERTIFICATE_API_URL}/${encodeURIComponent(courseId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to generate certificate.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `LearnSpace-Certificate-${courseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setCertificateMessage("Your certificate has been downloaded successfully!");
      setCertificateMessageType("success");
    } catch (error) {
      setCertificateMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the certificate server."
          : error.message || "Certificate download failed."
      );
      setCertificateMessageType("error");
    } finally {
      setIsDownloadingCertificate(false);
    }
  };

  // Open the selected live classroom.
  const handleJoinLiveClass = (liveClass) => {
    setActiveLiveClass(liveClass);
  };

  // Return from the live classroom to the student dashboard.
  const handleExitStudentClassroom = () => {
    setActiveLiveClass(null);
  };

  // Instructor dashboard.
  if (page === "instructor") {
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("lmsUser") || "null");
    } catch {
      user = null;
    }

    return <InstructorDashboard user={user} onSignOut={handleSignOut} />;
  }

  // Admin dashboard.
 if (page === "admin") {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("lmsUser") || "null");
  } catch {
    user = null;
  }

  return (
    <AdminDashboard
      user={user}
      onSignOut={handleSignOut}
    />
  );
}

  // Student dashboard.
  if (page === "student") {

  // Show the live classroom when the student joins a live session.
  if (activeLiveClass) {
  return (
    <LiveClassroom
      liveClassId={activeLiveClass._id}
      liveClassTitle={activeLiveClass.title}
      onExit={handleExitStudentClassroom}
    />
  );
}

  // Quiz screen
  if (showQuiz && selectedCourse) {
    return (
      <Quiz
        courseId={getCourseId(selectedCourse)}
        onBack={() => setShowQuiz(false)}
      />
    );
  }

    let student = null;

    try {
      student = JSON.parse(localStorage.getItem("lmsUser") || "null");
    } catch {
      student = null;
    }

    const categories = [
      "All",
      ...new Set(
        courses
          .map((course) => course.category || "Other")
          .filter(Boolean)
      ),
    ];

    const filteredCourses = courses.filter((course) => {
      const search = courseSearch.trim().toLowerCase();

      const title = String(course.title || "");
      const description = String(course.description || "");
      const category = String(course.category || "Other");
      const instructor = String(course.instructor || "Instructor");

      const matchesSearch =
        title.toLowerCase().includes(search) ||
        description.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search) ||
        instructor.toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "All" ||
        category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Selected course detail page.
    if (selectedCourse) {
      const selectedCourseId = getCourseId(selectedCourse);
      const sampleCourse = SAMPLE_COURSES.find(
        (course) => String(course.id) === selectedCourseId
      );

      const isSampleCourse = Boolean(sampleCourse);

      // Use backend lessons when available. Sample courses use local sample
      // lessons only if the backend has not returned any lessons.
      const lessons =
        loadedLessonsCourseId === selectedCourseId
          ? serverLessons
          : isSampleCourse
            ? lessonMaterials[sampleCourse.id] || []
            : [];

      const completedForCourse =
        completedLessons[selectedCourseId] || [];

      const courseProgress = getCourseProgress(
        selectedCourseId,
        lessons.length
      );

      const outcomes =
        courseLearning[sampleCourse?.id] || [];

      const instructorName =
        selectedCourse.instructor || "LearnSpace Instructor";

      const courseTitle =
        selectedCourse.title || "Untitled Course";

      const courseDescription =
        selectedCourse.description || "Explore this course and its lessons.";

      const courseCategory =
        selectedCourse.category || "General";

      const courseIcon =
        selectedCourse.icon || sampleCourse?.icon || "📘";

      const courseDuration =
        selectedCourse.duration || "Self-paced";

      const courseLevel =
        selectedCourse.level || "All levels";

      const courseArtId =
        sampleCourse?.id || selectedCourseId || "custom";

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

            <section className={`course-detail-hero course-art-${courseArtId}`}>
              <div className="course-detail-hero-copy">
                <span className="course-detail-kicker">
                  LEARNSPACE COURSE
                </span>

                <span className="course-detail-category">
                  {courseCategory}
                </span>

                <h1>{courseTitle}</h1>
                <p>{courseDescription}</p>

                <div className="course-detail-instructor">
                  <span className="course-instructor-avatar">
                    {instructorName.charAt(0).toUpperCase()}
                  </span>

                  <span>
                    <small>Course instructor</small>
                    <strong>{instructorName}</strong>
                  </span>
                </div>
              </div>

              <div className="course-detail-hero-art">
                <span aria-hidden="true">{courseIcon}</span>
                <span className="course-hero-sparkle">✦</span>
              </div>
            </section>

            <section className="course-detail-stats" aria-label="Course summary">
              <article className="course-stat-card">
                <span className="course-stat-icon">◷</span>
                <div>
                  <small>Duration</small>
                  <strong>{courseDuration}</strong>
                </div>
              </article>

              <article className="course-stat-card">
                <span className="course-stat-icon">▣</span>
                <div>
                  <small>Difficulty</small>
                  <strong>{courseLevel}</strong>
                </div>
              </article>

              <article className="course-stat-card">
                <span className="course-stat-icon">▤</span>
                <div>
                  <small>Category</small>
                  <strong>{courseCategory}</strong>
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
                  <p>{courseDescription}</p>
                  <p>
                    This course is designed to help you build your knowledge
                    step by step. Explore the learning outcomes and course
                    materials below.
                  </p>
                </section>


                {outcomes.length > 0 && (
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
                )}

                <section className="course-detail-panel">
                  <span className="course-section-eyebrow">
                    START LEARNING
                  </span>
                  <h2>Course content</h2>

                  <p className="course-content-intro">
                    Explore the lessons added by your instructor. Mark each
                    lesson complete after studying it.
                  </p>

                  {isLoadingCourseLessons && (
                    <p role="status">Loading course lessons...</p>
                  )}

                  {courseLessonsError && (
                    <p
                      role="alert"
                      style={{
                        color: "#c0392b",
                        background: "#fff0f0",
                        padding: "12px",
                        borderRadius: "8px",
                      }}
                    >
                      {courseLessonsError}
                    </p>
                  )}

                  {!isLoadingCourseLessons &&
                    !courseLessonsError &&
                    loadedLessonsCourseId === selectedCourseId &&
                    lessons.length === 0 && (
                      <div className="student-empty-state">
                        <span aria-hidden="true">📖</span>
                        <h3>No lessons added yet</h3>
                        <p>
                          The instructor has not added lessons to this course
                          yet. Please check again later.
                        </p>
                      </div>
                    )}

                  {lessons.length > 0 && (
                    <>
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
                          {completedForCourse.length} of {lessons.length}{" "}
                          lessons completed
                        </small>
                      </div>

                      {progressMessage && (
                        <p
                          role="status"
                          aria-live="polite"
                          style={{
                            background:
                              progressMessageType === "success"
                                ? "#e8f8ee"
                                : "#fff0f0",
                            color:
                              progressMessageType === "success"
                                ? "#18794e"
                                : "#c0392b",
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
                          const isCompleted =
                            completedForCourse.includes(index);

                          return (
                            <article
                              className="course-lesson-row"
                              key={lesson._id || lesson.id || `${lesson.title}-${index}`}
                            >
                              <span className="course-lesson-number">
                                {String(index + 1).padStart(2, "0")}
                              </span>

                              <div className="course-lesson-text">
                                <strong>
                                  {lesson.title || `Lesson ${index + 1}`}
                                </strong>

                                {lesson.description && (
                                  <small>{lesson.description}</small>
                                )}

                                {lesson.content && <p>{lesson.content}</p>}

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

                                {lesson.videoUrl && (
                                  <p>
                                    <a
                                      href={lesson.videoUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      ▶ Watch lesson video
                                    </a>
                                  </p>
                                )}

                                {lesson.resourceUrl && (
                                  <p>
                                    <a
                                      href={lesson.resourceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open lesson resource
                                    </a>
                                  </p>
                                )}

                                <small>
                                  {isCompleted
                                    ? "Completed"
                                    : "Not completed yet"}
                                </small>
                              </div>

                              <button
                                type="button"
                                className="student-course-action"
                                onClick={() =>
                                  toggleLessonComplete(
                                    selectedCourseId,
                                    index,
                                    lessons.length
                                  )
                                }
                                aria-pressed={isCompleted}
                                disabled={
                                  isLoadingProgress || isSavingProgress
                                }
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
                    </>
                  )}

                                   <p className="course-preview-notice">
                    Lesson progress is saved to your account and loaded from
                    the server.
                  </p>
                </section>

                {/* Quiz section - visible only after all lessons are completed */}
                {isCourseEnrolled && (
                  <section className="take-quiz-card">
                    <div className="take-quiz-info">
                      <span className="take-quiz-icon">📝</span>
                      <div>
                        <h3>Ready to Test Your Knowledge?</h3>
                        <p>
                          Complete all course lessons to unlock your quiz.
                        </p>
                      </div>
                    </div>

                   
<button
  type="button"
  className="take-quiz-btn"
  disabled={
    lessons.length === 0 ||
    completedForCourse.length !== lessons.length
  }
  onClick={() => setShowQuiz(true)}
>
  {lessons.length > 0 &&
  completedForCourse.length === lessons.length
    ? (
      <>
        Start Quiz <span>→</span>
      </>
    )
    : "🔒 Complete all lessons first"}
</button>
</section>
)}


                {/* Certificate section - shown after all lessons are completed */}
                {isCourseEnrolled &&
                  lessons.length > 0 &&
                  loadedLessonsCourseId === selectedCourseId &&
                  completedForCourse.length === lessons.length && (
                    <section className="take-quiz-card">
                      <div className="take-quiz-info">
                        <span className="take-quiz-icon">🏆</span>
                        <div>
                          <h3>Congratulations on completing the course!</h3>
                          <p>
                            Your learning achievement is ready. Download your certificate.
                          </p>
                        </div>
                      </div>

                      {certificateMessage && (
                        <p
                          role="status"
                          aria-live="polite"
                          style={{
                            color:
                              certificateMessageType === "success"
                                ? "#18794e"
                                : "#c0392b",
                            margin: "12px 0",
                          }}
                        >
                          {certificateMessage}
                        </p>
                      )}

                      <button
                        type="button"
                        className="take-quiz-btn"
                        onClick={handleDownloadCertificate}
                        disabled={isDownloadingCertificate}
                      >
                        {isDownloadingCertificate
                          ? "Generating certificate..."
                          : "🏆 Download Certificate"}
                      </button>
                    </section>
                  )}
              </div>

              <aside className="course-detail-sidebar">
                <div className="course-sidebar-icon">{courseIcon}</div>

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
                  <strong>{instructorName}</strong>
                </div>

                <div className="course-sidebar-detail">
                  <span>Course length</span>
                  <strong>{courseDuration}</strong>
                </div>

                <div className="course-sidebar-detail">
                  <span>Level</span>
                  <strong>{courseLevel}</strong>
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

    // Student dashboard.
    return (
      <main className="student-dashboard">
        <div className="student-dashboard-shell">
          <aside className="student-sidebar">
            <a
  className="student-sidebar-brand"
  href="#student-overview"
  onClick={(event) => event.preventDefault()}
>
  <Logo width={150} />
</a>
            <p className="student-sidebar-label">LEARNING MENU</p>
            <nav className="student-sidebar-nav" aria-label="Student dashboard navigation">
              <button
                type="button"
                className={`student-sidebar-link ${activeStudentPage === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveStudentPage("dashboard")}
              >
                <span aria-hidden="true">⌂</span>
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                className={`student-sidebar-link ${activeStudentPage === "live-classes" ? "active" : ""}`}
                onClick={() => setActiveStudentPage("live-classes")}
              >
                <span aria-hidden="true">▣</span>
                <span>Live Classes</span>
              </button>
              <button
                type="button"
                className={`student-sidebar-link ${activeStudentPage === "my-learning" ? "active" : ""}`}
                onClick={() => setActiveStudentPage("my-learning")}
              >
                <span aria-hidden="true">▤</span>
                <span>My Learning</span>
              </button>
              <button
                type="button"
                className={`student-sidebar-link ${activeStudentPage === "explore-courses" ? "active" : ""}`}
                onClick={() => setActiveStudentPage("explore-courses")}
              >
                <span aria-hidden="true">⌕</span>
                <span>Explore Courses</span>
              </button>
              <button
                type="button"
                className={`student-sidebar-link ${activeStudentPage === "certificates" ? "active" : ""}`}
                onClick={() => setActiveStudentPage("certificates")}
              >
                <span aria-hidden="true">🏆</span>
                <span>Certificates</span>
              </button>
            </nav>

            <div className="student-sidebar-bottom">
              <div className="student-sidebar-tip">
                <span aria-hidden="true">✨</span>
                <strong>Keep growing!</strong>
                <small>Every lesson brings you closer to your goals.</small>
              </div>
              <button
                type="button"
                className="student-sidebar-signout"
                onClick={handleSignOut}
              >
                <span aria-hidden="true">↪</span> Sign out
              </button>
            </div>
          </aside>

          <div className="student-main-area">
            <header className="student-topbar">
              <div className="student-topbar-heading">
                <span className="student-topbar-eyebrow">STUDENT PORTAL</span>
                <strong>
                  {{
                    dashboard: "Dashboard",
                    "live-classes": "Live Classes",
                    "my-learning": "My Learning",
                    "explore-courses": "Explore Courses",
                    certificates: "Certificates",
                  }[activeStudentPage]}
                </strong>
              </div>
              <div className="student-topbar-right">
                <span className="student-role-pill">Student</span>
              </div>
            </header>

            <section className="student-dashboard-content" id="student-overview">
          {activeStudentPage === "dashboard" && (
          <>
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
                <strong>{courses.length}</strong>
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

          <section className="student-quick-actions" aria-label="Dashboard quick actions">
            <button type="button" className="student-quick-action" onClick={() => setActiveStudentPage("my-learning")}>
              <span>📚</span>
              <strong>Continue learning</strong>
              <small>Open your enrolled courses</small>
              <b aria-hidden="true">→</b>
            </button>
            <button type="button" className="student-quick-action" onClick={() => setActiveStudentPage("explore-courses")}>
              <span>🔎</span>
              <strong>Discover courses</strong>
              <small>Find your next skill to learn</small>
              <b aria-hidden="true">→</b>
            </button>
            <button type="button" className="student-quick-action" onClick={() => setActiveStudentPage("live-classes")}>
              <span>🎥</span>
              <strong>Join live classes</strong>
              <small>Learn with your instructors</small>
              <b aria-hidden="true">→</b>
            </button>
          </section>
          </>
          )}

          {activeStudentPage === "live-classes" && (
          <section className="student-courses-section" id="live-classes">
            <div className="student-courses-heading">
              <div>
                <span className="student-eyebrow">LEARN TOGETHER</span>
                <h2>My Live Classes</h2>
                <p>Attend real-time sessions with your instructors.</p>
              </div>

              <span className="student-role-pill">
                {liveClasses.length}{" "}
                {liveClasses.length === 1 ? "Session" : "Sessions"}
              </span>
            </div>

            {isLoadingLiveClasses && (
              <p role="status">Loading live classes...</p>
            )}

            {liveClassesError && (
              <p role="alert" className="form-message">
                {liveClassesError}
              </p>
            )}

            {!isLoadingLiveClasses &&
              !liveClassesError &&
              liveClasses.length === 0 && (
                <div className="student-empty-state">
                  <span aria-hidden="true">🎥</span>
                  <h3>No live classes scheduled</h3>
                  <p>
                    Your instructor's upcoming live sessions will appear here.
                  </p>
                </div>
              )}

            <div className="student-course-grid">
              {liveClasses.map((liveClass) => {
                const status = String(liveClass.status || "scheduled").toLowerCase();
                const isLive = status === "live";
                const isScheduled = status === "scheduled";
                const isUnavailable =
                  status === "completed" || status === "cancelled";

                return (
                  <article
                    className="student-course-card"
                    key={liveClass._id || liveClass.id || liveClass.roomName}
                  >
                    <div className="student-course-art">
                      <span className="student-course-icon" aria-hidden="true">
                        🎥
                      </span>
                      <span className="student-course-category">
                        {liveClass.courseTitle || "Live Session"}
                      </span>
                    </div>

                    <div className="student-course-body">
                      <div className="student-course-meta">
                        <span>
                          {isLive ? "🔴 Live Now" : status}
                        </span>
                        <span>{liveClass.duration || 60} minutes</span>
                      </div>

                      <h3>{liveClass.title || "Live Class"}</h3>
                      <p>
                        {liveClass.description ||
                          "Join your instructor for this live learning session."}
                      </p>
                      <p>
                        <strong>Instructor:</strong>{" "}
                        {liveClass.instructorName || "Instructor"}
                      </p>
                      <p>
                        <strong>Scheduled:</strong>{" "}
                        {liveClass.scheduledAt
                          ? new Date(liveClass.scheduledAt).toLocaleString()
                          : "Not specified"}
                      </p>

                      <div className="student-course-footer">
                        {isLive ? (
                          <button
                            type="button"
                            className="student-course-action"
                            onClick={() => handleJoinLiveClass(liveClass)}
                          >
                            Join Classroom →
                          </button>
                        ) : isScheduled ? (
                          <span className="student-role-pill">Upcoming</span>
                        ) : (
                          <span className="student-role-pill">
                            {status}
                          </span>
                        )}
                      </div>

                      {isUnavailable && (
                        <p>This session is no longer available to join.</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          )}

          {activeStudentPage === "my-learning" && (
          <section className="student-courses-section" id="my-learning">
            <div className="student-courses-heading">
              <div>
                <span className="student-eyebrow">
                  YOUR LEARNING JOURNEY
                </span>
                <h2>My Enrolled Courses</h2>
                <p>
                  Pick up where you left off with your enrolled courses.
                </p>
              </div>

              <span className="student-role-pill">
                {enrollments.length}{" "}
                {enrollments.length === 1 ? "course" : "courses"}
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
                <p>
                  Explore the courses below and enroll in one to see it here.
                </p>
              </div>
            ) : (
              <div className="student-course-grid">
                {enrollments.map((enrollment) => {
                  const course =
  courses.find(
    (item) =>
      getCourseId(item) === String(enrollment.courseId)
  ) || null;
const isUnavailable = !course;
                  return (
                    <article
                      className="student-course-card"
                      key={`${enrollment.courseId}-${enrollment._id || enrollment.enrolledAt || ""}`}
                    >
                      <div
                        className={`student-course-art ${
                          course
                            ? `course-art-${course.id || course._id}`
                            : ""
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
                          <span>
                             {course ? enrollment.status || "Enrolled" : "Unavailable"}
                          </span>
                          <span>{course?.duration || "Course"}</span>
                        </div>

                        <h3>
                          {course?.title ||
                            enrollment.courseTitle ||
                            "Enrolled course"}
                        </h3>

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
                              Continue learning{" "}
                              <span aria-hidden="true">→</span>
                            </button>
                          ) : (
                            <span className="student-role-pill">
                              Course unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          )}

          {activeStudentPage === "explore-courses" && (
          <section className="student-courses-section" id="explore-courses">
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

            <div
              className="student-category-list"
              aria-label="Filter by category"
            >
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

            {isLoadingCourses && (
              <p role="status">Loading available courses...</p>
            )}

            {courseLoadError && (
              <p role="alert" className="form-message">
                {courseLoadError}
              </p>
            )}

            <div className="student-course-grid">
              {filteredCourses.map((course) => {
                const courseId = getCourseId(course);

                return (
                  <article
                    className="student-course-card"
                    key={courseId}
                  >
                    <div
                      className={`student-course-art course-art-${course.id || courseId}`}
                    >
                      <span className="student-course-icon" aria-hidden="true">
                        {course.icon || "📘"}
                      </span>

                      <span className="student-course-category">
                        {course.category || "General"}
                      </span>
                    </div>

                    <div className="student-course-body">
                      <div className="student-course-meta">
                        <span>{course.level || "All levels"}</span>
                        <span>{course.duration || "Self-paced"}</span>
                      </div>

                      <h3>{course.title || "Untitled course"}</h3>
                      <p>{course.description || "Explore this course."}</p>

                      <div className="student-course-footer">
                        <span>By {course.instructor || "LearnSpace Instructor"}</span>

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
                );
              })}
            </div>

            {!isLoadingCourses && filteredCourses.length === 0 && (
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
          )}

          {activeStudentPage === "certificates" && (
            <section className="student-courses-section student-page-panel">
              <div className="student-courses-heading">
                <div>
                  <span className="student-eyebrow">YOUR ACHIEVEMENTS</span>
                  <h2>My Certificates</h2>
                  <p>Complete a course to unlock its certificate.</p>
                </div>
                <span className="student-role-pill">
                  {enrollments.length} enrolled {enrollments.length === 1 ? "course" : "courses"}
                </span>
              </div>

              {isLoadingEnrollments ? (
                <p role="status">Loading your courses...</p>
              ) : enrollments.length === 0 ? (
                <div className="student-empty-state">
                  <span aria-hidden="true">🏆</span>
                  <h3>No certificates yet</h3>
                  <p>Enroll in a course and complete all its lessons to become eligible for a certificate.</p>
                  <button
                    type="button"
                    className="student-course-action"
                    onClick={() => setActiveStudentPage("explore-courses")}
                  >
                    Explore courses →
                  </button>
                </div>
              ) : (
                <div className="student-course-grid">
                  {enrollments.map((enrollment) => {
                    const course =
  courses.find(
    (item) => getCourseId(item) === String(enrollment.courseId)
  ) || null;
                    return (
                      <article
                        className="student-course-card certificate-course-card"
                        key={`certificate-${enrollment.courseId}-${enrollment._id || ""}`}
                      >
                        <div className="student-course-art">
                          <span className="student-course-icon" aria-hidden="true">🏆</span>
                          <span className="student-course-category">Course achievement</span>
                        </div>
                        <div className="student-course-body">
                          <h3>{course?.title || enrollment.courseTitle || "Enrolled course"}</h3>
                          <p>Finish all lessons in this course to unlock and download your certificate.</p>
                          <div className="student-course-footer">
                            <span>Certificate status: check course progress</span>
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
                                View course →
                              </button>
                            ) : (
                              <span className="student-role-pill">Course unavailable</span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
            </section>
          </div>
        </div>
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
            <span className="eyebrow">
              YOUR LEARNING JOURNEY STARTS HERE
            </span>

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

          <p className="panel-footer">
            Learn something new every day.
          </p>
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
                    <label htmlFor="confirmPassword">
                      Confirm password
                    </label>

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
