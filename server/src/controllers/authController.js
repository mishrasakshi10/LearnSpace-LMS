
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Roles allowed during public registration.
// Admin accounts must be created separately.
const ALLOWED_REGISTRATION_ROLES = ["student", "instructor"];

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Please enter a valid name.",
      });
    }

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    // Determine the selected role
    const selectedRole = role || "student";

    console.log("Role received from frontend:", role);
    console.log("Selected role to save:", selectedRole);

    // Prevent public admin registration
    if (!ALLOWED_REGISTRATION_ROLES.includes(selectedRole)) {
      return res.status(400).json({
        message: "Please select either Student or Instructor.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for an existing account
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user with the selected role
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: selectedRole,
    });

    // Debug: verify the role saved by Mongoose
    console.log("Role saved in MongoDB:", user.role);

    return res.status(201).json({
      message: "Registration successful! You can now sign in.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
};

// Log in an existing user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Prevent blocked users from logging in
if (user.status === "blocked") {
  return res.status(403).json({
    message: "Your account has been blocked. Please contact the administrator.",
  });
}

    // Verify the password
    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from .env");
    }

    // Generate a token using the role stored in MongoDB
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
};
