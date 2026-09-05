import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiBookmark,
  FiCheckCircle,
  FiClock,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

import api from "../services/api";


function Dashboard() {

  // =========================================================
  // STATE
  // =========================================================

  const [dashboard, setDashboard] =
    useState(null);

  const [analytics, setAnalytics] =
    useState(null);

  const [trends, setTrends] =
    useState(null);

  const [streaks, setStreaks] =
    useState(null);

  const [notificationData, setNotificationData] =
    useState(null);

  const [bookmarkCount, setBookmarkCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {

    let mounted = true;

    const loadDashboard =
      async () => {

        try {

          setLoading(true);
          setError("");

          const [
            dashboardResponse,
            bookmarksResponse,
            analyticsResponse,
            trendsResponse,
            streakResponse,
            notificationsResponse,
          ] = await Promise.all([

            api.get(
              "/dashboard/overview"
            ),

            api.get(
              "/bookmarks"
            ),

            api.get(
              "/dashboard/analytics"
            ),

            api.get(
              "/dashboard/analytics/trends"
            ),

            api.get(
              "/streaks"
            ),

            api.get(
              "/notifications"
            ),

          ]);


          if (!mounted) {
            return;
          }


          setDashboard(
            dashboardResponse.data?.data ||
              null
          );


          setBookmarkCount(
            (
              bookmarksResponse.data?.data ||
              []
            ).length
          );


          setAnalytics(
            analyticsResponse.data?.data ||
              null
          );


          setTrends(
            trendsResponse.data?.data ||
              null
          );


          setStreaks(
            streakResponse.data?.data ||
              null
          );


          setNotificationData(
            notificationsResponse.data?.data ||
              null
          );

        } catch (err) {

          console.error(
            "Dashboard loading error:",
            err
          );

          if (mounted) {

            setError(
              err.response?.data?.message ||
                "Failed to load dashboard."
            );

          }

        } finally {

          if (mounted) {
            setLoading(false);
          }

        }

      };


    loadDashboard();


    return () => {
      mounted = false;
    };

  }, []);


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <div className="dashboard-page">

        <div className="dashboard-loading">

          <div className="dashboard-loading-icon">
            <FiBarChart2 />
          </div>

          <p>
            Loading your dashboard...
          </p>

        </div>

      </div>
    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (
      <div className="dashboard-page">

        <div className="dashboard-error-card">

          <div className="dashboard-error-icon">
            <FiBarChart2 />
          </div>

          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="dashboard-primary-button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>

      </div>
    );

  }


  // =========================================================
  // DATA
  // =========================================================

  const stats =
    dashboard?.stats || {};

  const subjectProgress =
    Array.isArray(
      dashboard?.subject_progress
    )
      ? dashboard.subject_progress
      : [];

  const continueStudying =
    dashboard?.continue_studying ||
    null;

  const recentResult =
    dashboard?.recent_result ||
    null;


  // =========================================================
  // ANALYTICS
  // =========================================================

  const analyticsOverview =
    analytics?.overview || {};

  const subjectAnalytics =
    Array.isArray(
      analytics?.subject_performance
    )
      ? analytics.subject_performance
      : [];

  const strongestAnalyticsSubject =
    analytics?.strongest_subject ||
    null;

  const weakestAnalyticsSubject =
    analytics?.weakest_subject ||
    null;


  // =========================================================
  // TREND
  // =========================================================

  const trendSessions =
    Array.isArray(
      trends?.sessions
    )
      ? trends.sessions
      : [];

  const trendSummary =
    trends?.summary || {};

  const recentTrendSessions =
    trendSessions.slice(-8);


  // =========================================================
  // STREAK
  // =========================================================

  const currentStreak =
    Number(
      streaks?.current_streak
    ) || 0;

  const longestStreak =
    Number(
      streaks?.longest_streak
    ) || 0;

  const studyDays =
    Number(
      streaks?.study_days
    ) || 0;

  const questionsToday =
    Number(
      streaks?.questions_today
    ) || 0;


  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const unreadNotifications =
    Number(
      notificationData?.unread_count
    ) || 0;


  // =========================================================
  // STATISTICS
  // =========================================================

  const averageScore =
    Number(
      stats.average_score
    ) || 0;

  const questionsAnswered =
    Number(
      stats.questions_answered
    ) || 0;

  const completedExams =
    Number(
      stats.completed_exams
    ) || 0;

  const correctAnswers =
    Number(
      stats.correct_answers
    ) || 0;


  const accuracy =
    questionsAnswered > 0
      ? (
          correctAnswers /
          questionsAnswered
        ) * 100
      : 0;


  // =========================================================
  // ANALYTICS VALUES
  // =========================================================

  const totalAnswered =
    Number(
      analyticsOverview.total_answered
    ) || 0;

  const totalCorrect =
    Number(
      analyticsOverview.total_correct
    ) || 0;

  const totalIncorrect =
    Number(
      analyticsOverview.total_incorrect
    ) || 0;

  const overallAccuracy =
    Number(
      analyticsOverview.overall_accuracy
    ) || 0;

  const practiceAnswers =
    Number(
      analyticsOverview.practice_answers
    ) || 0;

  const practiceCorrect =
    Number(
      analyticsOverview.practice_correct
    ) || 0;

  const mockAnswers =
    Number(
      analyticsOverview.mock_answers
    ) || 0;

  const mockCorrect =
    Number(
      analyticsOverview.mock_correct
    ) || 0;


  const practiceAccuracy =
    practiceAnswers > 0
      ? (
          practiceCorrect /
          practiceAnswers
        ) * 100
      : 0;

  const mockAccuracy =
    mockAnswers > 0
      ? (
          mockCorrect /
          mockAnswers
        ) * 100
      : 0;


  // =========================================================
  // SUBJECT PROGRESS
  // =========================================================

  const normalizedSubjects =
    subjectProgress.map(
      (subject) => ({

        ...subject,

        progress:
          Number(
            subject.progress
          ) || 0,

        total:
          Number(
            subject.total_questions
          ) || 0,

        answered:
          Number(
            subject.answered_questions
          ) || 0,

      })
    );


  const totalSubjectQuestions =
    normalizedSubjects.reduce(
      (sum, subject) =>
        sum + subject.total,
      0
    );


  const answeredSubjectQuestions =
    normalizedSubjects.reduce(
      (sum, subject) =>
        sum + subject.answered,
      0
    );


  const overallProgress =
    totalSubjectQuestions > 0
      ? (
          answeredSubjectQuestions /
          totalSubjectQuestions
        ) * 100
      : 0;


  // =========================================================
  // STRONGEST / WEAKEST
  // =========================================================

  const strongestSubject =
    strongestAnalyticsSubject ||
    (
      normalizedSubjects.length > 0
        ? [...normalizedSubjects]
            .sort(
              (a, b) =>
                b.progress -
                a.progress
            )[0]
        : null
    );


  const weakestSubject =
    weakestAnalyticsSubject ||
    (
      normalizedSubjects.length > 0
        ? [...normalizedSubjects]
            .sort(
              (a, b) =>
                a.progress -
                b.progress
            )[0]
        : null
    );


  // =========================================================
  // RESULT HELPERS
  // =========================================================

  const getResultType =
    (result) => {

      if (!result) {
        return "";
      }

      if (
        result.type === "mock"
      ) {
        return "Mock Examination";
      }

      if (
        result.type === "practice"
      ) {
        return "Practice Session";
      }

      return (
        result.type_label ||
        "Exam"
      );

    };


  const getResultPercentage =
    (result) => {

      if (!result) {
        return 0;
      }

      if (
        result.percentage !==
        undefined
      ) {

        return Number(
          result.percentage
        ) || 0;

      }


      const total =
        Number(
          result.total_questions
        ) || 0;

      const score =
        Number(
          result.score
        ) || 0;


      if (total <= 0) {
        return 0;
      }


      return (
        score /
        total
      ) * 100;

    };


  const recentPercentage =
    getResultPercentage(
      recentResult
    );


  const recentResultUrl =
    recentResult
      ? `/results?type=${
          recentResult.type
        }&id=${
          recentResult.id
        }`
      : "/history";


  // =========================================================
  // TREND
  // =========================================================

  const latestTrendScore =
    Number(
      trendSummary.latest_score
    ) || 0;

  const bestTrendScore =
    Number(
      trendSummary.best_score
    ) || 0;

  const trendChange =
    Number(
      trendSummary.change
    ) || 0;

  const trendDirection =
    trendSummary.trend ||
    "stable";


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="dashboard-hero">

        <div className="dashboard-hero-content">

          <p className="dashboard-eyebrow">
            YOUR PROGRESS
          </p>

          <h1>
            Welcome back!
          </h1>

          <p>
            Keep building your knowledge
            and prepare for your board exam.
          </p>

        </div>


        <div className="dashboard-hero-actions">

          <Link
            to="/practice"
            className="dashboard-primary-button"
          >

            <FiBookOpen />

            Practice Questions

            <FiArrowRight />

          </Link>


          <Link
            to="/mock-exam"
            className="dashboard-secondary-button"
          >

            <FiTarget />

            Mock Exam

          </Link>

        </div>

      </section>


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="dashboard-stats">

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-top">

            <span>
              Average Score
            </span>

            <div className="dashboard-stat-icon">
              <FiTrendingUp />
            </div>

          </div>

          <strong>
            {averageScore.toFixed(1)}%
          </strong>

          <p>
            Across completed exams
          </p>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-top">

            <span>
              Questions Answered
            </span>

            <div className="dashboard-stat-icon">
              <FiBookOpen />
            </div>

          </div>

          <strong>
            {questionsAnswered}
          </strong>

          <p>
            Questions practiced
          </p>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-top">

            <span>
              Completed Exams
            </span>

            <div className="dashboard-stat-icon">
              <FiCheckCircle />
            </div>

          </div>

          <strong>
            {completedExams}
          </strong>

          <p>
            Practice and mock exams
          </p>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-top">

            <span>
              Accuracy
            </span>

            <div className="dashboard-stat-icon">
              <FiTarget />
            </div>

          </div>

          <strong>
            {accuracy.toFixed(1)}%
          </strong>

          <p>
            Correct answers
          </p>

        </div>

      </section>


      {/* =====================================================
          STUDY STREAK
      ===================================================== */}

      <section className="dashboard-card dashboard-streak-card">

        <div className="dashboard-card-header">

          <div>

            <p className="dashboard-section-label">
              STUDY HABIT
            </p>

            <h2>
              Study Streak
            </h2>

            <p className="dashboard-card-description">
              Stay consistent to build a stronger
              study habit.
            </p>

          </div>

          <div className="dashboard-streak-icon">
            🔥
          </div>

        </div>


        <div className="dashboard-streak-main">

          <div className="dashboard-streak-current">

            <span>
              Current Streak
            </span>

            <strong>
              {currentStreak}
            </strong>

            <small>
              {currentStreak === 1
                ? "day"
                : "days"}
            </small>

          </div>


          <div className="dashboard-streak-stats">

            <div>

              <span>
                Longest Streak
              </span>

              <strong>
                {longestStreak} days
              </strong>

            </div>


            <div>

              <span>
                Study Days
              </span>

              <strong>
                {studyDays}
              </strong>

            </div>


            <div>

              <span>
                Questions Today
              </span>

              <strong>
                {questionsToday}
              </strong>

            </div>

          </div>

        </div>


        <div className="dashboard-streak-action">

          {questionsToday > 0 ? (

            <span className="dashboard-streak-message">
              <FiCheckCircle />
              You've studied today. Keep going!
            </span>

          ) : (

            <Link
              to="/practice"
              className="dashboard-text-link"
            >
              Study today
              <FiArrowRight />
            </Link>

          )}

        </div>

      </section>


      {/* =====================================================
          CONTINUE + RECENT RESULT
      ===================================================== */}

      <section className="dashboard-main-grid">

        {/* CONTINUE */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>

              <p className="dashboard-section-label">
                RECOMMENDED
              </p>

              <h2>
                Continue Studying
              </h2>

            </div>

            <FiBookOpen />

          </div>


          {continueStudying ? (

            <div className="continue-content">

              <div className="continue-icon">
                <FiBookOpen />
              </div>


              <div className="continue-details">

                <span>
                  {continueStudying.subject_name}
                </span>

                <h3>
                  {continueStudying.topic_name}
                </h3>

                <p>
                  {
                    Number(
                      continueStudying.answered_questions
                    ) || 0
                  }{" "}
                  of{" "}
                  {
                    Number(
                      continueStudying.total_questions
                    ) || 0
                  }{" "}
                  questions answered
                </p>


                <div className="progress-track">

                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        continueStudying.total_questions >
                        0
                          ? Math.min(
                              (
                                Number(
                                  continueStudying
                                    .answered_questions
                                ) /
                                Number(
                                  continueStudying
                                    .total_questions
                                )
                              ) * 100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  />

                </div>

              </div>


              <Link
                to={`/practice?subject=${continueStudying.subject_id}&topic=${continueStudying.topic_id}`}
                className="continue-button"
              >
                Study
                <FiArrowRight />
              </Link>

            </div>

          ) : (

            <div className="dashboard-empty-inline">

              <FiBookOpen />

              <p>
                Start practicing to get a
                personalized recommendation.
              </p>

              <Link
                to="/practice"
                className="dashboard-text-link"
              >
                Start Practice
                <FiArrowRight />
              </Link>

            </div>

          )}

        </div>


        {/* RECENT RESULT */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>

              <p className="dashboard-section-label">
                LATEST
              </p>

              <h2>
                Recent Result
              </h2>

            </div>

            <FiBarChart2 />

          </div>


          {recentResult ? (

            <div className="recent-result">

              <div className="recent-result-score">

                <strong>
                  {recentPercentage.toFixed(1)}%
                </strong>

                <span>
                  {recentResult.score} /{" "}
                  {recentResult.total_questions}
                </span>

              </div>


              <div className="recent-result-details">

                <span>
                  {getResultType(
                    recentResult
                  )}
                </span>

                <h3>
                  {recentResult.subject_name ||
                    "All Subjects"}
                </h3>

                <p>
                  {recentResult.completed_at
                    ? new Date(
                        recentResult.completed_at
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : "Recently completed"}
                </p>

              </div>


              <Link
                to={recentResultUrl}
                className="recent-result-link"
              >
                Review
                <FiArrowRight />
              </Link>

            </div>

          ) : (

            <div className="dashboard-empty-inline">

              <FiBarChart2 />

              <p>
                Complete an exam to see your
                latest result.
              </p>

              <Link
                to="/mock-exam"
                className="dashboard-text-link"
              >
                Take Mock Exam
                <FiArrowRight />
              </Link>

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          PERFORMANCE OVERVIEW
      ===================================================== */}

      <section className="dashboard-card">

        <div className="dashboard-card-header">

          <div>

            <p className="dashboard-section-label">
              ANALYTICS
            </p>

            <h2>
              Performance Overview
            </h2>

            <p className="dashboard-card-description">
              A quick look at your overall accuracy
              and answer performance.
            </p>

          </div>

          <Link
            to="/analytics"
            className="dashboard-header-link"
          >
            View Analytics
            <FiArrowRight />
          </Link>

        </div>


        <div className="dashboard-analytics-grid">

          {/* OVERALL */}

          <div className="dashboard-analytics-card">

            <div className="dashboard-analytics-card-top">

              <div>

                <span>
                  Overall Accuracy
                </span>

                <strong>
                  {overallAccuracy.toFixed(1)}%
                </strong>

              </div>

              <div className="dashboard-analytics-icon">
                <FiTarget />
              </div>

            </div>


            <div className="dashboard-analytics-progress">

              <div
                style={{
                  width: `${Math.min(
                    overallAccuracy,
                    100
                  )}%`,
                }}
              />

            </div>


            <p>
              {totalCorrect} correct out of{" "}
              {totalAnswered} answered
            </p>

          </div>


          {/* PRACTICE */}

          <div className="dashboard-analytics-card">

            <div className="dashboard-analytics-card-top">

              <div>

                <span>
                  Practice Accuracy
                </span>

                <strong>
                  {practiceAccuracy.toFixed(1)}%
                </strong>

              </div>

              <div className="dashboard-analytics-icon">
                <FiBookOpen />
              </div>

            </div>


            <div className="dashboard-analytics-progress">

              <div
                style={{
                  width: `${Math.min(
                    practiceAccuracy,
                    100
                  )}%`,
                }}
              />

            </div>


            <p>
              {practiceCorrect} correct out of{" "}
              {practiceAnswers} answered
            </p>

          </div>


          {/* MOCK */}

          <div className="dashboard-analytics-card">

            <div className="dashboard-analytics-card-top">

              <div>

                <span>
                  Mock Exam Accuracy
                </span>

                <strong>
                  {mockAccuracy.toFixed(1)}%
                </strong>

              </div>

              <div className="dashboard-analytics-icon">
                <FiClock />
              </div>

            </div>


            <div className="dashboard-analytics-progress">

              <div
                style={{
                  width: `${Math.min(
                    mockAccuracy,
                    100
                  )}%`,
                }}
              />

            </div>


            <p>
              {mockCorrect} correct out of{" "}
              {mockAnswers} answered
            </p>

          </div>


          {/* INCORRECT */}

          <div className="dashboard-analytics-card">

            <div className="dashboard-analytics-card-top">

              <div>

                <span>
                  Incorrect Answers
                </span>

                <strong>
                  {totalIncorrect}
                </strong>

              </div>

              <div className="dashboard-analytics-icon">
                <FiTrendingDown />
              </div>

            </div>


            <p className="dashboard-analytics-simple-text">
              Questions that need more review.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          PERFORMANCE TREND
      ===================================================== */}

      <section className="dashboard-card dashboard-trend-card">

        <div className="dashboard-card-header">

          <div>

            <p className="dashboard-section-label">
              TREND
            </p>

            <h2>
              Performance Trend
            </h2>

            <p className="dashboard-card-description">
              Your recent scores across completed
              practice sessions and mock exams.
            </p>

          </div>

          <Link
            to="/analytics"
            className="dashboard-header-link"
          >
            Full Analytics
            <FiArrowRight />
          </Link>

        </div>


        {recentTrendSessions.length > 0 ? (

          <>

            <div className="dashboard-trend-summary">

              <div>

                <span>
                  Latest
                </span>

                <strong>
                  {latestTrendScore.toFixed(1)}%
                </strong>

              </div>


              <div>

                <span>
                  Best
                </span>

                <strong>
                  {bestTrendScore.toFixed(1)}%
                </strong>

              </div>


              <div>

                <span>
                  Change
                </span>

                <strong
                  className={
                    trendDirection === "up"
                      ? "trend-positive"
                      : trendDirection === "down"
                      ? "trend-negative"
                      : "trend-neutral"
                  }
                >
                  {trendChange > 0
                    ? "+"
                    : ""}
                  {trendChange.toFixed(1)}%
                </strong>

              </div>

            </div>


            <div className="dashboard-trend-chart">

              <div className="dashboard-trend-y-axis">

                <span>
                  100%
                </span>

                <span>
                  75%
                </span>

                <span>
                  50%
                </span>

                <span>
                  25%
                </span>

                <span>
                  0%
                </span>

              </div>


              <div className="dashboard-trend-chart-area">

                <div className="dashboard-trend-grid">

                  <span />
                  <span />
                  <span />
                  <span />
                  <span />

                </div>


                <div className="dashboard-trend-bars">

                  {recentTrendSessions.map(
                    (session, index) => {

                      const percentage =
                        Number(
                          session.percentage
                        ) || 0;


                      return (
                        <div
                          key={`trend-${session.type || "session"}-${session.id || index}-${index}`}
                          className="dashboard-trend-point"
                        >

                          <div
                            className={
                              session.type === "mock"
                                ? "dashboard-trend-bar mock"
                                : "dashboard-trend-bar"
                            }
                            style={{
                              height: `${Math.max(
                                Math.min(
                                  percentage,
                                  100
                                ),
                                3
                              )}%`,
                            }}
                            title={`${session.type === "mock" ? "Mock Exam" : "Practice"} — ${percentage.toFixed(1)}%`}
                          />

                          <span className="dashboard-trend-label">

                            {session.completed_at
                              ? new Date(
                                  session.completed_at
                                ).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : `#${index + 1}`}

                          </span>

                        </div>
                      );

                    }
                  )}

                </div>

              </div>

            </div>


            <div className="dashboard-trend-legend">

              <span>
                <i className="trend-legend-practice" />
                Practice
              </span>

              <span>
                <i className="trend-legend-mock" />
                Mock Exam
              </span>

            </div>

          </>

        ) : (

          <div className="dashboard-empty-inline">

            <FiTrendingUp />

            <p>
              Complete a practice session or mock
              exam to see your performance trend.
            </p>

            <Link
              to="/practice"
              className="dashboard-text-link"
            >
              Start Practice
              <FiArrowRight />
            </Link>

          </div>

        )}

      </section>


      {/* =====================================================
          STUDY PROGRESS
      ===================================================== */}

      <section className="dashboard-card">

        <div className="dashboard-card-header">

          <div>

            <p className="dashboard-section-label">
              PROGRESS
            </p>

            <h2>
              Study Progress
            </h2>

            <p className="dashboard-card-description">
              Track how much of the question bank
              you have practiced.
            </p>

          </div>


          <div className="overall-progress">

            <strong>
              {overallProgress.toFixed(0)}%
            </strong>

            <span>
              Overall
            </span>

          </div>

        </div>


        <div className="overall-progress-bar">

          <div
            style={{
              width: `${Math.min(
                overallProgress,
                100
              )}%`,
            }}
          />

        </div>


        <div className="dashboard-progress-summary">

          <span>
            {answeredSubjectQuestions} questions practiced
          </span>

          <span>
            {totalSubjectQuestions} total questions
          </span>

        </div>

      </section>


      {/* =====================================================
          SUBJECT PERFORMANCE
      ===================================================== */}

      <section className="dashboard-card">

        <div className="dashboard-card-header">

          <div>

            <p className="dashboard-section-label">
              SUBJECTS
            </p>

            <h2>
              Subject Performance
            </h2>

            <p className="dashboard-card-description">
              Your accuracy across each board exam
              subject.
            </p>

          </div>


          <Link
            to="/analytics"
            className="dashboard-header-link"
          >
            View Details
            <FiArrowRight />
          </Link>

        </div>


        {subjectAnalytics.length > 0 ? (

          <div className="dashboard-subject-analytics-list">

            {subjectAnalytics
              .slice(0, 5)
              .map(
                (subject, index) => {

                  const subjectAccuracy =
                    Number(
                      subject.accuracy
                    ) || 0;

                  const answered =
                    Number(
                      subject.answered_questions
                    ) || 0;

                  const correct =
                    Number(
                      subject.correct_answers
                    ) || 0;


                  return (
                    <div
                      className="dashboard-subject-analytics-item"
                      key={`subject-${subject.subject_id || index}-${index}`}
                    >

                      <div className="dashboard-subject-analytics-info">

                        <div>

                          <strong>
                            {subject.subject_name}
                          </strong>

                          <span>
                            {correct} correct out of{" "}
                            {answered} answered
                          </span>

                        </div>


                        <strong>
                          {subjectAccuracy.toFixed(1)}%
                        </strong>

                      </div>


                      <div className="dashboard-analytics-progress">

                        <div
                          style={{
                            width: `${Math.min(
                              Math.max(
                                subjectAccuracy,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>
                  );

                }
              )}

          </div>

        ) : (

          <div className="dashboard-empty-inline">

            <FiBarChart2 />

            <p>
              Answer questions from different
              subjects to see your performance.
            </p>

          </div>

        )}

      </section>


      {/* =====================================================
          INSIGHTS
      ===================================================== */}

      <section className="dashboard-insights">

        {/* WEAKEST */}

        <div className="dashboard-insight-card">

          <div className="dashboard-insight-icon">
            <FiTrendingDown />
          </div>

          <div>

            <p>
              FOCUS AREA
            </p>

            <h3>
              {weakestSubject?.subject_name ||
                weakestSubject?.name ||
                "Start practicing"}
            </h3>

            <span>
              {weakestSubject?.accuracy !==
              undefined
                ? `${Number(
                    weakestSubject.accuracy
                  ).toFixed(1)}% accuracy`
                : weakestSubject
                ? `${Number(
                    weakestSubject.progress
                  ).toFixed(0)}% completed`
                : "Answer questions to identify your weakest subject."}
            </span>

          </div>

        </div>


        {/* STRONGEST */}

        <div className="dashboard-insight-card">

          <div className="dashboard-insight-icon">
            <FiTrendingUp />
          </div>

          <div>

            <p>
              STRONGEST SUBJECT
            </p>

            <h3>
              {strongestSubject?.subject_name ||
                strongestSubject?.name ||
                "Not enough data"}
            </h3>

            <span>
              {strongestSubject?.accuracy !==
              undefined
                ? `${Number(
                    strongestSubject.accuracy
                  ).toFixed(1)}% accuracy`
                : strongestSubject
                ? `${Number(
                    strongestSubject.progress
                  ).toFixed(0)}% completed`
                : "Keep practicing to build your progress."}
            </span>

          </div>

        </div>


        {/* BOOKMARKS */}

        <div className="dashboard-insight-card">

          <div className="dashboard-insight-icon">
            <FiBookmark />
          </div>

          <div>

            <p>
              SAVED QUESTIONS
            </p>

            <h3>
              {bookmarkCount}{" "}
              {bookmarkCount === 1
                ? "Question"
                : "Questions"}
            </h3>

            <span>
              Questions saved for later review.
            </span>

          </div>

          <Link
            to="/bookmarks"
            className="dashboard-insight-link"
          >
            View
            <FiArrowRight />
          </Link>

        </div>


        {/* NOTIFICATIONS */}

        <div className="dashboard-insight-card">

          <div className="dashboard-insight-icon">
            <FiBell />
          </div>

          <div>

            <p>
              NOTIFICATIONS
            </p>

            <h3>
              {unreadNotifications}{" "}
              {unreadNotifications === 1
                ? "Unread"
                : "Unread"}
            </h3>

            <span>
              Study reminders and progress updates.
            </span>

          </div>

          <Link
            to="/notifications"
            className="dashboard-insight-link"
          >
            View
            <FiArrowRight />
          </Link>

        </div>

      </section>


      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="dashboard-bottom-actions">

        <Link
          to="/subjects"
          className="dashboard-action-card"
        >

          <div className="dashboard-action-icon">
            <FiBookOpen />
          </div>

          <div>

            <h3>
              Explore Subjects
            </h3>

            <p>
              Browse topics and questions by subject.
            </p>

          </div>

          <FiArrowRight />

        </Link>


        <Link
          to="/questions"
          className="dashboard-action-card"
        >

          <div className="dashboard-action-icon">
            <FiActivity />
          </div>

          <div>

            <h3>
              Question Bank
            </h3>

            <p>
              Find questions and practice specific
              topics.
            </p>

          </div>

          <FiArrowRight />

        </Link>


        <Link
          to="/history"
          className="dashboard-action-card"
        >

          <div className="dashboard-action-icon">
            <FiClock />
          </div>

          <div>

            <h3>
              View History
            </h3>

            <p>
              Review your previous practice and
              mock exams.
            </p>

          </div>

          <FiArrowRight />

        </Link>


        <Link
          to="/analytics"
          className="dashboard-action-card"
        >

          <div className="dashboard-action-icon">
            <FiBarChart2 />
          </div>

          <div>

            <h3>
              View Analytics
            </h3>

            <p>
              Understand your performance in detail.
            </p>

          </div>

          <FiArrowRight />

        </Link>

      </section>

    </div>
  );
}


export default Dashboard;