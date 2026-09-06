const express = require("express");
const cors = require("cors");

const subjectRoutes = require("./routes/subjectRoutes");
const authRoutes = require("./routes/authRoutes");
const questionRoutes = require("./routes/questionRoutes");
const practiceRoutes = require("./routes/practiceRoutes");
const mockExamRoutes = require("./routes/mockExamRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const profileRoutes = require("./routes/profileRoutes");
const goalRoutes = require("./routes/goalRoutes");
const streakRoutes = require("./routes/streakRoutes");
const studyActivityRoutes = require("./routes/studyActivityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// ==================================================
// CORS CONFIGURATION
// ==================================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://board-exam-reviewer.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      // Useful for server-to-server requests and health checks.
      if (!origin) {
        return callback(null, true);
      }

      // Allow local development.
      if (origin === "http://localhost:5173") {
        return callback(null, true);
      }

      // Allow the main Vercel production domain.
      if (
        origin ===
        "https://board-exam-reviewer.vercel.app"
      ) {
        return callback(null, true);
      }

      // Allow Vercel deployment/preview URLs.
      if (
        /^https:\/\/board-exam-reviewer-[a-z0-9-]+-phantom072802s-projects\.vercel\.app$/i.test(
          origin
        )
      ) {
        return callback(null, true);
      }

      // Reject unknown origins.
      return callback(
        new Error("Not allowed by CORS")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: false,

    optionsSuccessStatus: 204,
  })
);

// ==================================================
// BODY PARSING
// ==================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==================================================
// ROOT ROUTE
// ==================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BoardPrep API is running",
  });
});

// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API and server are working",
  });
});

// ==================================================
// API ROUTES
// ==================================================

// Authentication
app.use("/api/auth", authRoutes);

// Subjects
app.use("/api/subjects", subjectRoutes);

// Questions
app.use("/api/questions", questionRoutes);

// Practice
app.use("/api/practice", practiceRoutes);

// Mock Exams
app.use("/api/mock-exams", mockExamRoutes);

// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// Bookmarks
app.use("/api/bookmarks", bookmarkRoutes);

// Profile
app.use("/api/profile", profileRoutes);

// Study Goals
app.use("/api/goals", goalRoutes);

// Study Streaks
app.use("/api/streaks", streakRoutes);

// Study Activity
app.use(
  "/api/study-activity",
  studyActivityRoutes
);

// Notifications
app.use(
  "/api/notifications",
  notificationRoutes
);

// ==================================================
// 404 HANDLER
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ==================================================
// ERROR HANDLER
// ==================================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // Handle CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked this request.",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// ==================================================
// EXPORT APP
// ==================================================

module.exports = app;