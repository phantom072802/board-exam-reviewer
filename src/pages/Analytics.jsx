import { useEffect, useState } from "react";

import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

import api from "../services/api";

function Analytics() {
  // =========================================================
  // STATE
  // =========================================================

  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD ANALYTICS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          analyticsResponse,
          trendsResponse,
        ] = await Promise.all([
          api.get("/dashboard/analytics"),
          api.get("/dashboard/analytics/trends"),
        ]);

        if (!mounted) {
          return;
        }

        setAnalytics(
          analyticsResponse.data?.data || null
        );

        setTrends(
          trendsResponse.data?.data || null
        );
      } catch (err) {
        console.error(
          "Load analytics error:",
          err
        );

        if (mounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load analytics."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // SAFE DATA
  // =========================================================

  const overview = analytics?.overview || {};

  const subjectPerformance =
    Array.isArray(
      analytics?.subject_performance
    )
      ? analytics.subject_performance
      : [];

  const topicPerformance =
    Array.isArray(
      analytics?.topic_performance
    )
      ? analytics.topic_performance
      : [];

  const sessionPerformance =
    Array.isArray(
      analytics?.session_performance
    )
      ? analytics.session_performance
      : [];

  const strongestSubject =
    analytics?.strongest_subject || null;

  const weakestSubject =
    analytics?.weakest_subject || null;

  const trendSessions =
    Array.isArray(trends?.sessions)
      ? trends.sessions
      : [];

  // =========================================================
  // OVERVIEW VALUES
  // =========================================================

  const totalAnswered =
    Number(
      overview.total_answered
    ) || 0;

  const totalCorrect =
    Number(
      overview.total_correct
    ) || 0;

  const totalIncorrect =
    Number(
      overview.total_incorrect
    ) || 0;

  const overallAccuracy =
    Number(
      overview.overall_accuracy
    ) || 0;

  const practiceAnswers =
    Number(
      overview.practice_answers
    ) || 0;

  const practiceCorrect =
    Number(
      overview.practice_correct
    ) || 0;

  const mockAnswers =
    Number(
      overview.mock_answers
    ) || 0;

  const mockCorrect =
    Number(
      overview.mock_correct
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
  // FORMAT HELPERS
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const formatShortDate = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );
  };

  const getTypeLabel = (type) => {
    if (type === "mock") {
      return "Mock Exam";
    }

    if (type === "practice") {
      return "Practice";
    }

    return "Session";
  };

  // =========================================================
  // PERFORMANCE TREND DATA
  //
  // IMPORTANT:
  // Use `percentage`, NOT `score`.
  //
  // Backend:
  // score = number correct
  // percentage = actual percentage
  // =========================================================

  const performanceBars = trendSessions.map(
    (session, index) => {
      const percentage =
        Number(
          session.percentage
        ) || 0;

      return {
        key: `trend-${session.id ?? "session"}-${index}`,

        percentage: Math.max(
          0,
          Math.min(
            100,
            percentage
          )
        ),

        type:
          session.type || "session",

        label:
          session.completed_at
            ? formatShortDate(
                session.completed_at
              )
            : `Session ${index + 1}`,

        fullDate:
          session.completed_at
            ? formatDate(
                session.completed_at
              )
            : "Date unavailable",
      };
    }
  );

  // =========================================================
  // RECENT PERFORMANCE
  //
  // Backend returns:
  // average_score
  // correct_answers
  // total_questions
  //
  // Do NOT treat average_score as raw score.
  // It is already a percentage.
  // =========================================================

  const recentSessions =
    sessionPerformance
      .map((session, index) => {
        const averageScore =
          Number(
            session.average_score
          ) || 0;

        const correct =
          Number(
            session.correct_answers
          ) || 0;

        const questions =
          Number(
            session.total_questions
          ) || 0;

        return {
          ...session,

          key: `recent-${session.type ?? "session"}-${index}`,

          score: Math.max(
            0,
            Math.min(
              100,
              averageScore
            )
          ),

          correct,

          questions,
        };
      });

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="analytics-page">

        <div className="analytics-loading">

          <div className="analytics-loading-spinner" />

          <p>
            Loading analytics...
          </p>

        </div>

      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <main className="analytics-page">

        <div className="analytics-error">

          <div className="analytics-error-icon">
            <FiActivity />
          </div>

          <h2>
            Unable to load analytics
          </h2>

          <p>
            {error}
          </p>

        </div>

      </main>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="analytics-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="analytics-header">

        <div>

          <span className="analytics-eyebrow">
            PERFORMANCE
          </span>

          <h1>
            Analytics
          </h1>

          <p>
            Understand your performance and
            track your progress over time.
          </p>

        </div>

      </header>


      {/* =====================================================
          OVERALL PERFORMANCE
      ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <span className="analytics-eyebrow">
              OVERVIEW
            </span>

            <h2>
              Overall Performance
            </h2>

            <p>
              A summary of your answers and
              accuracy across all completed
              activities.
            </p>

          </div>

        </div>


        <div className="analytics-stat-grid">

          {/* ACCURACY */}

          <div className="analytics-stat-card">

            <div className="analytics-stat-top">

              <div className="analytics-stat-icon">
                <FiTarget />
              </div>

            </div>

            <div className="analytics-stat-content">

              <span>
                Accuracy
              </span>

              <strong>
                {overallAccuracy.toFixed(1)}%
              </strong>

              <small>
                Overall accuracy
              </small>

            </div>

          </div>


          {/* QUESTIONS */}

          <div className="analytics-stat-card">

            <div className="analytics-stat-top">

              <div className="analytics-stat-icon">
                <FiBookOpen />
              </div>

            </div>

            <div className="analytics-stat-content">

              <span>
                Questions Answered
              </span>

              <strong>
                {totalAnswered}
              </strong>

              <small>
                Total questions answered
              </small>

            </div>

          </div>


          {/* CORRECT */}

          <div className="analytics-stat-card">

            <div className="analytics-stat-top">

              <div className="analytics-stat-icon">
                <FiCheckCircle />
              </div>

            </div>

            <div className="analytics-stat-content">

              <span>
                Correct Answers
              </span>

              <strong>
                {totalCorrect}
              </strong>

              <small>
                Correct responses
              </small>

            </div>

          </div>


          {/* INCORRECT */}

          <div className="analytics-stat-card">

            <div className="analytics-stat-top">

              <div className="analytics-stat-icon">
                <FiBarChart2 />
              </div>

            </div>

            <div className="analytics-stat-content">

              <span>
                Incorrect Answers
              </span>

              <strong>
                {totalIncorrect}
              </strong>

              <small>
                Incorrect responses
              </small>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PRACTICE VS MOCK
      ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <span className="analytics-eyebrow">
              COMPARISON
            </span>

            <h2>
              Practice vs Mock Exam
            </h2>

            <p>
              Compare your accuracy between
              practice sessions and mock exams.
            </p>

          </div>

        </div>


        <div className="analytics-comparison-grid">

          {/* PRACTICE */}

          <div className="analytics-comparison-card">

            <div className="analytics-comparison-header">

              <div className="analytics-comparison-icon">
                <FiActivity />
              </div>

              <div>

                <h3>
                  Practice
                </h3>

                <span>
                  Practice questions
                </span>

              </div>

            </div>


            <div className="analytics-comparison-score">

              <span>
                Accuracy
              </span>

              <strong>
                {practiceAccuracy.toFixed(1)}%
              </strong>

            </div>


            <div className="analytics-comparison-details">

              <div>

                <span>
                  Answered
                </span>

                <strong>
                  {practiceAnswers}
                </strong>

              </div>

              <div>

                <span>
                  Correct
                </span>

                <strong>
                  {practiceCorrect}
                </strong>

              </div>

            </div>

          </div>


          {/* MOCK EXAM */}

          <div className="analytics-comparison-card">

            <div className="analytics-comparison-header">

              <div className="analytics-comparison-icon">
                <FiAward />
              </div>

              <div>

                <h3>
                  Mock Exam
                </h3>

                <span>
                  Completed mock exams
                </span>

              </div>

            </div>


            <div className="analytics-comparison-score">

              <span>
                Accuracy
              </span>

              <strong>
                {mockAccuracy.toFixed(1)}%
              </strong>

            </div>


            <div className="analytics-comparison-details">

              <div>

                <span>
                  Answered
                </span>

                <strong>
                  {mockAnswers}
                </strong>

              </div>

              <div>

                <span>
                  Correct
                </span>

                <strong>
                  {mockCorrect}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PERFORMANCE OVER TIME
      ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <span className="analytics-eyebrow">
              TREND
            </span>

            <h2>
              Performance Over Time
            </h2>

            <p>
              Your actual percentage score for
              each completed session.
            </p>

          </div>

        </div>


        <div className="analytics-chart-card">

          {performanceBars.length === 0 ? (

            <div className="analytics-empty">

              <div className="analytics-empty-icon">
                <FiBarChart2 />
              </div>

              <h3>
                No completed sessions yet
              </h3>

              <p>
                Complete practice sessions or
                mock exams to see your
                performance trend.
              </p>

            </div>

          ) : (

            <>

              <div className="analytics-chart-summary">

                <div>
                  <span>
                    Sessions
                  </span>

                  <strong>
                    {performanceBars.length}
                  </strong>
                </div>

                <div>
                  <span>
                    Best
                  </span>

                  <strong>
                    {Math.max(
                      ...performanceBars.map(
                        (item) =>
                          item.percentage
                      )
                    ).toFixed(1)}
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Latest
                  </span>

                  <strong>
                    {
                      performanceBars[
                        performanceBars.length - 1
                      ].percentage.toFixed(1)
                    }
                    %
                  </strong>
                </div>

              </div>


              <div className="analytics-chart">

                <div className="analytics-chart-y-axis">

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


                <div className="analytics-chart-area">

                  <div className="analytics-chart-grid">

                    <span />
                    <span />
                    <span />
                    <span />
                    <span />

                  </div>


                  <div className="analytics-bars">

                    {performanceBars.map(
                      (item) => (

                        <div
                          className="analytics-bar-column"
                          key={item.key}
                          title={`${getTypeLabel(
                            item.type
                          )} — ${item.percentage.toFixed(
                            1
                          )}% — ${item.fullDate}`}
                        >

                          <div className="analytics-bar-value">
                            {item.percentage.toFixed(0)}%
                          </div>

                          <div className="analytics-bar-wrapper">

                            <div
                              className="analytics-bar"
                              style={{
                                height: `${Math.max(
                                  item.percentage,
                                  3
                                )}%`,
                              }}
                            />

                          </div>

                          <span className="analytics-bar-label">
                            {item.label}
                          </span>

                          <small className="analytics-bar-type">
                            {getTypeLabel(
                              item.type
                            )}
                          </small>

                        </div>

                      )
                    )}

                  </div>

                </div>

              </div>

            </>

          )}

        </div>

      </section>


      {/* =====================================================
          INSIGHTS
      ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <span className="analytics-eyebrow">
              INSIGHTS
            </span>

            <h2>
              Performance Insights
            </h2>

            <p>
              Your strongest and weakest subject
              based on answered questions.
            </p>

          </div>

        </div>


        <div className="analytics-insight-grid">

          {/* STRONGEST */}

          <div className="analytics-insight-card">

            <div className="analytics-insight-icon">
              <FiTrendingUp />
            </div>

            <div className="analytics-insight-content">

              <span>
                Strongest Subject
              </span>

              <h3>
                {strongestSubject?.subject_name ||
                  strongestSubject?.name ||
                  "No data"}
              </h3>

              <strong>
                {Number(
                  strongestSubject?.accuracy || 0
                ).toFixed(1)}
                %
              </strong>

              {strongestSubject && (
                <small>
                  {Number(
                    strongestSubject
                      ?.answered_questions
                  ) || 0}{" "}
                  questions answered
                </small>
              )}

            </div>

          </div>


          {/* WEAKEST */}

          <div className="analytics-insight-card">

            <div className="analytics-insight-icon">
              <FiTrendingDown />
            </div>

            <div className="analytics-insight-content">

              <span>
                Needs Improvement
              </span>

              <h3>
                {weakestSubject?.subject_name ||
                  weakestSubject?.name ||
                  "No data"}
              </h3>

              <strong>
                {Number(
                  weakestSubject?.accuracy || 0
                ).toFixed(1)}
                %
              </strong>

              {weakestSubject && (
                <small>
                  {Number(
                    weakestSubject
                      ?.answered_questions
                  ) || 0}{" "}
                  questions answered
                </small>
              )}

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SUBJECT PERFORMANCE
      ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <span className="analytics-eyebrow">
              SUBJECTS
            </span>

            <h2>
              Subject Performance
            </h2>

            <p>
              Accuracy and answer volume for
              every subject.
            </p>

          </div>

        </div>


        <div className="analytics-table-card">

          {subjectPerformance.length === 0 ? (

            <div className="analytics-empty">

              <div className="analytics-empty-icon">
                <FiBookOpen />
              </div>

              <h3>
                No subject data yet
              </h3>

              <p>
                Answer questions to start
                building your subject analytics.
              </p>

            </div>

          ) : (

            <div className="analytics-table-wrapper">

              <table className="analytics-table">

                <thead>

                  <tr>

                    <th>
                      Subject
                    </th>

                    <th>
                      Questions
                    </th>

                    <th>
                      Correct
                    </th>

                    <th>
                      Incorrect
                    </th>

                    <th>
                      Accuracy
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {subjectPerformance.map(
                    (subject, index) => {

                      /*
                       * IMPORTANT:
                       * Backend returns answered_questions
                       */

                      const answered =
                        Number(
                          subject.answered_questions ??
                            subject.questions_answered ??
                            subject.total_answered ??
                            0
                        ) || 0;

                      const correct =
                        Number(
                          subject.correct_answers ??
                            subject.correct ??
                            0
                        ) || 0;

                      const incorrect =
                        Number(
                          subject.incorrect_answers ??
                            Math.max(
                              answered -
                                correct,
                              0
                            )
                        ) || 0;

                      const accuracy =
                        Number(
                          subject.accuracy ??
                            (
                              answered > 0
                                ? (
                                    correct /
                                    answered
                                  ) * 100
                                : 0
                            )
                        ) || 0;

                      const safeAccuracy =
                        Math.max(
                          0,
                          Math.min(
                            100,
                            accuracy
                          )
                        );

                      return (
                        <tr
                          key={`subject-${subject.subject_id ?? subject.id ?? "unknown"}-${index}`}
                        >

                          <td>

                            <div className="analytics-subject-name">

                              <span>
                                {subject.subject_name ||
                                  subject.name ||
                                  "Unknown Subject"}
                              </span>

                            </div>

                          </td>

                          <td>
                            {answered}
                          </td>

                          <td>
                            {correct}
                          </td>

                          <td>
                            {incorrect}
                          </td>

                          <td>

                            <div className="analytics-table-accuracy">

                              <strong>
                                {safeAccuracy.toFixed(
                                  1
                                )}
                                %
                              </strong>

                              <div className="analytics-mini-progress">

                                <div
                                  style={{
                                    width: `${safeAccuracy}%`,
                                  }}
                                />

                              </div>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          TOPIC PERFORMANCE
      ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <span className="analytics-eyebrow">
              TOPICS
            </span>

            <h2>
              Topic Performance
            </h2>

            <p>
              Identify which topics need more
              attention.
            </p>

          </div>

        </div>


        <div className="analytics-topic-grid">

          {topicPerformance.length === 0 ? (

            <div className="analytics-empty">

              <div className="analytics-empty-icon">
                <FiActivity />
              </div>

              <h3>
                No topic data yet
              </h3>

              <p>
                Answer questions to see topic
                performance.
              </p>

            </div>

          ) : (

            topicPerformance.map(
              (topic, index) => {

                /*
                 * IMPORTANT:
                 * Backend returns answered_questions
                 */

                const answered =
                  Number(
                    topic.answered_questions ??
                      topic.questions_answered ??
                      topic.total_answered ??
                      0
                  ) || 0;

                const correct =
                  Number(
                    topic.correct_answers ??
                      topic.correct ??
                      0
                  ) || 0;

                const incorrect =
                  Number(
                    topic.incorrect_answers ??
                      Math.max(
                        answered -
                          correct,
                        0
                      )
                  ) || 0;

                const accuracy =
                  Number(
                    topic.accuracy ??
                      (
                        answered > 0
                          ? (
                              correct /
                              answered
                            ) * 100
                          : 0
                      )
                  ) || 0;

                const safeAccuracy =
                  Math.max(
                    0,
                    Math.min(
                      100,
                      accuracy
                    )
                  );

                return (
                  <div
                    className="analytics-topic-card"
                    key={`topic-${topic.topic_id ?? topic.id ?? "unknown"}-${index}`}
                  >

                    <div className="analytics-topic-header">

                      <div>

                        <span className="analytics-topic-subject">
                          {topic.subject_name ||
                            "Subject"}
                        </span>

                        <h3>
                          {topic.topic_name ||
                            topic.name ||
                            "Unknown Topic"}
                        </h3>

                      </div>

                      <strong>
                        {safeAccuracy.toFixed(1)}%
                      </strong>

                    </div>


                    <div className="analytics-progress">

                      <div
                        className="analytics-progress-bar"
                        style={{
                          width: `${safeAccuracy}%`,
                        }}
                      />

                    </div>


                    <div className="analytics-topic-footer">

                      <span>
                        {answered} questions
                      </span>

                      <span>
                        {correct} correct
                      </span>

                      <span>
                        {incorrect} incorrect
                      </span>

                    </div>

                  </div>
                );
              }
            )

          )}

        </div>

      </section>


      {/* =====================================================
          RECENT PERFORMANCE
      ===================================================== */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <span className="analytics-eyebrow">
              RECENT
            </span>

            <h2>
              Recent Performance
            </h2>

            <p>
              Average results by completed
              activity type.
            </p>

          </div>

        </div>


        <div className="analytics-table-card">

          {recentSessions.length === 0 ? (

            <div className="analytics-empty">

              <div className="analytics-empty-icon">
                <FiActivity />
              </div>

              <h3>
                No recent performance
              </h3>

              <p>
                Complete a practice session or
                mock exam to see results here.
              </p>

            </div>

          ) : (

            <div className="analytics-table-wrapper">

              <table className="analytics-table">

                <thead>

                  <tr>

                    <th>
                      Type
                    </th>

                    <th>
                      Average Score
                    </th>

                    <th>
                      Correct
                    </th>

                    <th>
                      Questions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {recentSessions.map(
                    (session) => (

                      <tr
                        key={session.key}
                      >

                        <td>

                          <span
                            className={`analytics-type-badge analytics-type-${session.type}`}
                          >
                            {getTypeLabel(
                              session.type
                            )}
                          </span>

                        </td>

                        <td>

                          <strong>
                            {session.score.toFixed(
                              1
                            )}
                            %
                          </strong>

                        </td>

                        <td>
                          {session.correct}
                        </td>

                        <td>
                          {session.questions}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>

    </main>
  );
}

export default Analytics;