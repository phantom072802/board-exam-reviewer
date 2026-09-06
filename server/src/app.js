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

// ============================
// CORS
// ============================

const allowedOrigins = [
  "http://localhost:5173",
  "https://board-exam-reviewer.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

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
  })
);

// ============================
// MIDDLEWARE
// ============================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ============================
// ROOT
// ============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BoardPrep API is running",
  });
});

// ============================
// HEALTH
// ============================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API and server are working",
  });
});

// ============================
// API ROUTES
// ============================

app.use("/api/auth", authRoutes);

app.use("/api/subjects", subjectRoutes);

app.use("/api/questions", questionRoutes);

app.use("/api/practice", practiceRoutes);

app.use("/api/mock-exams", mockExamRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/bookmarks", bookmarkRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/goals", goalRoutes);

app.use("/api/streaks", streakRoutes);

app.use("/api/study-activity", studyActivityRoutes);

app.use("/api/notifications", notificationRoutes);

module.exports = app;