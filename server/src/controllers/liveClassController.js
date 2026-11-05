
const {
  AccessToken,
  RoomServiceClient,
} = require("livekit-server-sdk");

const LiveClass = require("../models/LiveClass");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// Schedule a live class
exports.createLiveClass = async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      scheduledAt,
      duration,
    } = req.body;

    if (!title || !courseId || !scheduledAt) {
      return res.status(400).json({
        message: "Title, course and scheduled date are required.",
      });
    }

    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      return res.status(400).json({
        message: "Please select a valid future date and time.",
      });
    }

    const course = await Course.findOne({
      courseId,
      instructorId: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found or you are not its instructor.",
      });
    }

    const liveClass = await LiveClass.create({
      title,
      description: description || "",
      courseId: course.courseId,
      courseTitle: course.title,
      instructorId: req.user.userId,
      instructorName: course.instructorName,
      scheduledAt: date,
      duration: Number(duration) || 60,
      roomName: `learnspace-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    });

    return res.status(201).json({
      message: "Live class scheduled successfully.",
      liveClass,
    });
  } catch (error) {
    console.error("Create live class error:", error);

    return res.status(500).json({
      message: "Failed to schedule live class.",
    });
  }
};

// Get instructor's live classes
exports.getMyLiveClasses = async (req, res) => {
  try {
    const liveClasses = await LiveClass.find({
      instructorId: req.user.userId,
    }).sort({ scheduledAt: 1 });

    return res.status(200).json({ liveClasses });
  } catch (error) {
    console.error("Get instructor live classes error:", error);

    return res.status(500).json({
      message: "Failed to fetch live classes.",
    });
  }
};

// Get classes for enrolled students
exports.getStudentLiveClasses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.user.userId,
    }).select("courseId");

    const courseIds = enrollments.map((item) => item.courseId);

    const liveClasses = await LiveClass.find({
      courseId: { $in: courseIds },
      status: { $in: ["scheduled", "live"] },
    }).sort({ scheduledAt: 1 });

    return res.status(200).json({ liveClasses });
  } catch (error) {
    console.error("Get student live classes error:", error);

    return res.status(500).json({
      message: "Failed to fetch live classes.",
    });
  }
};

// Update class status and close room when instructor ends class
exports.updateLiveClassStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["live", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid live class status.",
      });
    }

    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      instructorId: req.user.userId,
    });

    if (!liveClass) {
      return res.status(404).json({
        message: "Live class not found.",
      });
    }

    if (liveClass.status === "completed" ||
        liveClass.status === "cancelled") {
      return res.status(400).json({
        message: "This class has already ended.",
      });
    }

    // Save completed status first
    liveClass.status = status;
    await liveClass.save();

    // Close the LiveKit room when instructor ends the class
    if (status === "completed" || status === "cancelled") {
      const {
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        LIVEKIT_URL,
      } = process.env;

      if (LIVEKIT_API_KEY && LIVEKIT_API_SECRET && LIVEKIT_URL) {
        try {
         const roomService = new RoomServiceClient(
  LIVEKIT_URL.replace(/^wss:/, "https:").replace(/^ws:/, "http:"),
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

          await roomService.deleteRoom(liveClass.roomName);

          console.log(
            "LiveKit room closed:",
            liveClass.roomName
          );
        } catch (roomError) {
          console.error(
            "LiveKit room closing error:",
            roomError
          );
        }
      }
    }

    return res.status(200).json({
      message: "Live class ended successfully.",
      liveClass,
    });
  } catch (error) {
    console.error("Update live class status error:", error);

    return res.status(500).json({
      message: "Failed to update live class status.",
    });
  }
};

// Generate LiveKit access token
exports.joinLiveClass = async (req, res) => {
  try {
    const classId = req.params.id;

    console.log("Joining live class:", classId);

    if (!classId || !/^[0-9a-fA-F]{24}$/.test(classId)) {
      return res.status(400).json({
        message: "Invalid or missing live class ID.",
      });
    }

    const {
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      LIVEKIT_URL,
    } = process.env;

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      return res.status(500).json({
        message: "Live video service is not configured.",
      });
    }

    if (!req.user || !req.user.userId || !req.user.role) {
      return res.status(401).json({
        message: "Please log in to join this live class.",
      });
    }

    const liveClass = await LiveClass.findById(classId);

    if (!liveClass) {
      return res.status(404).json({
        message: "Live class not found.",
      });
    }

    if (
      liveClass.status === "completed" ||
      liveClass.status === "cancelled"
    ) {
      return res.status(400).json({
        message: "This live class is no longer available.",
      });
    }

    const userId = String(req.user.userId);
    const userRole = req.user.role;

    const isInstructor =
      userRole === "instructor" &&
      String(liveClass.instructorId) === userId;

    const isStudent =
      userRole === "student" &&
      Boolean(
        await Enrollment.findOne({
          studentId: userId,
          courseId: liveClass.courseId,
        })
      );

    if (!isInstructor && !isStudent) {
      return res.status(403).json({
        message: "You are not authorized to join this live class.",
      });
    }

    if (isStudent && liveClass.status !== "live") {
      return res.status(403).json({
        message: "The instructor has not started this class yet.",
      });
    }

    if (!liveClass.roomName) {
      return res.status(500).json({
        message: "Live class room is not configured.",
      });
    }

    const accessToken = new AccessToken(
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      {
        identity: userId,
        name: `${userRole}-${userId}`,
        ttl: "2h",
      }
    );

    accessToken.addGrant({
      roomJoin: true,
      room: liveClass.roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await accessToken.toJwt();

    console.log("LiveKit token generated successfully.");

    return res.status(200).json({
      message: "Live class access granted.",
      token,
      serverUrl: LIVEKIT_URL,
      roomName: liveClass.roomName,
      userRole,
      liveClass: {
        id: liveClass._id,
        title: liveClass.title,
        courseTitle: liveClass.courseTitle,
        instructorName: liveClass.instructorName,
      },
    });
  } catch (error) {
    console.error("LiveKit token generation error:", error);

    return res.status(500).json({
      message: "Failed to generate live class access.",
      error: error.message,
    });
  }
};
