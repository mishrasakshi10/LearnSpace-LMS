
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const app = express();

// Import routes
const authRoutes = require("./routes/authRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const progressRoutes = require("./routes/progressRoutes");
const courseRoutes = require("./routes/courseRoutes");
const quizRoutes = require("./routes/quizRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const liveClassRoutes = require("./routes/liveClassRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Course enrollment routes
app.use("/api/enrollments", enrollmentRoutes);

// Course progress routes
app.use("/api/progress", progressRoutes);

// Instructor Course routes
app.use("/api/courses", courseRoutes);

// Quiz routes
app.use("/api/quizzes", quizRoutes);

// Certificate routes
app.use("/api/certificates", certificateRoutes);

// Live Class routes
app.use("/api/live-classes", liveClassRoutes);

// admin routes
app.use("/api/admin", adminRoutes);

console.log("Admin routes loaded:", typeof adminRoutes);

app.get("/api/admin/test", (req, res) => {
  res.json({ message: "Admin route is working!" });
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "LMS backend is running!" });
});

// Server port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start the server
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Atlas connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
