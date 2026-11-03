
const PDFDocument = require("pdfkit");

const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const LessonProgress = require("../models/LessonProgress");
const User = require("../models/User");

const generateCertificate = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can generate certificates.",
      });
    }

    const courseId = String(req.params.courseId || "").trim();

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required.",
      });
    }

    // Verify student enrollment.
    const enrollment = await Enrollment.findOne({
      studentId: req.user.userId,
      courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        message: "You are not enrolled in this course.",
      });
    }

    // Fetch the actual course and its lessons.
    const course = await Course.findOne({ courseId });

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const totalLessons = course.lessons.length;

    if (totalLessons === 0) {
      return res.status(400).json({
        message: "This course does not have any lessons.",
      });
    }

    // Verify saved progress from the database.
    const progress = await LessonProgress.findOne({
      studentId: req.user.userId,
      courseId,
    });

    const completedLessons = progress?.completedLessons || [];

    const allLessonsCompleted =
      progress &&
      progress.totalLessons === totalLessons &&
      completedLessons.length === totalLessons &&
      new Set(completedLessons).size === totalLessons &&
      completedLessons.every(
        (index) =>
          Number.isInteger(index) &&
          index >= 0 &&
          index < totalLessons
      );

    if (!allLessonsCompleted) {
      return res.status(403).json({
        message: "Complete all course lessons before generating your certificate.",
        completedLessons: completedLessons.length,
        totalLessons,
      });
    }

    // Get student details.
    const student = await User.findById(req.user.userId);

    if (!student) {
      return res.status(404).json({
        message: "Student account not found.",
      });
    }

    // Mark enrollment as completed.
    await Enrollment.updateOne(
      { _id: enrollment._id },
      { $set: { status: "completed" } }
    );

    const certificateId = `LS-${Date.now()}`;
    const completionDate = new Date().toLocaleDateString("en-IN");

    // Generate PDF.
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 50,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="LearnSpace-Certificate-${courseId}.pdf"`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
      .lineWidth(3)
      .stroke("#4f46e5");

    doc.fontSize(34)
      .fillColor("#4f46e5")
      .text("LearnSpace", 0, 75, { align: "center" });

    doc.fontSize(17)
      .fillColor("#64748b")
      .text("CERTIFICATE OF COMPLETION", 0, 140, {
        align: "center",
        characterSpacing: 2,
      });

    doc.fontSize(15)
      .fillColor("#334155")
      .text("This certificate is proudly presented to", 0, 205, {
        align: "center",
      });

    doc.fontSize(32)
      .fillColor("#111827")
      .text(student.name || "Student", 70, 245, {
        align: "center",
        width: pageWidth - 140,
      });

    doc.moveTo(180, 295)
      .lineTo(pageWidth - 180, 295)
      .lineWidth(1)
      .stroke("#cbd5e1");

    doc.fontSize(15)
      .fillColor("#334155")
      .text("For successfully completing the course", 0, 325, {
        align: "center",
      });

    doc.fontSize(23)
      .fillColor("#4f46e5")
      .text(course.title, 70, 360, {
        align: "center",
        width: pageWidth - 140,
      });

    doc.fontSize(12)
      .fillColor("#64748b")
      .text(`Completion Date: ${completionDate}`, 0, 420, {
        align: "center",
      });

    doc.fontSize(10)
      .text(`Certificate ID: ${certificateId}`, 0, pageHeight - 75, {
        align: "center",
      });

    doc.end();
  } catch (error) {
    console.error("Certificate generation error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Unable to generate certificate.",
      });
    }

    res.end();
  }
};

module.exports = { generateCertificate };
