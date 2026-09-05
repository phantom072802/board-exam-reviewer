import { useEffect, useState } from "react";
import {
  FiBookmark,
  FiBookmark as FiBookmarkFilled,
} from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";

import api from "../services/api";

function Practice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ========================================
  // STATE
  // ========================================

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedChoice, setSelectedChoice] =
    useState(null);

  const [feedback, setFeedback] = useState(null);

  const [session, setSession] = useState(null);

  const [score, setScore] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [answeredQuestions, setAnsweredQuestions] =
    useState({});

  const [error, setError] = useState("");

  // ========================================
  // BOOKMARK STATE
  // ========================================

  const [bookmarkedQuestions, setBookmarkedQuestions] =
    useState(new Set());

  const [bookmarkLoading, setBookmarkLoading] =
    useState(false);

  // ========================================
  // CURRENT QUESTION
  // ========================================

  const currentQuestion =
    questions[currentIndex];

  const isLastQuestion =
    currentIndex === questions.length - 1;

  const isCurrentBookmarked =
    currentQuestion
      ? bookmarkedQuestions.has(
          Number(currentQuestion.id)
        )
      : false;

  // ========================================
  // LOAD QUESTIONS + START SESSION
  // ========================================

  useEffect(() => {
    const initializePractice = async () => {
      try {
        setLoading(true);
        setError("");

        // ==================================
        // GET QUESTIONS
        // ==================================

        const questionsResponse =
          await api.get("/questions");

        const questionData =
          questionsResponse.data.data || [];

        if (questionData.length === 0) {
          setQuestions([]);
          return;
        }

        setQuestions(questionData);

        // ==================================
        // LOAD BOOKMARKS
        // ==================================

        const bookmarksResponse =
          await api.get("/bookmarks");

        const bookmarkData =
          bookmarksResponse.data.data || [];

        const bookmarkIds = new Set(
          bookmarkData.map(
            (bookmark) =>
              Number(bookmark.question_id)
          )
        );

        setBookmarkedQuestions(bookmarkIds);

        // ==================================
        // START PRACTICE SESSION
        // ==================================

        const sessionResponse =
          await api.post(
            "/practice/sessions",
            {
              total_questions:
                questionData.length,
            }
          );

        setSession(
          sessionResponse.data.data
        );

        // ==================================
        // OPEN SPECIFIC BOOKMARKED QUESTION
        // ==================================

        const questionParam =
          searchParams.get("question");

        if (questionParam) {
          const targetQuestionId =
            Number(questionParam);

          const targetIndex =
            questionData.findIndex(
              (question) =>
                Number(question.id) ===
                targetQuestionId
            );

          if (targetIndex !== -1) {
            setCurrentIndex(targetIndex);
          }
        }
      } catch (err) {
        console.error(
          "Practice initialization error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load practice questions."
        );
      } finally {
        setLoading(false);
      }
    };

    initializePractice();
  }, [searchParams]);

  // ========================================
  // TOGGLE BOOKMARK
  // ========================================

  const handleToggleBookmark = async () => {
    if (
      !currentQuestion ||
      bookmarkLoading
    ) {
      return;
    }

    const questionId =
      Number(currentQuestion.id);

    try {
      setBookmarkLoading(true);
      setError("");

      // ==================================
      // REMOVE BOOKMARK
      // ==================================

      if (
        bookmarkedQuestions.has(questionId)
      ) {
        await api.delete(
          `/bookmarks/${questionId}`
        );

        setBookmarkedQuestions(
          (previous) => {
            const updated =
              new Set(previous);

            updated.delete(questionId);

            return updated;
          }
        );

        return;
      }

      // ==================================
      // ADD BOOKMARK
      // ==================================

      await api.post(
        `/bookmarks/${questionId}`
      );

      setBookmarkedQuestions(
        (previous) => {
          const updated =
            new Set(previous);

          updated.add(questionId);

          return updated;
        }
      );
    } catch (err) {
      console.error(
        "Toggle bookmark error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update bookmark."
      );
    } finally {
      setBookmarkLoading(false);
    }
  };

  // ========================================
  // SELECT ANSWER
  // ========================================

  const handleSelectChoice = (
    choiceId
  ) => {
    // Don't allow changing answer
    // after submission

    if (feedback) {
      return;
    }

    setSelectedChoice(choiceId);
  };

  // ========================================
  // SUBMIT ANSWER
  // ========================================

  const handleSubmitAnswer =
    async () => {
      if (
        !currentQuestion ||
        !selectedChoice ||
        !session
      ) {
        return;
      }

      if (feedback) {
        return;
      }

      try {
        setSubmitting(true);

        const response =
          await api.post(
            `/practice/sessions/${session.id}/answers`,
            {
              question_id:
                currentQuestion.id,

              choice_id:
                selectedChoice,
            }
          );

        const result =
          response.data.data;

        // ==================================
        // SAVE ANSWER LOCALLY
        // ==================================

        setAnsweredQuestions(
          (previous) => ({
            ...previous,

            [currentQuestion.id]: {
              choiceId:
                selectedChoice,

              correct:
                result.correct,
            },
          })
        );

        // ==================================
        // SHOW FEEDBACK
        // ==================================

        setFeedback(result);

        // ==================================
        // UPDATE SCORE
        // ==================================

        if (result.correct) {
          setScore(
            (previous) =>
              previous + 1
          );
        }
      } catch (err) {
        console.error(
          "Submit answer error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to submit answer."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // ========================================
  // NEXT QUESTION
  // ========================================

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex(
        (previous) =>
          previous + 1
      );

      setSelectedChoice(null);
      setFeedback(null);
      setError("");
    }
  };

  // ========================================
  // PREVIOUS QUESTION
  // ========================================

  const handlePrevious = () => {
    if (currentIndex === 0) {
      return;
    }

    const previousIndex =
      currentIndex - 1;

    const previousQuestion =
      questions[previousIndex];

    const previousAnswer =
      answeredQuestions[
        previousQuestion.id
      ];

    setCurrentIndex(
      previousIndex
    );

    if (previousAnswer) {
      setSelectedChoice(
        previousAnswer.choiceId
      );

      setFeedback({
        correct:
          previousAnswer.correct,

        explanation:
          previousQuestion.explanation,
      });
    } else {
      setSelectedChoice(null);
      setFeedback(null);
    }

    setError("");
  };

  // ========================================
  // FINISH PRACTICE
  // ========================================

  const handleFinish = async () => {
    if (!session) {
      return;
    }

    try {
      setFinishing(true);

      const response =
        await api.post(
          `/practice/sessions/${session.id}/complete`
        );

      const completedSession =
        response.data.data;

      // ==================================
      // SAVE FINAL SCORE TEMPORARILY
      // ==================================

      sessionStorage.setItem(
        "lastPracticeResult",
        JSON.stringify({
          sessionId:
            completedSession.id,

          score:
            completedSession.score,

          totalQuestions:
            completedSession.total_questions,
        })
      );

      navigate(
        `/results?type=practice&id=${completedSession.id}`
      );
    } catch (err) {
      console.error(
        "Finish practice error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to complete practice session."
      );
    } finally {
      setFinishing(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="practice-page">
        <div className="practice-loading">
          Loading practice questions...
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (
    error &&
    questions.length === 0
  ) {
    return (
      <div className="practice-page">
        <div className="practice-empty">
          <h2>
            Unable to load practice
          </h2>

          <p>{error}</p>

          <button
            className="practice-primary-button"
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

  // ========================================
  // NO QUESTIONS
  // ========================================

  if (questions.length === 0) {
    return (
      <div className="practice-page">
        <div className="practice-empty">
          <h2>
            No questions available.
          </h2>

          <p>
            There are currently no
            practice questions in the
            database.
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="practice-page">

      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <div className="practice-header">

        <div>
          <p className="practice-label">
            PRACTICE
          </p>

          <h1>
            Practice Questions
          </h1>

          <p className="practice-subtitle">
            Test your knowledge and improve
            your exam readiness.
          </p>
        </div>

        {/* SCORE */}

        <div className="practice-score">
          <span>Score</span>

          <strong>
            {score} / {questions.length}
          </strong>
        </div>

      </div>

      {/* ================================== */}
      {/* PROGRESS */}
      {/* ================================== */}

      <div className="practice-progress-wrapper">

        <div className="practice-progress-info">

          <span>
            Question{" "}
            {currentIndex + 1} of{" "}
            {questions.length}
          </span>

          <span>
            {Math.round(
              ((currentIndex + 1) /
                questions.length) *
                100
            )}
            %
          </span>

        </div>

        <div className="practice-progress">

          <div
            className="practice-progress-bar"
            style={{
              width: `${
                ((currentIndex + 1) /
                  questions.length) *
                100
              }%`,
            }}
          />

        </div>

      </div>

      {/* ================================== */}
      {/* QUESTION CARD */}
      {/* ================================== */}

      <div className="practice-card">

        {/* ================================= */}
        {/* QUESTION TOP */}
        {/* ================================= */}

        <div className="practice-question-top">

          <span className="practice-question-number">
            Question{" "}
            {currentIndex + 1} of{" "}
            {questions.length}
          </span>

          {/* BOOKMARK */}

          <button
            type="button"
            className={
              isCurrentBookmarked
                ? "practice-bookmark-button bookmarked"
                : "practice-bookmark-button"
            }
            onClick={
              handleToggleBookmark
            }
            disabled={bookmarkLoading}
            title={
              isCurrentBookmarked
                ? "Remove bookmark"
                : "Bookmark question"
            }
          >
            {isCurrentBookmarked ? (
              <FiBookmarkFilled />
            ) : (
              <FiBookmark />
            )}

            <span>
              {bookmarkLoading
                ? "Saving..."
                : isCurrentBookmarked
                ? "Bookmarked"
                : "Bookmark"}
            </span>
          </button>

        </div>

        {/* ================================= */}
        {/* QUESTION INFO */}
        {/* ================================= */}

        <div className="practice-question-meta">

          <span>
            {currentQuestion.subject_name}
          </span>

          <span>
            {currentQuestion.topic_name}
          </span>

          {currentQuestion.difficulty && (
            <span>
              {currentQuestion.difficulty}
            </span>
          )}

        </div>

        {/* ================================= */}
        {/* QUESTION */}
        {/* ================================= */}

        <h2 className="practice-question">
          {currentQuestion.question_text}
        </h2>

        {/* ================================= */}
        {/* CHOICES */}
        {/* ================================= */}

        <div className="practice-choices">

          {currentQuestion.choices?.map(
            (choice, index) => {

              const isSelected =
                Number(selectedChoice) ===
                Number(choice.id);

              const savedAnswer =
                answeredQuestions[
                  currentQuestion.id
                ];

              const isCorrectAnswer =
                feedback &&
                savedAnswer &&
                savedAnswer.correct &&
                isSelected;

              const isWrongAnswer =
                feedback &&
                savedAnswer &&
                !savedAnswer.correct &&
                isSelected;

              return (
                <button
                  key={choice.id}
                  type="button"
                  className={`practice-choice ${
                    isSelected
                      ? "selected"
                      : ""
                  } ${
                    isCorrectAnswer
                      ? "correct"
                      : ""
                  } ${
                    isWrongAnswer
                      ? "incorrect"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelectChoice(
                      choice.id
                    )
                  }
                  disabled={
                    !!feedback ||
                    submitting
                  }
                >

                  <span className="choice-letter">
                    {String.fromCharCode(
                      65 + index
                    )}
                  </span>

                  <span className="choice-text">
                    {choice.choice_text}
                  </span>

                  {isCorrectAnswer && (
                    <FaCheck />
                  )}

                  {isWrongAnswer && (
                    <FaTimes />
                  )}

                </button>
              );
            }
          )}

        </div>

        {/* ================================== */}
        {/* FEEDBACK */}
        {/* ================================== */}

        {feedback && (
          <div
            className={`practice-feedback ${
              feedback.correct
                ? "feedback-correct"
                : "feedback-incorrect"
            }`}
          >

            <div className="feedback-title">

              {feedback.correct ? (
                <>
                  <FaCheck />
                  Correct Answer
                </>
              ) : (
                <>
                  <FaTimes />
                  Incorrect Answer
                </>
              )}

            </div>

            {feedback.explanation && (
              <p>
                {feedback.explanation}
              </p>
            )}

          </div>
        )}

        {/* ================================== */}
        {/* ERROR */}
        {/* ================================== */}

        {error && (
          <div className="practice-inline-error">
            {error}
          </div>
        )}

        {/* ================================== */}
        {/* ACTIONS */}
        {/* ================================== */}

        <div className="practice-actions">

          <button
            type="button"
            className="practice-secondary-button"
            onClick={handlePrevious}
            disabled={
              currentIndex === 0
            }
          >
            <FaChevronLeft />
            Previous
          </button>

          <div className="practice-main-actions">

            {!feedback && (
              <button
                type="button"
                className="practice-primary-button"
                onClick={
                  handleSubmitAnswer
                }
                disabled={
                  !selectedChoice ||
                  submitting
                }
              >
                {submitting
                  ? "Checking..."
                  : "Submit Answer"}
              </button>
            )}

            {feedback &&
              !isLastQuestion && (
                <button
                  type="button"
                  className="practice-primary-button"
                  onClick={handleNext}
                >
                  Next Question
                  <FaChevronRight />
                </button>
              )}

            {feedback &&
              isLastQuestion && (
                <button
                  type="button"
                  className="practice-primary-button"
                  onClick={handleFinish}
                  disabled={finishing}
                >
                  {finishing
                    ? "Finishing..."
                    : "Finish Practice"}
                </button>
              )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default Practice;