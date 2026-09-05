import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  FiArrowRight,
  FiBookmark,
  FiBookOpen,
  FiSearch,
  FiX,
} from "react-icons/fi";

import api from "../services/api";

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  // ========================================
  // LOAD BOOKMARKS
  // ========================================

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/bookmarks");

      setBookmarks(response.data?.data || []);
    } catch (err) {
      console.error("Load bookmarks error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load bookmarks."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  // ========================================
  // SUBJECT OPTIONS
  // ========================================

  const subjects = useMemo(() => {
    const uniqueSubjects = new Map();

    bookmarks.forEach((bookmark) => {
      if (
        bookmark.subject_id &&
        bookmark.subject_name
      ) {
        uniqueSubjects.set(
          Number(bookmark.subject_id),
          bookmark.subject_name
        );
      }
    });

    return Array.from(
      uniqueSubjects.entries()
    )
      .map(([id, name]) => ({
        id,
        name,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }, [bookmarks]);

  // ========================================
  // FILTER BOOKMARKS
  // ========================================

  const filteredBookmarks = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return bookmarks.filter((bookmark) => {
      // SEARCH
      if (searchText) {
        const questionText = String(
          bookmark.question_text || ""
        ).toLowerCase();

        const subjectName = String(
          bookmark.subject_name || ""
        ).toLowerCase();

        const topicName = String(
          bookmark.topic_name || ""
        ).toLowerCase();

        const difficulty = String(
          bookmark.difficulty || ""
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

      // SUBJECT
      if (
        subjectFilter &&
        Number(bookmark.subject_id) !==
          Number(subjectFilter)
      ) {
        return false;
      }

      // DIFFICULTY
      if (
        difficultyFilter &&
        String(
          bookmark.difficulty || ""
        ).toLowerCase() !==
          difficultyFilter.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [
    bookmarks,
    search,
    subjectFilter,
    difficultyFilter,
  ]);

  // ========================================
  // CLEAR FILTERS
  // ========================================

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("");
    setDifficultyFilter("");
  };

  const hasFilters =
    search ||
    subjectFilter ||
    difficultyFilter;

  // ========================================
  // REMOVE BOOKMARK
  // ========================================

  const removeBookmark = async (questionId) => {
    const id = Number(questionId);

    if (removingId === id) {
      return;
    }

    try {
      setRemovingId(id);
      setError("");

      await api.delete(`/bookmarks/${id}`);

      setBookmarks((previous) =>
        previous.filter(
          (bookmark) =>
            Number(bookmark.question_id) !== id
        )
      );
    } catch (err) {
      console.error(
        "Remove bookmark error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to remove bookmark."
      );
    } finally {
      setRemovingId(null);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="bookmarks-page">
        <div className="bookmarks-loading">
          <div className="bookmarks-loading-icon">
            <FiBookmark />
          </div>

          <p>Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error && bookmarks.length === 0) {
    return (
      <div className="bookmarks-page">
        <div className="bookmarks-error">
          <div className="bookmarks-error-icon">
            <FiBookmark />
          </div>

          <h2>
            Unable to load bookmarks
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="bookmarks-primary-button"
            onClick={loadBookmarks}
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
    <div className="bookmarks-page">

      {/* HEADER */}
      <div className="bookmarks-header">
        <div>
          <p className="bookmarks-eyebrow">
            SAVED QUESTIONS
          </p>

          <h1>Bookmarks</h1>

          <p className="bookmarks-description">
            Review the questions you've saved
            for later study.
          </p>
        </div>

        <div className="bookmarks-count">
          <FiBookmark />

          <div>
            <strong>
              {bookmarks.length}
            </strong>

            <span>
              {bookmarks.length === 1
                ? "Saved Question"
                : "Saved Questions"}
            </span>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bookmarks-inline-error">
          {error}
        </div>
      )}

      {/* FILTERS */}
      {bookmarks.length > 0 && (
        <div className="bookmarks-filters">

          {/* SEARCH */}
          <div className="bookmarks-search">
            <FiSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search saved questions..."
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* SUBJECT */}
          <select
            value={subjectFilter}
            onChange={(event) =>
              setSubjectFilter(event.target.value)
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

          {/* DIFFICULTY */}
          <select
            value={difficultyFilter}
            onChange={(event) =>
              setDifficultyFilter(
                event.target.value
              )
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

          {hasFilters && (
            <button
              type="button"
              className="bookmarks-clear-button"
              onClick={clearFilters}
            >
              <FiX />
              Clear
            </button>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {bookmarks.length === 0 ? (
        <div className="bookmarks-empty">
          <div className="bookmarks-empty-icon">
            <FiBookmark />
          </div>

          <h2>
            No bookmarked questions
          </h2>

          <p>
            Save questions from Question Bank,
            Practice, or Mock Exam to review
            them here later.
          </p>

          <Link
            to="/questions"
            className="bookmarks-primary-button"
          >
            Browse Question Bank
            <FiArrowRight />
          </Link>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="bookmarks-empty">
          <div className="bookmarks-empty-icon">
            <FiSearch />
          </div>

          <h2>
            No questions found
          </h2>

          <p>
            Try changing your search or filters.
          </p>

          <button
            type="button"
            className="bookmarks-primary-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* BOOKMARK LIST */
        <div className="bookmarks-list">
          {filteredBookmarks.map(
            (bookmark, index) => {
              const questionId = Number(
                bookmark.question_id
              );

              const difficulty = String(
                bookmark.difficulty || ""
              ).toLowerCase();

              return (
                <article
                  key={bookmark.id || questionId}
                  className="bookmark-card"
                >

                  {/* CARD TOP */}
                  <div className="bookmark-card-top">

                    <div className="bookmark-card-meta">

                      <span className="bookmark-number">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      {bookmark.subject_name && (
                        <span className="bookmark-subject">
                          {bookmark.subject_name}
                        </span>
                      )}

                      {bookmark.topic_name && (
                        <span className="bookmark-topic">
                          {bookmark.topic_name}
                        </span>
                      )}

                      {bookmark.difficulty && (
                        <span
                          className={`bookmark-difficulty ${difficulty}`}
                        >
                          {bookmark.difficulty}
                        </span>
                      )}
                    </div>

                    {/* REMOVE */}
                    <button
                      type="button"
                      className="bookmark-remove-button"
                      onClick={() =>
                        removeBookmark(
                          questionId
                        )
                      }
                      disabled={
                        removingId === questionId
                      }
                    >
                      <FiBookmark />

                      {removingId === questionId
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>

                  {/* QUESTION */}
                  <div className="bookmark-question">
                    <p className="bookmark-label">
                      QUESTION
                    </p>

                    <h2>
                      {bookmark.question_text}
                    </h2>
                  </div>

                  {/* EXPLANATION */}
                  {bookmark.explanation && (
                    <div className="bookmark-explanation">
                      <strong>
                        Explanation
                      </strong>

                      <p>
                        {bookmark.explanation}
                      </p>
                    </div>
                  )}

                  {/* FOOTER */}
                  <div className="bookmark-card-footer">

                    <span>
                      Question #{questionId}
                    </span>

                    <Link
                      to={`/practice?question=${questionId}`}
                      className="bookmarks-practice-action"
                    >
                      <span>Practice This Question</span>
                      <FiArrowRight />
                    </Link>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

export default Bookmarks;