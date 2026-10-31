import { useEffect, useState } from "react";
import "./InstructorDashboard.css";

const API_URL = "http://localhost:5000/api/courses";

export default function InstructorDashboard({ user, onSignOut }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    title: "",
    description: "",
    category: "",
    level: "Beginner",
    price: "0",
    image: "",
  };

  const [form, setForm] = useState(emptyForm);

  async function requestApi(url, options = {}) {
    const token = localStorage.getItem("lmsToken");

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  }

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const data = await requestApi(`${API_URL}/mine`);
      setCourses(Array.isArray(data) ? data : data.courses || []);
    } catch (err) {
      setError(err.message || "Could not load your courses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const payload = { ...form, price: Number(form.price) };

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
    } catch (err) {
      setError(err.message || "Could not save the course.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(course) {
    setEditingId(course.courseId);
    setForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      level: course.level || "Beginner",
      price: String(course.price ?? 0),
      image: course.image || "",
    });
    setMessage("");
    setError("");
    document.getElementById("instructor-create")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleDelete(course) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await requestApi(
        `${API_URL}/${encodeURIComponent(course.courseId)}`,
        { method: "DELETE" }
      );

      setCourses((previous) =>
        previous.filter((item) => item.courseId !== course.courseId)
      );

      if (editingId === course.courseId) resetForm();
      setMessage("Course deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete the course.");
    }
  }

  const categoryCount = new Set(
    courses.map((course) => course.category).filter(Boolean)
  ).size;
  const freeCourseCount = courses.filter(
    (course) => Number(course.price || 0) === 0
  ).length;

  return (
    <div className="instructor-layout">
      <aside className="instructor-sidebar">
        <a className="instructor-brand" href="#dashboard" aria-label="LearnSpace home">
          <span className="instructor-brand-mark">L</span>
          <span>learn<span>space</span></span>
        </a>

        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="instructor-nav" aria-label="Instructor navigation">
          <a className="instructor-nav-link active" href="#dashboard">
            <span className="nav-icon">▦</span> Overview
          </a>
          <a className="instructor-nav-link" href="#instructor-courses">
            <span className="nav-icon">▤</span> My courses
          </a>
         
        </nav>

        <div className="sidebar-help">
          <div className="sidebar-help-icon">✦</div>
          <strong>Keep learners moving</strong>
          <p>Create clear, engaging courses that help students build real skills.</p>
        </div>

        <button className="sidebar-signout" type="button" onClick={onSignOut}>
          <span>↪</span> Sign out
        </button>
      </aside>

      <main className="instructor-main" id="dashboard">
        <header className="instructor-topbar">
          <div>
            <div className="topbar-eyebrow">TEACHING WORKSPACE</div>
            <div className="topbar-title">Instructor portal</div>
          </div>
          <div className="instructor-profile">
            <div className="profile-avatar">
              {(user?.name || "I").trim().charAt(0).toUpperCase()}
            </div>
            <div className="profile-copy">
              <strong>{user?.name || "Instructor"}</strong>
              <span>Instructor</span>
            </div>
          </div>
        </header>

        <div className="instructor-content">
          <section className="welcome-banner">
            <div>
              <span className="welcome-kicker">YOUR TEACHING SPACE</span>
              <h1>Welcome back{user?.name ? `, ${user.name}` : ""}.</h1>
              <p>Manage your courses and create meaningful learning experiences.</p>
            </div>
            <a className="welcome-action" href="#instructor-create">
              <span>＋</span> Create course
            </a>
            <div className="welcome-decoration welcome-decoration-one" />
            <div className="welcome-decoration welcome-decoration-two" />
          </section>

          {error && (
            <div className="dashboard-alert error-alert" role="alert">
              <span>!</span>{error}
            </div>
          )}
          {message && (
            <div className="dashboard-alert success-alert" role="status">
              <span>✓</span>{message}
            </div>
          )}

          <section className="instructor-stats" aria-label="Course statistics">
            <article className="instructor-stat-card">
              <div className="stat-icon purple-icon">▤</div>
              <div><span>Total courses</span><strong>{loading ? "—" : courses.length}</strong><small>Courses in your workspace</small></div>
            </article>
            <article className="instructor-stat-card">
              <div className="stat-icon blue-icon">◈</div>
              <div><span>Course categories</span><strong>{loading ? "—" : categoryCount}</strong><small>Unique categories used</small></div>
            </article>
            <article className="instructor-stat-card">
              <div className="stat-icon green-icon">◇</div>
              <div><span>Free courses</span><strong>{loading ? "—" : freeCourseCount}</strong><small>Courses priced at zero</small></div>
            </article>
          </section>

          <section className="instructor-section" id="instructor-create">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">{editingId ? "UPDATE CONTENT" : "BUILD YOUR CLASSROOM"}</span>
                <h2>{editingId ? "Edit course" : "Create a course"}</h2>
                <p>Add the details students need to understand your course.</p>
              </div>
              {editingId && <span className="editing-pill">Editing course</span>}
            </div>

            <form className="course-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field form-field-wide">
                  <span>Course title <b>*</b></span>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    placeholder="e.g. JavaScript Fundamentals"
                  />
                </label>

                <label className="form-field form-field-wide">
                  <span>Course description <b>*</b></span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    maxLength={3000}
                    rows={4}
                    placeholder="Describe what students will learn in this course..."
                  />
                </label>

                <label className="form-field">
                  <span>Category <b>*</b></span>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="e.g. Programming"
                  />
                </label>

                <label className="form-field">
                  <span>Course level</span>
                  <select name="level" value={form.level} onChange={handleChange}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Price (₹)</span>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Course image URL <em>Optional</em></span>
                  <input
                    type="url"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="https://example.com/course-image.jpg"
                  />
                </label>
              </div>

              <div className="form-footer">
                <p><span>*</span> Required fields</p>
                <div className="form-actions">
                  {editingId && (
                    <button className="button button-light" type="button" onClick={resetForm}>
                      Cancel
                    </button>
                  )}
                  <button className="button button-primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save changes" : "Create course"}
                    {!saving && <span>→</span>}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="instructor-section" id="instructor-courses">
            <div className="section-heading courses-heading">
              <div>
                <span className="section-eyebrow">YOUR CONTENT LIBRARY</span>
                <h2>My courses <span className="course-count">{courses.length}</span></h2>
                <p>View and manage the courses you've created.</p>
              </div>
              <button className="button button-light refresh-button" type="button" onClick={loadCourses} disabled={loading}>
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div className="course-empty-state"><div className="loading-spinner" />Loading your courses...</div>
            ) : courses.length === 0 ? (
              <div className="course-empty-state">
                <div className="empty-state-icon">▤</div>
                <h3>Your course library is empty</h3>
                <p>Create your first course and it will appear here.</p>
                <a className="button button-primary" href="#instructor-create">Create your first course <span>→</span></a>
              </div>
            ) : (
              <div className="instructor-course-grid">
                {courses.map((course) => (
                  <article className="instructor-course-card" key={course.courseId}>
                    <div className="course-card-image">
                      {course.image ? (
                        <img
                          src={course.image}
                          alt={course.title}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="course-image-placeholder">
                          <span>LEARN</span>
                          <strong>{course.title?.charAt(0)?.toUpperCase() || "L"}</strong>
                        </div>
                      )}
                      <span className="course-level-tag">{course.level || "Course"}</span>
                    </div>
                    <div className="course-card-body">
                      <div className="course-card-category">{course.category || "General"}</div>
                      <h3>{course.title}</h3>
                      <p className="course-card-description">{course.description}</p>
                      <div className="course-card-meta">
                        <span>{Number(course.price || 0) === 0 ? "Free" : `₹${course.price}`}</span>
                        <span>Instructor course</span>
                      </div>
                      <div className="course-card-actions">
                        <button className="button button-primary" type="button" onClick={() => handleEdit(course)}>
                          Edit course
                        </button>
                        <button className="button button-danger-light" type="button" onClick={() => handleDelete(course)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="instructor-footer">
            <span>© {new Date().getFullYear()} LearnSpace</span>
            <span>Teaching workspace</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
