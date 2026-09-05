import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

import api from "../services/api";


function History() {

  // ========================================
  // STATE
  // ========================================

  const navigate = useNavigate();

  const [history, setHistory] =
    useState([]);

  const [filter, setFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ========================================
  // LOAD HISTORY
  // ========================================

  useEffect(() => {

    const loadHistory = async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/dashboard/history"
          );

        setHistory(
          response.data.data || []
        );

      } catch (error) {

        console.error(
          "History error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load history."
        );

      } finally {

        setLoading(false);

      }
    };


    loadHistory();

  }, []);


  // ========================================
  // FILTER
  // ========================================

  const filteredHistory =
    history.filter((item) => {

      if (filter === "all") {
        return true;
      }

      return item.type === filter;

    });


  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (date) => {

    if (!date) {
      return "Not available";
    }

    return new Date(date)
      .toLocaleString();

  };


  // ========================================
  // LOADING
  // ========================================

  if (loading) {

    return (
      <div className="page">

        <div className="history-loading">
          Loading history...
        </div>

      </div>
    );

  }


  // ========================================
  // ERROR
  // ========================================

  if (error) {

    return (
      <div className="page">

        <div className="history-empty">

          <h2>
            Unable to load history
          </h2>

          <p>
            {error}
          </p>

        </div>

      </div>
    );

  }


  // ========================================
  // RENDER
  // ========================================

  return (

    <div className="page">

      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <div className="page-header">

        <div>

          <p className="eyebrow">
            History
          </p>

          <h1>
            Study History
          </h1>

          <p className="page-description">
            Review your previous practice sessions
            and mock examinations.
          </p>

        </div>

      </div>


      {/* ================================== */}
      {/* FILTERS */}
      {/* ================================== */}

      <div className="history-filters">

        <button
          className={
            filter === "all"
              ? "history-filter active"
              : "history-filter"
          }
          onClick={() =>
            setFilter("all")
          }
        >
          All
        </button>

        <button
          className={
            filter === "practice"
              ? "history-filter active"
              : "history-filter"
          }
          onClick={() =>
            setFilter("practice")
          }
        >
          Practice
        </button>

        <button
          className={
            filter === "mock"
              ? "history-filter active"
              : "history-filter"
          }
          onClick={() =>
            setFilter("mock")
          }
        >
          Mock Exams
        </button>

      </div>


      {/* ================================== */}
      {/* HISTORY LIST */}
      {/* ================================== */}

      {filteredHistory.length === 0 ? (

        <div className="content-card history-empty">

          <FiBookOpen />

          <h2>
            No history yet
          </h2>

          <p>
            Complete a practice session or mock
            examination to see it here.
          </p>

        </div>

      ) : (

        <div className="history-list">

          {filteredHistory.map(
            (item) => {

              const score =
                Number(item.score) || 0;

              const total =
                Number(
                  item.total_questions
                ) || 0;

              const percentage =
                Number(
                  item.percentage
                ) || 0;


              return (

                <div
                  className="content-card history-card"
                  key={`${item.type}-${item.id}`}
                  onClick={() =>
                    navigate(
                        `/results?type=${item.type}&id=${item.id}`
                        )
                    }
                >

                  {/* ====================== */}
                  {/* TYPE ICON */}
                  {/* ====================== */}

                  <div className="history-icon">

                    {item.type === "mock" ? (
                      <FiClock />
                    ) : (
                      <FiBookOpen />
                    )}

                  </div>


                  {/* ====================== */}
                  {/* INFORMATION */}
                  {/* ====================== */}

                  <div className="history-info">

                    <div className="history-title-row">

                      <h2>
                        {item.type_label}
                      </h2>

                      <span
                        className={
                          item.type === "mock"
                            ? "history-badge mock"
                            : "history-badge practice"
                        }
                      >
                        {item.type === "mock"
                          ? "Mock Exam"
                          : "Practice"}
                      </span>

                    </div>


                    {item.subject_name && (

                      <p>
                        {item.subject_name}
                      </p>

                    )}


                    <small>
                      Completed{" "}
                      {formatDate(
                        item.completed_at
                      )}
                    </small>

                  </div>


                  {/* ====================== */}
                  {/* SCORE */}
                  {/* ====================== */}

                  <div className="history-score">

                    <strong>
                      {score}
                      <span>
                        {" "}
                        / {total}
                      </span>
                    </strong>

                    <small>
                      {percentage.toFixed(2)}%
                    </small>

                  </div>


                  {/* ====================== */}
                  {/* QUESTIONS */}
                  {/* ====================== */}

                  <div className="history-stat">

                    <FiBarChart2 />

                    <div>

                      <span>
                        Questions
                      </span>

                      <strong>
                        {total}
                      </strong>

                    </div>

                  </div>


                  {/* ====================== */}
                  {/* STATUS */}
                  {/* ====================== */}

                  <div className="history-status">

                    <FiCheckCircle />

                    <span>
                      Completed
                    </span>

                  </div>

                </div>

              );

            }
          )}

        </div>

      )}

    </div>

  );
}


export default History;