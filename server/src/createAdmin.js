
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dns = require("dns");

require("dotenv").config();

// DNS configuration
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// User model
const User = require("./models/User");

async function createAdmin() {
  try {
    const {
      MONGODB_URI,
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    // Validate environment variables
    if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Required environment variables are missing.");
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Admin password must be at least 8 characters.");
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connected successfully!");

    const email = ADMIN_EMAIL.trim().toLowerCase();

    // Check existing account
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === "admin") {
        console.log("Admin account already exists.");
      } else {
        console.log(
          "This email is already registered with another role."
        );
        console.log("Please use a different admin email.");
      }

      return;
    }

    // Hash admin password
    const hashedPassword = await bcrypt.hash(
      ADMIN_PASSWORD,
      12
    );

    // Create admin account
    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("================================");
    console.log("Admin account created successfully!");
    console.log("Admin Name:", admin.name);
    console.log("Admin Email:", admin.email);
    console.log("Admin Role:", admin.role);
    console.log("================================");

  } catch (error) {
    console.error("Admin creation failed:", error.message);

  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

createAdmin();
