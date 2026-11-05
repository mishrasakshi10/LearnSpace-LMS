const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const authMiddleware = require("../middleware/authMiddleware");

const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const LiveClass = require("../models/LiveClass");

console.log("ADMIN ROUTES FILE LOADED:", __filename);

// Admin-only access
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only.",
    });
  }

  next();
};

// Dashboard statistics
router.get("/dashboard", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalLiveClasses,
      scheduledClasses,
      liveClasses,
      completedClasses,
      cancelledClasses,
      recentCourses,
      upcomingClasses,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ status: "enrolled" }),
      Enrollment.countDocuments({ status: "completed" }),
      LiveClass.countDocuments(),
      LiveClass.countDocuments({ status: "scheduled" }),
      LiveClass.countDocuments({ status: "live" }),
      LiveClass.countDocuments({ status: "completed" }),
      LiveClass.countDocuments({ status: "cancelled" }),

      Course.find()
        .select("title category instructorName level createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      LiveClass.find({
        status: "scheduled",
        scheduledAt: { $gte: new Date() },
      })
        .select("title courseTitle instructorName scheduledAt duration status")
        .sort({ scheduledAt: 1 })
        .limit(5)
        .lean(),
    ]);

    return res.json({
      message: "Admin dashboard data loaded successfully",
      statistics: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        totalLiveClasses,
        scheduledClasses,
        liveClasses,
        completedClasses,
        cancelledClasses,
      },
      recentCourses,
      upcomingClasses,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    return res.status(500).json({
      message: "Failed to load dashboard data",
    });
  }
});

// All users
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ users });
  } catch (error) {
    console.error("Admin Users Error:", error);
    return res.status(500).json({
      message: "Failed to load users",
    });
  }
});

// Block or Activate a User
router.patch(
  "/users/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["active", "blocked"].includes(status)) {
        return res.status(400).json({
          message: "Invalid user status.",
        });
      }

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      const targetUser = await User.findById(id);

      if (!targetUser) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (targetUser.role === "admin") {
        return res.status(403).json({
          message: "Admin accounts cannot be blocked.",
        });
      }

      targetUser.status = status;
      await targetUser.save();

      return res.json({
        message: `User ${status} successfully.`,
        user: {
          id: targetUser._id,
          name: targetUser.name,
          status: targetUser.status,
        },
      });
    } catch (error) {
      console.error("Update User Status Error:", error);
      return res.status(500).json({
        message: "Failed to update user status.",
      });
    }
  }
);

// All courses
router.get("/courses", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const courses = await Course.find()
      .select(
        "courseId title description category instructorName level price lessons createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ courses });
  } catch (error) {
    console.error("Admin Courses Error:", error);
    return res.status(500).json({
      message: "Failed to load courses",
    });
  }
});

router.get("/test-put", (req, res) => {
  res.json({ message: "Admin routes file is updated!" });
});

// Edit Course (Admin only)
router.put(
  "/courses/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, category, level, price } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid course ID.",
        });
      }

      const course = await Course.findById(id);

      if (!course) {
        return res.status(404).json({
          message: "Course not found.",
        });
      }

      if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) {
          return res.status(400).json({
            message: "Title cannot be empty.",
          });
        }
        course.title = title.trim();
      }

      if (description !== undefined) {
        if (typeof description !== "string" || !description.trim()) {
          return res.status(400).json({
            message: "Description cannot be empty.",
          });
        }
        course.description = description.trim();
      }

      if (category !== undefined) {
        if (typeof category !== "string" || !category.trim()) {
          return res.status(400).json({
            message: "Category cannot be empty.",
          });
        }
        course.category = category.trim();
      }

      if (level !== undefined) {
        if (!["Beginner", "Intermediate", "Advanced"].includes(level)) {
          return res.status(400).json({
            message: "Invalid course level.",
          });
        }
        course.level = level;
      }

      if (price !== undefined) {
        const numericPrice = Number(price);

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
          return res.status(400).json({
            message: "Invalid course price.",
          });
        }

        course.price = numericPrice;
      }

      await course.save();

      return res.json({
        message: "Course updated successfully.",
        course,
      });
    } catch (error) {
      console.error("Admin Update Course Error:", error);
      return res.status(500).json({
        message: "Failed to update course.",
      });
    }
  }
);

// Delete a Course (Admin only)
router.delete(
  "/courses/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid course ID.",
        });
      }

      const course = await Course.findById(id);

      if (!course) {
        return res.status(404).json({
          message: "Course not found.",
        });
      }

      const enrollmentCount = await Enrollment.countDocuments({
        courseId: course.courseId,
      });

      const liveClassCount = await LiveClass.countDocuments({
        courseId: course.courseId,
      });

      if (enrollmentCount > 0 || liveClassCount > 0) {
        return res.status(409).json({
          message:
            "This course cannot be deleted because it has enrollments or linked live classes.",
        });
      }

      await Course.findByIdAndDelete(id);

      return res.json({
        message: "Course deleted successfully.",
      });
    } catch (error) {
      console.error("Admin Delete Course Error:", error);
      return res.status(500).json({
        message: "Failed to delete course.",
      });
    }
  }
);

// All enrollments
router.get(
  "/enrollments",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const enrollments = await Enrollment.find()
        .populate("studentId", "name email")
        .sort({ enrolledAt: -1 })
        .lean();

      return res.json({ enrollments });
    } catch (error) {
      console.error("Admin Enrollments Error:", error);
      return res.status(500).json({
        message: "Failed to load enrollments",
      });
    }
  }
);

// All live classes
router.get(
  "/live-classes",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const liveClasses = await LiveClass.find()
        .select(
          "title description courseTitle instructorName scheduledAt duration status"
        )
        .sort({ scheduledAt: -1 })
        .lean();

      return res.json({ liveClasses });
    } catch (error) {
      console.error("Admin Live Classes Error:", error);
      return res.status(500).json({
        message: "Failed to load live classes",
      });
    }
  }
);

module.exports = router;
