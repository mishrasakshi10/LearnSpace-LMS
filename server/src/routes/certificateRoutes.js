
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  generateCertificate,
} = require("../controllers/certificateController");

// GET /api/certificates/:courseId
router.get("/:courseId", authMiddleware, generateCertificate);

module.exports = router;
