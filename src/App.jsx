import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// =========================================================
// PUBLIC PAGES
// =========================================================

import Login from "./pages/Login";
import Register from "./pages/Register";

// =========================================================
// PROTECTED PAGES
// =========================================================

import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Subjects from "./pages/Subjects";
import SubjectDetails from "./pages/SubjectDetails";
import Practice from "./pages/Practice";
import MockExam from "./pages/MockExam";
import Results from "./pages/Results";
import History from "./pages/History";
import QuestionBank from "./pages/QuestionBank";
import Bookmarks from "./pages/Bookmarks";
import StudyGoals from "./pages/StudyGoals";
import StudyActivity from "./pages/StudyActivity";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function App() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* =====================================================
          PROTECTED ROUTES
      ===================================================== */}

      <Route element={<ProtectedRoute />}>

        <Route element={<DashboardLayout />}>

          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* =================================================
              ANALYTICS
          ================================================= */}

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}
          
          <Route
            path="/notifications"
            element={<Notifications />}
          />

          {/* =================================================
              SUBJECTS
          ================================================= */}

          <Route
            path="/subjects"
            element={<Subjects />}
          />


          {/* =================================================
              SUBJECT DETAILS
          ================================================= */}

          <Route
            path="/subjects/:id"
            element={<SubjectDetails />}
          />


          {/* =================================================
              PRACTICE
          ================================================= */}

          <Route
            path="/practice"
            element={<Practice />}
          />


          {/* =================================================
              MOCK EXAM
          ================================================= */}

          <Route
            path="/mock-exam"
            element={<MockExam />}
          />


          {/* =================================================
              RESULTS
          ================================================= */}

          <Route
            path="/results"
            element={<Results />}
          />


          {/* =================================================
              HISTORY
          ================================================= */}

          <Route
            path="/history"
            element={<History />}
          />


          {/* =================================================
              QUESTION BANK
          ================================================= */}

          <Route
            path="/questions"
            element={<QuestionBank />}
          />


          {/* =================================================
              BOOKMARKS
          ================================================= */}

          <Route
            path="/bookmarks"
            element={<Bookmarks />}
          />


          {/* =================================================
              STUDY GOALS
          ================================================= */}

          <Route
            path="/goals"
            element={<StudyGoals />}
          />


          {/* =================================================
              STUDY ACTIVITY
          ================================================= */}

          <Route
            path="/study-activity"
            element={<StudyActivity />}
          />


          {/* =================================================
              PROFILE
          ================================================= */}

          <Route
            path="/profile"
            element={<Profile />}
          />


          {/* =================================================
              SETTINGS
          ================================================= */}

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>

      </Route>


      {/* =====================================================
          DEFAULT ROUTE
      ===================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />


      {/* =====================================================
          404 / UNKNOWN ROUTES
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;