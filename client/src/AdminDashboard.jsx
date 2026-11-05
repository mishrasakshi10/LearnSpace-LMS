
import { useEffect, useState } from "react";
import "./AdminDashboard.css";

const API_URL = "http://localhost:5000/api/admin";

function AdminDashboard({ user, onSignOut }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Edit Course States
  const [editingCourse, setEditingCourse] = useState(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "Beginner",
    price: 0,
  });

  // Fetch all admin data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("lmsToken");
        const headers = { Authorization: `Bearer ${token}` };

        const endpoints = [
          "dashboard",
          "users",
          "courses",
          "enrollments",
          "live-classes",
        ];

        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(`${API_URL}/${endpoint}`, { headers })
          )
        );

        const results = await Promise.all(
          responses.map(async (response) => {
            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.message || "Unable to load admin data"
              );
            }

            return data;
          })
        );

        setDashboard(results[0]);
        setUsers(results[1].users || []);
        setCourses(results[2].courses || []);
        setEnrollments(results[3].enrollments || []);
        setLiveClasses(results[4].liveClasses || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const stats = dashboard?.statistics;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "users", label: "User Management", icon: "♙" },
    { id: "courses", label: "Course Management", icon: "▤" },
    { id: "enrollments", label: "Enrollments", icon: "▣" },
    { id: "liveClasses", label: "Live Classes", icon: "◷" },
  ];

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: "👥" },
    { title: "Students", value: stats?.totalStudents ?? 0, icon: "🎓" },
    { title: "Instructors", value: stats?.totalInstructors ?? 0, icon: "👨‍🏫" },
    { title: "Courses", value: stats?.totalCourses ?? 0, icon: "📚" },
    { title: "Enrollments", value: stats?.totalEnrollments ?? 0, icon: "📝" },
    { title: "Live Classes", value: stats?.totalLiveClasses ?? 0, icon: "🎥" },
  ];

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  // Block or Activate User
  const handleUserStatus = async (userId, currentStatus) => {
    const newStatus =
      currentStatus === "blocked" ? "active" : "blocked";

    try {
      setUpdatingUserId(userId);
      setActionMessage("");

      const token = localStorage.getItem("lmsToken");

      const response = await fetch(
        `${API_URL}/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update user status."
        );
      }

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item._id === userId
            ? { ...item, status: newStatus }
            : item
        )
      );

      setActionMessage(data.message);
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setUpdatingUserId("");
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId, courseTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${courseTitle}"?`
    );

    if (!confirmed) return;

    try {
      setActionMessage("");

      const token = localStorage.getItem("lmsToken");

      const response = await fetch(
        `${API_URL}/courses/${courseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete course."
        );
      }

      setCourses((previousCourses) =>
        previousCourses.filter(
          (course) => course._id !== courseId
        )
      );

      setActionMessage(data.message);
    } catch (error) {
      setActionMessage(error.message);
    }
  };

  // Open Edit Course Form
  const handleEditCourse = (course) => {
    setEditingCourse(course);

    setEditForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      level: course.level || "Beginner",
      price: course.price ?? 0,
    });

    setActionMessage("");
  };

  // Handle Edit Form Input Changes
  const handleEditFormChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previousForm) => ({
      ...previousForm,
      [name]: name === "price" ? value : value,
    }));
  };

  // Save Updated Course
  const handleSaveCourse = async (event) => {
    event.preventDefault();

    if (!editingCourse) return;

    try {
      setSavingCourse(true);
      setActionMessage("");

      const token = localStorage.getItem("lmsToken");

      const response = await fetch(
        `${API_URL}/courses/${editingCourse._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...editForm,
            price: Number(editForm.price),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update course."
        );
      }

      setCourses((previousCourses) =>
        previousCourses.map((course) =>
          course._id === editingCourse._id
            ? data.course
            : course
        )
      );

      // Update recently added course details on dashboard
      setDashboard((previousDashboard) => {
        if (!previousDashboard) return previousDashboard;

        return {
          ...previousDashboard,
          recentCourses: previousDashboard.recentCourses?.map(
            (course) =>
              course._id === editingCourse._id
                ? {
                    ...course,
                    ...data.course,
                  }
                : course
          ),
        };
      });

      setEditingCourse(null);
      setActionMessage(data.message);
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setSavingCourse(false);
    }
  };

  // Dashboard Section
  const renderDashboard = () => (
    <>
      <section className="admin-welcome">
        <div>
          <span>WELCOME BACK</span>
          <h2>Hello, {user?.name || "Admin"}!</h2>
          <p>
            Here's what's happening on your learning platform.
          </p>
        </div>

        <div className="admin-welcome-icon">📊</div>
      </section>

      <section className="admin-section">
        <h2>Platform Overview</h2>

        <div className="admin-stats-grid">
          {statCards.map((card) => (
            <div className="admin-stat-card" key={card.title}>
              <div className="admin-stat-icon">{card.icon}</div>
              <p>{card.title}</p>
              <h3>{card.value}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Enrollment Overview</h2>

        <div className="admin-overview-grid">
          <div className="admin-info-card">
            <span>Active Enrollments</span>
            <h3>{stats?.activeEnrollments ?? 0}</h3>
          </div>

          <div className="admin-info-card">
            <span>Completed Enrollments</span>
            <h3>{stats?.completedEnrollments ?? 0}</h3>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2>Live Class Overview</h2>

        <div className="admin-overview-grid">
          {[
            ["Scheduled", stats?.scheduledClasses],
            ["Currently Live", stats?.liveClasses],
            ["Completed", stats?.completedClasses],
            ["Cancelled", stats?.cancelledClasses],
          ].map(([label, value]) => (
            <div className="admin-info-card" key={label}>
              <span>{label}</span>
              <h3>{value ?? 0}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Recently Added Courses</h2>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Category</th>
                <th>Instructor</th>
                <th>Level</th>
              </tr>
            </thead>

            <tbody>
              {dashboard?.recentCourses?.length ? (
                dashboard.recentCourses.map((course) => (
                  <tr key={course._id}>
                    <td>{course.title}</td>
                    <td>{course.category}</td>
                    <td>{course.instructorName}</td>
                    <td>{course.level}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    No courses available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Upcoming Live Classes</h2>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Course</th>
                <th>Instructor</th>
                <th>Scheduled At</th>
              </tr>
            </thead>

            <tbody>
              {dashboard?.upcomingClasses?.length ? (
                dashboard.upcomingClasses.map((item) => (
                  <tr key={item._id}>
                    <td>{item.title}</td>
                    <td>{item.courseTitle}</td>
                    <td>{item.instructorName}</td>
                    <td>{formatDate(item.scheduledAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No upcoming classes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  // User Management Section
  const renderUsers = () => (
    <section className="admin-section">
      <h2>User Management</h2>
      <p>View and manage registered platform users.</p>

      {actionMessage && (
        <div className="admin-error">{actionMessage}</div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.length > 0 ? (
              users.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>

                  <td>
                    <span
                      className={`admin-status-badge ${
                        item.status || "active"
                      }`}
                    >
                      {item.status || "active"}
                    </span>
                  </td>

                  <td>{formatDate(item.createdAt)}</td>

                  <td>
                    {item.role === "admin" ? (
                      <span>Protected</span>
                    ) : (
                      <button
                        className={`admin-action-btn ${
                          item.status === "blocked"
                            ? "activate"
                            : "block"
                        }`}
                        disabled={updatingUserId === item._id}
                        onClick={() =>
                          handleUserStatus(
                            item._id,
                            item.status || "active"
                          )
                        }
                      >
                        {updatingUserId === item._id
                          ? "Updating..."
                          : item.status === "blocked"
                          ? "Activate"
                          : "Block"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // Course Management Section
  const renderCourses = () => (
    <section className="admin-section">
      <h2>Course Management</h2>
      <p>View and manage all courses created by instructors.</p>

      {actionMessage && (
        <div className="admin-error">{actionMessage}</div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Course ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Instructor</th>
              <th>Level</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {courses.length ? (
              courses.map((item) => (
                <tr key={item._id}>
                  <td>{item.courseId}</td>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td>{item.instructorName}</td>
                  <td>{item.level}</td>

                  <td>
                    {item.price === 0
                      ? "Free"
                      : `₹${item.price}`}
                  </td>

                  <td>
                    <div className="admin-course-actions">
                      <button
                        type="button"
                        className="admin-action-btn activate"
                        onClick={() => handleEditCourse(item)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-action-btn block"
                        onClick={() =>
                          handleDeleteCourse(
                            item._id,
                            item.title
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No courses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // Enrollment Management Section
  const renderEnrollments = () => (
    <section className="admin-section">
      <h2>Enrollment Management</h2>
      <p>View student course enrollments and their status.</p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Course</th>
              <th>Status</th>
              <th>Enrolled At</th>
            </tr>
          </thead>

          <tbody>
            {enrollments.length ? (
              enrollments.map((item) => (
                <tr key={item._id}>
                  <td>{item.studentId?.name || "Unknown"}</td>
                  <td>{item.studentId?.email || "—"}</td>
                  <td>{item.courseTitle}</td>
                  <td>{item.status}</td>
                  <td>{formatDate(item.enrolledAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No enrollments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // Live Classes Section
  const renderLiveClasses = () => (
    <section className="admin-section">
      <h2>Live Class Management</h2>
      <p>View all scheduled and completed live classes.</p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Course</th>
              <th>Instructor</th>
              <th>Scheduled At</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {liveClasses.length ? (
              liveClasses.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.courseTitle}</td>
                  <td>{item.instructorName}</td>
                  <td>{formatDate(item.scheduledAt)}</td>
                  <td>{item.duration} min</td>
                  <td>{item.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No live classes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="admin-loading">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-logo">L</span>
          <span>LearnSpace</span>
        </div>

        <p className="admin-sidebar-label">ADMIN PANEL</p>

        <nav className="admin-navigation">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`admin-nav-item ${
                activeSection === item.id ? "active" : ""
              }`}
              onClick={() => {
                setActiveSection(item.id);
                setActionMessage("");
              }}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <button className="admin-logout" onClick={onSignOut}>
          ↪ Sign Out
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">PLATFORM MANAGEMENT</p>

            <h1>
              {menuItems.find(
                (item) => item.id === activeSection
              )?.label}
            </h1>

            <p>Manage and monitor your LearnSpace platform.</p>
          </div>

          <div className="admin-profile">
            <div className="admin-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div>
              <strong>{user?.name || "Administrator"}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {error && <div className="admin-error">{error}</div>}

        {!error && (
          <>
            {activeSection === "dashboard" && renderDashboard()}
            {activeSection === "users" && renderUsers()}
            {activeSection === "courses" && renderCourses()}
            {activeSection === "enrollments" && renderEnrollments()}
            {activeSection === "liveClasses" && renderLiveClasses()}
          </>
        )}

        {/* Edit Course Modal */}
        {editingCourse && (
          <div className="admin-modal-overlay">
            <div className="admin-edit-modal">
              <div className="admin-modal-header">
                <div>
                  <h2>Edit Course</h2>
                  <p>Update course information below.</p>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setEditingCourse(null)}
                  disabled={savingCourse}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveCourse}>
                <div className="admin-edit-form">
                  <label>
                    Course Title
                    <input
                      type="text"
                      name="title"
                      value={editForm.title}
                      onChange={handleEditFormChange}
                      required
                    />
                  </label>

                  <label>
                    Description
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditFormChange}
                      rows="4"
                      required
                    />
                  </label>

                  <label>
                    Category
                    <input
                      type="text"
                      name="category"
                      value={editForm.category}
                      onChange={handleEditFormChange}
                      required
                    />
                  </label>

                  <label>
                    Course Level
                    <select
                      name="level"
                      value={editForm.level}
                      onChange={handleEditFormChange}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </label>

                  <label>
                    Price (₹)
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={handleEditFormChange}
                      required
                    />
                  </label>
                </div>

                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-cancel-btn"
                    onClick={() => setEditingCourse(null)}
                    disabled={savingCourse}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-save-btn"
                    disabled={savingCourse}
                  >
                    {savingCourse ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
