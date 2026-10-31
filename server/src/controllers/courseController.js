
const Course = require("../models/Course");
const User = require("../models/User");

// Create a course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, level, price, image } = req.body;

    if (
      typeof title !== "string" || !title.trim() ||
      typeof description !== "string" || !description.trim() ||
      typeof category !== "string" || !category.trim()
    ) {
      return res.status(400).json({
        message: "Title, description, and category are required.",
      });
    }

    const numericPrice = price === undefined ? 0 : Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number.",
      });
    }

    const instructor = await User.findById(req.user.userId).select("name role");

    if (!instructor || instructor.role !== "instructor") {
      return res.status(403).json({
        message: "Only instructors can create courses.",
      });
    }

    const courseId = `course-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const course = await Course.create({
      courseId,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      level: level || "Beginner",
      price: numericPrice,
      image: typeof image === "string" ? image.trim() : "",
      instructorId: instructor._id,
      instructorName: instructor.name,
    });

    return res.status(201).json({
      message: "Course created successfully.",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    return res.status(500).json({
      message: "Unable to create course.",
    });
  }
};

// Get all courses belonging to the logged-in instructor
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      instructorId: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ courses });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    return res.status(500).json({
      message: "Unable to load your courses.",
    });
  }
};

// Update one of the logged-in instructor's courses
exports.updateCourse = async (req, res) => {
  try {
    const { title, description, category, level, price, image } = req.body;

    const course = await Course.findOne({
      courseId: req.params.courseId,
      instructorId: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found or you do not have permission to edit it.",
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "Title cannot be empty." });
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
        return res.status(400).json({ message: "Invalid course level." });
      }
      course.level = level;
    }

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
          message: "Price must be a valid non-negative number.",
        });
      }
      course.price = numericPrice;
    }

    if (image !== undefined) {
      if (typeof image !== "string") {
        return res.status(400).json({ message: "Invalid image value." });
      }
      course.image = image.trim();
    }

    await course.save();

    return res.status(200).json({
      message: "Course updated successfully.",
      course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    return res.status(500).json({
      message: "Unable to update course.",
    });
  }
};

// Delete one of the logged-in instructor's courses
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      courseId: req.params.courseId,
      instructorId: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found or you do not have permission to delete it.",
      });
    }

    return res.status(200).json({
      message: "Course deleted successfully.",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    return res.status(500).json({
      message: "Unable to delete course.",
    });
  }
};
