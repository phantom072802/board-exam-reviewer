import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBookOpen,
  FiLayers,
} from "react-icons/fi";

import api from "../services/api";

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/subjects");

        setSubjects(response.data.data);
      } catch (error) {
        console.error("Failed to load subjects:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load subjects."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <div className="page-container">

      {/* =================================
          HEADER
      ================================= */}

      <div className="page-header">

        <div>
          <p className="eyebrow">Study</p>

          <h1>Subjects</h1>

          <p>
            Choose a subject and start reviewing.
          </p>
        </div>

      </div>


      {/* =================================
          LOADING
      ================================= */}

      {loading && (
        <div className="subjects-state">
          <p>Loading subjects...</p>
        </div>
      )}


      {/* =================================
          ERROR
      ================================= */}

      {!loading && error && (
        <div className="subjects-error">
          <p>{error}</p>

          <button
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}


      {/* =================================
          SUBJECTS
      ================================= */}

      {!loading && !error && (
        <div className="subjects-grid">

          {subjects.map((subject) => (
            <Link
              to={`/subjects/${subject.id}`}
              className="subject-card"
              key={subject.id}
            >

              <div className="subject-card-top">

                <div className="subject-icon">
                  <FiBookOpen />
                </div>

                <span className="subject-arrow">
                  <FiArrowRight />
                </span>

              </div>


              <div className="subject-card-content">

                <h3>
                  {subject.name}
                </h3>

                <p>
                  {subject.description}
                </p>

              </div>


              <div className="subject-card-meta">

                <span>
                  <FiLayers />

                  {subject.topic_count}{" "}
                  {subject.topic_count === 1
                    ? "topic"
                    : "topics"}
                </span>

              </div>

            </Link>
          ))}

        </div>
      )}


      {/* =================================
          EMPTY
      ================================= */}

      {!loading &&
        !error &&
        subjects.length === 0 && (
          <div className="subjects-state">

            <FiBookOpen />

            <h3>No subjects available</h3>

            <p>
              Subjects will appear here once they
              are added to the database.
            </p>

          </div>
        )}

    </div>
  );
}

export default Subjects;