
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Require a Bearer token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please sign in.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        message: "Server authentication is not configured.",
      });
    }

    // Verify the token using the same secret as authController.js
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Your login token contains userId and role
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    // Make the verified identity available to protected routes
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Your session is invalid or expired. Please sign in again.",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Authentication failed.",
    });
  }
};

module.exports = authMiddleware;
