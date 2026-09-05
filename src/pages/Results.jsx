import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaChartLine,
  FaCheck,
  FaClock,
  FaTimes,
  FaMinus,
  FaRedo,
  FaFilter,
} from "react-icons/fa";

import api from "../services/api";

function Results() {
  // ========================================
  // URL PARAMETERS
  // ========================================

  const [searchParams] = useSearchParams();

  const resultType =
    searchParams.get("type") || "practice";

  const resultId =
    searchParams.get("id") ||
    searchParams.get("session");

  const isMockExam =
    resultType === "mock";

  // ========================================
  // STATE
  // ========================================

  const [result, setResult] =
    useState(null);

  const [answers, setAnswers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [reviewFilter, setReviewFilter] =
    useState("all");

  // ========================================
  // LOAD RESULTS
  // ========================================

  useEffect(() => {
    let mounted = true;

    const loadResults = async () => {
      try {
        setLoading(true);
        setError("");

        // ====================================
        // MOCK EXAM
        // ====================================

        if (isMockExam) {
          let savedResult = null;

          const storedResult =
            sessionStorage.getItem(
              "mockExamResult"
            );

          if (storedResult) {
            try {
              savedResult =
                JSON.parse(storedResult);
            } catch (parseError) {
              console.error(
                "Failed to parse saved mock result:",
                parseError
              );
            }
          }

          // ==================================
          // USE SAVED SUBMISSION
          // ==================================

          if (
            savedResult &&
            mounted
          ) {
            const savedSession =
              savedResult.session || {};

            const totalQuestions =
              Number(
                savedResult.total_questions ??
                  savedSession.total_questions ??
                  0
              );

            const score =
              Number(
                savedResult.score ??
                  savedSession.score ??
                  0
              );

            const correctAnswers =
              Number(
                savedResult.correct_answers ??
                  score
              );

            const incorrectAnswers =
              Number(
                savedResult.incorrect_answers ??
                  0
              );

            const answeredQuestions =
              Number(
                savedResult.answered_questions ??
                  correctAnswers +
                    incorrectAnswers
              );

            const unansweredQuestions =
              Number(
                savedResult.unanswered_questions ??
                  Math.max(
                    totalQuestions -
                      answeredQuestions,
                    0
                  )
              );

            setResult({
              ...savedSession,

              id:
                savedSession.id ??
                resultId,

              score,

              total_questions:
                totalQuestions,

              correct_answers:
                correctAnswers,

              incorrect_answers:
                incorrectAnswers,

              answered_questions:
                answeredQuestions,

              unanswered_questions:
                unansweredQuestions,

              percentage:
                totalQuestions > 0
                  ? (
                      (score /
                        totalQuestions) *
                      100
                    ).toFixed(2)
                  : "0.00",

              completed_at:
                savedSession.completed_at ??
                new Date().toISOString(),
            });

            setAnswers(
              Array.isArray(
                savedResult.answers
              )
                ? savedResult.answers
                : []
            );

            // ==================================
            // LOAD DETAILED ANSWERS
            // ==================================

            if (resultId) {
              try {
                const response =
                  await api.get(
                    `/dashboard/history/mock/${resultId}`
                  );

                const data =
                  response.data?.data;

                if (
                  data &&
                  mounted
                ) {
                  const backendSession =
                    data.session ||
                    data;

                  const backendAnswers =
                    Array.isArray(
                      data.answers
                    )
                      ? data.answers
                      : [];

                  setResult(
                    (previous) => ({
                      ...previous,

                      ...backendSession,

                      id:
                        backendSession.id ??
                        previous?.id ??
                        resultId,

                      total_questions:
                        Number(
                          backendSession.total_questions ??
                            previous?.total_questions ??
                            0
                        ),

                      score:
                        Number(
                          backendSession.score ??
                            previous?.score ??
                            0
                        ),

                      correct_answers:
                        Number(
                          backendSession.correct_answers ??
                            previous?.correct_answers ??
                            0
                        ),

                      incorrect_answers:
                        Number(
                          backendSession.incorrect_answers ??
                            previous?.incorrect_answers ??
                            0
                        ),
                    })
                  );

                  if (
                    backendAnswers.length > 0
                  ) {
                    setAnswers(
                      backendAnswers
                    );
                  }
                }
              } catch (detailError) {
                console.warn(
                  "Detailed mock results unavailable.",
                  detailError
                );
              }
            }

            return;
          }

          // ==================================
          // LOAD MOCK FROM BACKEND
          // ==================================

          if (resultId) {
            try {
              const response =
                await api.get(
                  `/dashboard/history/mock/${resultId}`
                );

              const data =
                response.data?.data;

              if (
                data &&
                mounted
              ) {
                const session =
                  data.session ||
                  data;

                const backendAnswers =
                  Array.isArray(
                    data.answers
                  )
                    ? data.answers
                    : [];

                const totalQuestions =
                  Number(
                    session.total_questions
                  ) || 0;

                const score =
                  Number(
                    session.score
                  ) || 0;

                const correctAnswers =
                  backendAnswers.filter(
                    (answer) =>
                      Boolean(
                        answer.is_correct
                      )
                  ).length;

                const incorrectAnswers =
                  backendAnswers.filter(
                    (answer) =>
                      !Boolean(
                        answer.is_correct
                      )
                  ).length;

                const answeredQuestions =
                  backendAnswers.length;

                const unansweredQuestions =
                  Math.max(
                    totalQuestions -
                      answeredQuestions,
                    0
                  );

                setResult({
                  ...session,

                  total_questions:
                    totalQuestions,

                  score,

                  correct_answers:
                    correctAnswers,

                  incorrect_answers:
                    incorrectAnswers,

                  answered_questions:
                    answeredQuestions,

                  unanswered_questions:
                    unansweredQuestions,
                });

                setAnswers(
                  backendAnswers
                );

                return;
              }
            } catch (backendError) {
              console.error(
                "Failed to load mock exam:",
                backendError
              );
            }
          }

          if (mounted) {
            setError(
              "Mock exam result could not be found."
            );
          }

          return;
        }

        // ====================================
        // PRACTICE RESULTS
        // ====================================

        const sessionsResponse =
          await api.get(
            "/practice/sessions"
          );

        const sessions =
          sessionsResponse.data?.data ||
          [];

        if (
          !Array.isArray(sessions) ||
          sessions.length === 0
        ) {
          if (mounted) {
            setResult(null);
            setAnswers([]);
          }

          return;
        }

        const latestSession =
          sessions[0];

        const sessionResponse =
          await api.get(
            `/practice/sessions/${latestSession.id}`
          );

        const sessionData =
          sessionResponse.data?.data;

        if (mounted) {
          setResult(
            sessionData?.session ||
              latestSession
          );

          setAnswers(
            sessionData?.answers || []
          );
        }
      } catch (err) {
        console.error(
          "Load results error:",
          err
        );

        if (mounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load results."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      mounted = false;
    };
  }, [
    isMockExam,
    resultId,
  ]);

  // ========================================
  // BASIC VALUES
  // ========================================

  const totalQuestions =
    Number(
      result?.total_questions
    ) || 0;

  const score =
    Number(
      result?.score
    ) || 0;

  // ========================================
  // COUNTS
  // ========================================

  const correctCount = isMockExam
    ? Number(
        result?.correct_answers
      ) || score
    : answers.filter(
        (answer) =>
          Boolean(
            answer.is_correct
          )
      ).length;

  const incorrectCount = isMockExam
    ? Number(
        result?.incorrect_answers
      ) || 0
    : answers.filter(
        (answer) =>
          !Boolean(
            answer.is_correct
          )
      ).length;

  const answeredCount = isMockExam
    ? Number(
        result?.answered_questions
      ) ||
      correctCount +
        incorrectCount
    : answers.length;

  const unansweredCount =
    Math.max(
      totalQuestions -
        answeredCount,
      0
    );

  // ========================================
  // PERCENTAGE
  // ========================================

  const percentage =
    totalQuestions > 0
      ? (
          (score /
            totalQuestions) *
          100
        ).toFixed(2)
      : "0.00";

  const percentageNumber =
    Number(percentage);

  const roundedPercentage =
    Math.round(
      percentageNumber
    );

  // ========================================
  // ANALYTICS
  // ========================================

  const accuracy =
    answeredCount > 0
      ? (
          (correctCount /
            answeredCount) *
          100
        ).toFixed(1)
      : "0.0";

  const completionRate =
    totalQuestions > 0
      ? (
          (answeredCount /
            totalQuestions) *
          100
        ).toFixed(1)
      : "0.0";

  // ========================================
  // PERFORMANCE
  // ========================================

  let performance = {
    title:
      "Needs More Practice",

    description:
      "Review the missed questions and practice the related topics.",

    className:
      "performance-needs-work",
  };

  if (
    percentageNumber >= 90
  ) {
    performance = {
      title:
        "Outstanding Performance",

      description:
        "Excellent work. You demonstrated strong mastery of the material.",

      className:
        "performance-excellent",
    };
  } else if (
    percentageNumber >= 75
  ) {
    performance = {
      title:
        "Good Performance",

      description:
        "You are on the right track. Continue reviewing the areas you missed.",

      className:
        "performance-good",
    };
  } else if (
    percentageNumber >= 60
  ) {
    performance = {
      title:
        "Keep Improving",

      description:
        "You have a good foundation. More practice can help improve your score.",

      className:
        "performance-average",
    };
  }

  // ========================================
  // FILTER ANSWERS
  // ========================================

  const filteredAnswers =
    useMemo(() => {
      if (
        reviewFilter === "correct"
      ) {
        return answers.filter(
          (answer) =>
            Boolean(
              answer.is_correct
            )
        );
      }

      if (
        reviewFilter === "incorrect"
      ) {
        return answers.filter(
          (answer) =>
            !Boolean(
              answer.is_correct
            )
        );
      }

      if (
        reviewFilter === "unanswered"
      ) {
        return answers.filter(
          (answer) =>
            !answer.selected_choice_text &&
            !answer.choice_text
        );
      }

      return answers;
    }, [
      answers,
      reviewFilter,
    ]);

  // ========================================
  // DATE FORMAT
  // ========================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Not available";
    }

    return parsedDate.toLocaleString(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // ========================================
  // ANSWER TEXT
  // ========================================

  const getSelectedAnswer =
    (answer) => {
      if (
        answer.selected_choice_text
      ) {
        return answer.selected_choice_text;
      }

      if (
        answer.choice_text
      ) {
        return answer.choice_text;
      }

      if (
        answer.selected_answer
      ) {
        return answer.selected_answer;
      }

      return "No answer";
    };

  const getCorrectAnswer =
    (answer) => {
      if (
        answer.correct_choice_text
      ) {
        return answer.correct_choice_text;
      }

      if (
        answer.correct_answer
      ) {
        return answer.correct_answer;
      }

      return "Not available";
    };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="results-page">
        <div className="results-loading">
          <div className="results-loading-spinner" />

          <p>
            Loading your results...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div className="results-page">
        <div className="results-empty">

          <FaChartLine className="results-empty-icon" />

          <h2>
            Unable to load results
          </h2>

          <p>
            {error}
          </p>

          <Link
            to={
              isMockExam
                ? "/mock-exam"
                : "/practice"
            }
            className="results-primary-button"
          >
            {isMockExam
              ? "Back to Mock Exam"
              : "Back to Practice"}
          </Link>

        </div>
      </div>
    );
  }

  // ========================================
  // NO RESULT
  // ========================================

  if (!result) {
    return (
      <div className="results-page">
        <div className="results-empty">

          <FaChartLine className="results-empty-icon" />

          <h2>
            No results yet
          </h2>

          <p>
            {isMockExam
              ? "Complete a mock examination to see your results here."
              : "Complete a practice session to see your results here."}
          </p>

          <Link
            to={
              isMockExam
                ? "/mock-exam"
                : "/practice"
            }
            className="results-primary-button"
          >
            {isMockExam
              ? "Start Mock Exam"
              : "Start Practice"}
          </Link>

        </div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="results-page">

      {/* ==================================
          HEADER
          ================================== */}

      <div className="results-header">

        <div>
          <p className="results-label">
            RESULTS
          </p>

          <h1>
            {isMockExam
              ? "Mock Exam Results"
              : "Practice Results"}
          </h1>

          <p className="results-subtitle">
            Review your performance
            and identify areas for
            improvement.
          </p>
        </div>

        <Link
          to={
            isMockExam
              ? "/mock-exam"
              : "/practice"
          }
          className="results-back-button"
        >
          <FaArrowLeft />

          {isMockExam
            ? "Back to Mock Exam"
            : "Back to Practice"}
        </Link>

      </div>

      {/* ==================================
          MAIN SCORE
          ================================== */}

      <div
        className={`results-main-card ${performance.className}`}
      >

        <div className="results-main-content">

          <p className="results-complete-label">
            {isMockExam
              ? "MOCK EXAMINATION COMPLETE"
              : "PRACTICE SESSION COMPLETE"}
          </p>

          <h2>
            {performance.title}
          </h2>

          <p className="results-date">
            Completed{" "}
            {formatDate(
              result.completed_at ||
                result.updated_at ||
                result.created_at
            )}
          </p>

        </div>

        <div className="results-score-display">

          <div className="results-score-circle">
            <strong>
              {roundedPercentage}
              <span>%</span>
            </strong>
          </div>

          <p>
            {score} /{" "}
            {totalQuestions}
          </p>

        </div>

      </div>

      {/* ==================================
          PERFORMANCE
          ================================== */}

      <div
        className={`results-performance ${performance.className}`}
      >

        <div className="results-performance-icon">
          <FaChartLine />
        </div>

        <div>
          <strong>
            {performance.title}
          </strong>

          <p>
            {performance.description}
          </p>
        </div>

      </div>

      {/* ==================================
          ANALYTICS
          ================================== */}

      <section className="results-section">

        <div className="results-section-header">
          <div>
            <h2>
              Performance Overview
            </h2>

            <p>
              Key metrics from this
              session.
            </p>
          </div>
        </div>

        <div className="results-stats">

          {/* SCORE */}

          <div className="results-stat-card">
            <div className="results-stat-icon">
              <FaChartLine />
            </div>

            <div>
              <span>
                Score
              </span>

              <strong>
                {percentage}%
              </strong>

              <small>
                Overall performance
              </small>
            </div>
          </div>

          {/* ACCURACY */}

          <div className="results-stat-card">
            <div className="results-stat-icon correct-icon">
              <FaCheck />
            </div>

            <div>
              <span>
                Accuracy
              </span>

              <strong>
                {accuracy}%
              </strong>

              <small>
                Of answered questions
              </small>
            </div>
          </div>

          {/* COMPLETION */}

          <div className="results-stat-card">
            <div className="results-stat-icon">
              <FaClock />
            </div>

            <div>
              <span>
                Completion
              </span>

              <strong>
                {completionRate}%
              </strong>

              <small>
                Questions answered
              </small>
            </div>
          </div>

          {/* CORRECT */}

          <div className="results-stat-card">
            <div className="results-stat-icon correct-icon">
              <FaCheck />
            </div>

            <div>
              <span>
                Correct
              </span>

              <strong>
                {correctCount}
              </strong>

              <small>
                {totalQuestions > 0
                  ? (
                      (correctCount /
                        totalQuestions) *
                      100
                    ).toFixed(0)
                  : 0}
                % of total
              </small>
            </div>
          </div>

          {/* INCORRECT */}

          <div className="results-stat-card">
            <div className="results-stat-icon incorrect-icon">
              <FaTimes />
            </div>

            <div>
              <span>
                Incorrect
              </span>

              <strong>
                {incorrectCount}
              </strong>

              <small>
                {totalQuestions > 0
                  ? (
                      (incorrectCount /
                        totalQuestions) *
                      100
                    ).toFixed(0)
                  : 0}
                % of total
              </small>
            </div>
          </div>

          {/* UNANSWERED */}

          <div className="results-stat-card">
            <div className="results-stat-icon unanswered-icon">
              <FaMinus />
            </div>

            <div>
              <span>
                Unanswered
              </span>

              <strong>
                {unansweredCount}
              </strong>

              <small>
                {totalQuestions > 0
                  ? (
                      (unansweredCount /
                        totalQuestions) *
                      100
                    ).toFixed(0)
                  : 0}
                % of total
              </small>
            </div>
          </div>

        </div>

      </section>

      {/* ==================================
          EXAM DETAILS
          ================================== */}

      {isMockExam && (
        <section className="results-section">

          <div className="results-section-header">
            <div>
              <h2>
                Exam Details
              </h2>

              <p>
                Information about this
                mock examination.
              </p>
            </div>
          </div>

          <div className="results-details-grid">

            <div className="results-detail-card">
              <span>
                <FaChartLine />
                Questions
              </span>

              <strong>
                {totalQuestions}
              </strong>
            </div>

            <div className="results-detail-card">
              <span>
                <FaCheck />
                Answered
              </span>

              <strong>
                {answeredCount}
              </strong>
            </div>

            <div className="results-detail-card">
              <span>
                <FaClock />
                Time Limit
              </span>

              <strong>
                {result.duration_minutes ??
                  0}{" "}
                min
              </strong>
            </div>

            <div className="results-detail-card">
              <span>
                <FaChartLine />
                Final Score
              </span>

              <strong>
                {score} /{" "}
                {totalQuestions}
              </strong>
            </div>

          </div>

        </section>
      )}

      {/* ==================================
          ANSWER REVIEW
          ================================== */}

      <section className="results-section">

        <div className="results-section-header">

          <div>
            <h2>
              Answer Review
            </h2>

            <p>
              Review your answers and
              understand your mistakes.
            </p>
          </div>

          {answers.length > 0 && (
            <div className="results-review-filter">

              <FaFilter />

              <select
                value={reviewFilter}
                onChange={(event) =>
                  setReviewFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Answers
                </option>

                <option value="correct">
                  Correct
                </option>

                <option value="incorrect">
                  Incorrect
                </option>

                <option value="unanswered">
                  Unanswered
                </option>
              </select>

            </div>
          )}

        </div>

        {/* REVIEW SUMMARY */}

        {answers.length > 0 && (
          <div className="results-review-summary">

            <span>
              Showing{" "}
              <strong>
                {filteredAnswers.length}
              </strong>{" "}
              of{" "}
              <strong>
                {answers.length}
              </strong>{" "}
              questions
            </span>

          </div>
        )}

        <div className="results-answer-list">

          {answers.length === 0 ? (

            <div className="results-no-answers">

              <FaChartLine />

              <p>
                Answer details are not
                available for this result.
              </p>

            </div>

          ) : filteredAnswers.length === 0 ? (

            <div className="results-no-answers">

              <FaFilter />

              <p>
                No questions match this
                filter.
              </p>

            </div>

          ) : (

            filteredAnswers.map(
              (
                answer,
                index
              ) => {

                const isCorrect =
                  Boolean(
                    answer.is_correct
                  );

                const selectedAnswer =
                  getSelectedAnswer(
                    answer
                  );

                const correctAnswer =
                  getCorrectAnswer(
                    answer
                  );

                const isUnanswered =
                  selectedAnswer ===
                  "No answer";

                return (
                  <div
                    key={
                      answer.id ||
                      answer.question_id ||
                      index
                    }
                    className={
                      isUnanswered
                        ? "results-answer answer-unanswered"
                        : isCorrect
                        ? "results-answer answer-correct"
                        : "results-answer answer-incorrect"
                    }
                  >

                    {/* NUMBER */}

                    <div className="results-answer-number">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="results-answer-content">

                      <div className="results-answer-question-label">
                        QUESTION{" "}
                        {index + 1}
                      </div>

                      <h3>
                        {answer.question_text ||
                          "Question text unavailable."}
                      </h3>

                      {/* YOUR ANSWER */}

                      <div className="answer-review-row">

                        <span>
                          Your answer
                        </span>

                        <strong>
                          {selectedAnswer}
                        </strong>

                      </div>

                      {/* CORRECT ANSWER */}

                      {!isCorrect && (
                        <div className="answer-review-row correct-answer-row">

                          <span>
                            Correct answer
                          </span>

                          <strong>
                            {correctAnswer}
                          </strong>

                        </div>
                      )}

                      {/* EXPLANATION */}

                      {answer.explanation && (
                        <div className="answer-explanation">

                          <strong>
                            Explanation
                          </strong>

                          <p>
                            {answer.explanation}
                          </p>

                        </div>
                      )}

                    </div>

                    {/* STATUS */}

                    <div
                      className={
                        isUnanswered
                          ? "results-answer-status status-unanswered"
                          : isCorrect
                          ? "results-answer-status status-correct"
                          : "results-answer-status status-incorrect"
                      }
                    >

                      {isUnanswered ? (
                        <>
                          <FaMinus />
                          Unanswered
                        </>
                      ) : isCorrect ? (
                        <>
                          <FaCheck />
                          Correct
                        </>
                      ) : (
                        <>
                          <FaTimes />
                          Incorrect
                        </>
                      )}

                    </div>

                  </div>
                );
              }
            )

          )}

        </div>

      </section>

      {/* ==================================
          ACTIONS
          ================================== */}

      <div className="results-actions">

        <Link
          to={
            isMockExam
              ? "/mock-exam"
              : "/practice"
          }
          className="results-primary-button"
        >
          <FaRedo />

          {isMockExam
            ? "Take Another Mock Exam"
            : "Practice Again"}
        </Link>

        <Link
          to="/history"
          className="results-secondary-button"
        >
          View History
        </Link>

        <Link
          to="/dashboard"
          className="results-secondary-button"
        >
          Back to Dashboard
        </Link>

      </div>

    </div>
  );
}

export default Results;