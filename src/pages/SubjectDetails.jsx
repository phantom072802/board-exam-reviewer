import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiLayers,
} from "react-icons/fi";

import api from "../services/api";

function SubjectDetails() {
  const { id } = useParams();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/subjects/${id}`
        );

        setSubject(response.data.data);

      } catch (error) {
        console.error(
          "Failed to load subject:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to load subject."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [id]);


  if (loading) {
    return (
      <div className="subjects-state">
        <p>Loading subject...</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="subjects-error">
        <p>{error}</p>

        <Link to="/subjects">
          Back to subjects
        </Link>
      </div>
    );
  }


  if (!subject) {
    return null;
  }


  return (
    <div className="page-container">

      <Link
        to="/subjects"
        className="back-link"
      >
        <FiArrowLeft />
        Back to subjects
      </Link>


      <div className="subject-detail-header">

        <div className="subject-detail-icon">
          <FiBookOpen />
        </div>

        <div>
          <p className="eyebrow">
            Subject
          </p>

          <h1>{subject.name}</h1>

          <p>
            {subject.description}
          </p>
        </div>

      </div>


      <div className="topics-header">

        <div>
          <h2>Topics</h2>

          <p>
            Choose a topic to begin reviewing.
          </p>
        </div>

        <span>
          {subject.topics.length} topics
        </span>

      </div>


      <div className="topics-list">

        {subject.topics.map((topic) => (
          <div
            className="topic-card"
            key={topic.id}
          >

            <div className="topic-icon">
              <FiLayers />
            </div>

            <div className="topic-content">

              <h3>
                {topic.name}
              </h3>

              <p>
                {topic.description}
              </p>

            </div>

            <button
              className="topic-button"
              type="button"
            >
              Start
              <FiArrowRight />
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}

export default SubjectDetails;