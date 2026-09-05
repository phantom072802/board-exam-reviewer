import { useEffect, useMemo, useState } from "react";

import {
  FiArrowRight,
  FiBookOpen,
  FiBookmark,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { Link } from "react-router-dom";

import api from "../services/api";

function QuestionBank() {
  // ========================================
  // STATE
  // ========================================

  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FILTER STATE
  // ========================================

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");

  // ========================================
  // PAGINATION
  // ========================================

  const [currentPage, setCurrentPage] = useState(1);

  const questionsPerPage = 10;

  // ========================================
  // BOOKMARK STATE
  // ========================================

  const [bookmarkLoading, setBookmarkLoading] = useState(null);

  // ========================================
  // LOAD DATA
  // ========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        // ==================================
        // LOAD QUESTIONS
        // ==================================

        const questionsResponse = await api.get("/questions");

        const questionData =
          questionsResponse.data?.data || [];

        console.log(
          "Question Bank Questions:",
          questionData
        );

        setQuestions(questionData);

        // ==================================
        // LOAD SUBJECTS
        // ==================================

        const subjectsResponse = await api.get(
          "/subjects"
        );

        const subjectData =
          subjectsResponse.data?.data || [];

        setSubjects(subjectData);

        // ==================================
        // LOAD BOOKMARKS
        // ==================================

        try {
          const bookmarksResponse =
            await api.get("/bookmarks");

          const bookmarkData =
            bookmarksResponse.data?.data || [];

          const bookmarkIds = new Set(
            bookmarkData.map((bookmark) =>
              Number(bookmark.question_id)
            )
          );

          setBookmarks(bookmarkIds);
        } catch (bookmarkError) {
          console.error(
            "Bookmark loading error:",
            bookmarkError
          );

          // Don't break Question Bank
          // if bookmarks fail.
          setBookmarks(new Set());
        }
      } catch (err) {
        console.error(
          "Question Bank error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load questions."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ========================================
  // TOPIC OPTIONS
  // ========================================

  const topicOptions = useMemo(() => {
    const topicMap = new Map();

    questions.forEach((question) => {
      // If a subject is selected,
      // only show topics belonging
      // to that subject.

      if (
        subjectFilter &&
        Number(question.subject_id) !==
          Number(subjectFilter)
      ) {
        return;
      }

      const topicId =
        question.topic_id != null
          ? String(question.topic_id)
          : "";

      const topicName = String(
        question.topic_name || ""
      ).trim();

      if (!topicName) {
        return;
      }

      // Prefer topic ID when available.
      const key = topicId || topicName;

      if (!topicMap.has(key)) {
        topicMap.set(key, {
          id: topicId,
          name: topicName,
        });
      }
    });

    return Array.from(topicMap.values()).sort(
      (a, b) =>
        a.name.localeCompare(b.name)
    );
  }, [questions, subjectFilter]);

  // ========================================
  // FILTER QUESTIONS
  // ========================================

  const filteredQuestions = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return questions.filter((question) => {
      // ================================
      // SEARCH
      // ================================

      if (searchText) {
        const questionText = String(
          question.question_text || ""
        ).toLowerCase();

        const subjectName = String(
          question.subject_name || ""
        ).toLowerCase();

        const topicName = String(
          question.topic_name || ""
        ).toLowerCase();

        const difficulty = String(
          question.difficulty || ""
        ).toLowerCase();

        const matches =
          questionText.includes(searchText) ||
          subjectName.includes(searchText) ||
          topicName.includes(searchText) ||
          difficulty.includes(searchText);

        if (!matches) {
          return false;
        }
      }

      // ================================
      // SUBJECT
      // ================================

      if (
        subjectFilter &&
        Number(question.subject_id) !==
          Number(subjectFilter)
      ) {
        return false;
      }

      // ================================
      // TOPIC
      // ================================

      if (topicFilter) {
        const questionTopicId =
          question.topic_id != null
            ? String(question.topic_id)
            : "";

        const questionTopicName = String(
          question.topic_name || ""
        );

        const matchesTopic =
          questionTopicId === topicFilter ||
          questionTopicName === topicFilter;

        if (!matchesTopic) {
          return false;
        }
      }

      // ================================
      // DIFFICULTY
      // ================================

      if (
        difficultyFilter &&
        String(
          question.difficulty || ""
        ).toLowerCase() !==
          difficultyFilter.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [
    questions,
    search,
    subjectFilter,
    topicFilter,
    difficultyFilter,
  ]);

  // ========================================
  // PAGINATION CALCULATIONS
  // ========================================

  const totalPages = Math.ceil(
    filteredQuestions.length /
      questionsPerPage
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;

  const startIndex =
    (safeCurrentPage - 1) *
    questionsPerPage;

  const endIndex =
    startIndex + questionsPerPage;

  const paginatedQuestions =
    filteredQuestions.slice(
      startIndex,
      endIndex
    );

  // ========================================
  // RESET PAGE IF FILTER RESULTS CHANGE
  // ========================================

  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }

    if (
      filteredQuestions.length === 0 &&
      currentPage !== 1
    ) {
      setCurrentPage(1);
    }
  }, [
    filteredQuestions.length,
    totalPages,
    currentPage,
  ]);

  // ========================================
  // CLEAR FILTERS
  // ========================================

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("");
    setTopicFilter("");
    setDifficultyFilter("");
    setCurrentPage(1);
  };

  // ========================================
  // SEARCH CHANGE
  // ========================================

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  // ========================================
  // SUBJECT CHANGE
  // ========================================

  const handleSubjectChange = (event) => {
    const value = event.target.value;

    setSubjectFilter(value);

    // Reset topic because the
    // available topics may change.
    setTopicFilter("");

    setCurrentPage(1);
  };

  // ========================================
  // TOPIC CHANGE
  // ========================================

  const handleTopicChange = (event) => {
    setTopicFilter(event.target.value);
    setCurrentPage(1);
  };

  // ========================================
  // DIFFICULTY CHANGE
  // ========================================

  const handleDifficultyChange = (event) => {
    setDifficultyFilter(
      event.target.value
    );

    setCurrentPage(1);
  };

  // ========================================
  // TOGGLE BOOKMARK
  // ========================================

  const toggleBookmark = async (questionId) => {
    const id = Number(questionId);

    if (bookmarkLoading === id) {
      return;
    }

    const isBookmarked =
      bookmarks.has(id);

    try {
      setBookmarkLoading(id);
      setError("");

      // ==================================
      // REMOVE BOOKMARK
      // ==================================

      if (isBookmarked) {
        await api.delete(
          `/bookmarks/${id}`
        );

        setBookmarks((previous) => {
          const updated =
            new Set(previous);

          updated.delete(id);

          return updated;
        });

        return;
      }

      // ==================================
      // ADD BOOKMARK
      // ==================================

      await api.post(
        `/bookmarks/${id}`
      );

      setBookmarks((previous) => {
        const updated =
          new Set(previous);

        updated.add(id);

        return updated;
      });
    } catch (err) {
      console.error(
        "Bookmark error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update bookmark."
      );
    } finally {
      setBookmarkLoading(null);
    }
  };

  // ========================================
  // GO TO PREVIOUS PAGE
  // ========================================

  const goToPreviousPage = () => {
    setCurrentPage((previous) =>
      Math.max(previous - 1, 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ========================================
  // GO TO NEXT PAGE
  // ========================================

  const goToNextPage = () => {
    setCurrentPage((previous) =>
      Math.min(
        previous + 1,
        totalPages
      )
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ========================================
  // GO TO SPECIFIC PAGE
  // ========================================

  const goToPage = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="question-bank-page">
        <div className="question-bank-loading">
          <div className="question-bank-loading-icon">
            <FiBookOpen />
          </div>

          <p>
            Loading question bank...
          </p>
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
      <div className="question-bank-page">
        <div className="question-bank-error">
          <div className="question-bank-error-icon">
            <FiBookOpen />
          </div>

          <h2>
            Unable to load questions
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="question-bank-primary-button"
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
  // RENDER
  // ========================================

  return (
    <div className="question-bank-page">

      {/* ==================================
          HEADER
          ================================== */}

      <div className="question-bank-header">
        <div>
          <p className="question-bank-eyebrow">
            QUESTION BANK
          </p>

          <h1>
            Browse Questions
          </h1>

          <p>
            Search and filter questions to
            focus your board exam preparation.
          </p>
        </div>

        <div className="question-bank-count">
          <FiBookOpen />

          <div>
            <strong>
              {filteredQuestions.length}
            </strong>

            <span>
              {filteredQuestions.length === 1
                ? "question"
                : "questions"}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================
          SEARCH & FILTERS
          ================================== */}

      <div className="question-bank-toolbar">

        {/* ==================================
            SEARCH
            ================================== */}

        <div className="question-bank-search">
          <FiSearch />

          <input
            type="text"
            value={search}
            placeholder="Search questions, subjects, topics..."
            onChange={
              handleSearchChange
            }
          />

          {search && (
            <button
              type="button"
              className="question-bank-clear-search"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* ==================================
            FILTERS
            ================================== */}

        <div className="question-bank-filters">

          {/* ==================================
              SUBJECT
              ================================== */}

          <div className="question-bank-filter">
            <label>
              Subject
            </label>

            <select
              value={subjectFilter}
              onChange={
                handleSubjectChange
              }
            >
              <option value="">
                All Subjects
              </option>

              {subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* ==================================
              TOPIC
              ================================== */}

          <div className="question-bank-filter">
            <label>
              Topic
            </label>

            <select
              value={topicFilter}
              onChange={
                handleTopicChange
              }
              disabled={
                topicOptions.length === 0
              }
            >
              <option value="">
                All Topics
              </option>

              {topicOptions.map((topic) => (
                <option
                  key={
                    topic.id ||
                    topic.name
                  }
                  value={
                    topic.id ||
                    topic.name
                  }
                >
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          {/* ==================================
              DIFFICULTY
              ================================== */}

          <div className="question-bank-filter">
            <label>
              Difficulty
            </label>

            <select
              value={difficultyFilter}
              onChange={
                handleDifficultyChange
              }
            >
              <option value="">
                All Difficulties
              </option>

              <option value="easy">
                Easy
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="hard">
                Hard
              </option>
            </select>
          </div>

          {/* ==================================
              CLEAR
              ================================== */}

          <button
            type="button"
            className="question-bank-reset-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* ==================================
          ACTIVE FILTER SUMMARY
          ================================== */}

      {(search ||
        subjectFilter ||
        topicFilter ||
        difficultyFilter) && (
        <div className="question-bank-filter-summary">
          Showing{" "}

          <strong>
            {filteredQuestions.length}
          </strong>

          {" "}of{" "}

          <strong>
            {questions.length}
          </strong>

          {" "}questions
        </div>
      )}

      {/* ==================================
          INLINE ERROR
          ================================== */}

      {error &&
        questions.length > 0 && (
          <div className="question-bank-inline-error">
            {error}
          </div>
        )}

      {/* ==================================
          NO QUESTIONS
          ================================== */}

      {filteredQuestions.length === 0 ? (
        <div className="question-bank-empty">
          <div className="question-bank-empty-icon">
            <FiSearch />
          </div>

          <h2>
            No questions found
          </h2>

          <p>
            Try changing your search or
            filters.
          </p>

          <button
            type="button"
            className="question-bank-primary-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* ==================================
              QUESTION LIST
              ================================== */}

          <div className="question-bank-list">

            {paginatedQuestions.map(
              (question, index) => {
                const questionId =
                  Number(question.id);

                const isBookmarked =
                  bookmarks.has(
                    questionId
                  );

                const questionNumber =
                  startIndex + index + 1;

                return (
                  <article
                    key={question.id}
                    className="question-bank-card"
                  >

                    {/* ==========================
                        TOP
                        ========================== */}

                    <div className="question-bank-card-top">
                      <div className="question-bank-card-meta">

                        <span className="question-bank-number">
                          {String(
                            questionNumber
                          ).padStart(2, "0")}
                        </span>

                        {question.subject_name && (
                          <span className="question-bank-subject">
                            {question.subject_name}
                          </span>
                        )}

                        {question.topic_name && (
                          <span className="question-bank-topic">
                            {question.topic_name}
                          </span>
                        )}

                        {question.difficulty && (
                          <span
                            className={`question-bank-difficulty ${String(
                              question.difficulty
                            ).toLowerCase()}`}
                          >
                            {String(
                              question.difficulty
                            )}
                          </span>
                        )}
                      </div>

                      {/* ==========================
                          BOOKMARK
                          ========================== */}

                      <button
                        type="button"
                        className={
                          isBookmarked
                            ? "question-bank-bookmark bookmarked"
                            : "question-bank-bookmark"
                        }
                        onClick={() =>
                          toggleBookmark(
                            questionId
                          )
                        }
                        disabled={
                          bookmarkLoading ===
                          questionId
                        }
                        aria-label={
                          isBookmarked
                            ? "Remove bookmark"
                            : "Bookmark question"
                        }
                      >
                        <FiBookmark />

                        {bookmarkLoading ===
                        questionId
                          ? "Saving..."
                          : isBookmarked
                          ? "Saved"
                          : "Bookmark"}
                      </button>
                    </div>

                    {/* ==========================
                        QUESTION
                        ========================== */}

                    <div className="question-bank-question">
                      <p className="question-bank-label">
                        QUESTION
                      </p>

                      <h2>
                        {question.question_text}
                      </h2>
                    </div>

                    {/* ==========================
                        EXPLANATION
                        ========================== */}

                    {question.explanation && (
                      <div className="question-bank-explanation">
                        <strong>
                          Explanation
                        </strong>

                        <p>
                          {question.explanation}
                        </p>
                      </div>
                    )}

                    {/* ==========================
                        FOOTER
                        ========================== */}

                    <div className="question-bank-card-footer">
                      <span>
                        Question #{questionNumber}
                      </span>

                      <Link
                        to={`/practice?question=${question.id}`}
                        className="question-bank-practice-button"
                      >
                        <span>
                          Practice This Question
                        </span>

                        <FiArrowRight />
                      </Link>
                    </div>
                  </article>
                );
              }
            )}
          </div>

          {/* ==================================
              PAGINATION
              ================================== */}

          {totalPages > 1 && (
            <div className="question-bank-pagination">

              {/* PREVIOUS */}

              <button
                type="button"
                className="question-bank-page-button"
                disabled={
                  safeCurrentPage === 1
                }
                onClick={
                  goToPreviousPage
                }
              >
                ← Previous
              </button>

              {/* PAGE NUMBERS */}

              <div className="question-bank-page-numbers">
                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) => {
                    const page =
                      index + 1;

                    return (
                      <button
                        key={page}
                        type="button"
                        className={
                          safeCurrentPage ===
                          page
                            ? "question-bank-page-number active"
                            : "question-bank-page-number"
                        }
                        onClick={() =>
                          goToPage(page)
                        }
                      >
                        {page}
                      </button>
                    );
                  }
                )}
              </div>

              {/* NEXT */}

              <button
                type="button"
                className="question-bank-page-button"
                disabled={
                  safeCurrentPage ===
                  totalPages
                }
                onClick={
                  goToNextPage
                }
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default QuestionBank;