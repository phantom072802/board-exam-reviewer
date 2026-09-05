import { useEffect, useState } from "react";
import {
  FiTarget,
  FiCheckCircle,
  FiXCircle,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";

import api from "../services/api";

function StudyGoals() {
  const [goal, setGoal] = useState(null);
  const [progress, setProgress] = useState(null);
  const [goals, setGoals] = useState([]);
  const [streaks, setStreaks] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    target_questions: 100,
    target_accuracy: 80,
    start_date: "",
    end_date: "",
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD GOALS
  |--------------------------------------------------------------------------
  */

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        goalsResponse,
        progressResponse,
        streakResponse,
      ] = await Promise.all([
        api.get("/goals"),
        api.get("/goals/progress"),
        api.get("/streaks"),
      ]);

      const goalList =
        goalsResponse.data?.data || [];

      const progressData =
        progressResponse.data?.data || {};

      const streakData =
        streakResponse.data?.data || null;

      setStreaks(streakData);

      /*
      |--------------------------------------------------------------------------
      | SAVE GOALS
      |--------------------------------------------------------------------------
      */

      setGoals(goalList);

      /*
      |--------------------------------------------------------------------------
      | SAVE ACTIVE GOAL
      |--------------------------------------------------------------------------
      */

      setGoal(
        progressData.goal || null
      );

      /*
      |--------------------------------------------------------------------------
      | SAVE PROGRESS + BREAKDOWN
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      | The backend returns:
      |
      | data: {
      |   goal: {},
      |   progress: {},
      |   breakdown: {}
      | }
      |
      | So breakdown must be manually included
      | inside the progress state used by this page.
      |
      */

      setProgress({
        ...(progressData.progress || {}),

        breakdown:
          progressData.breakdown || {
            practice: {
              questions_answered: 0,
              correct_answers: 0,
              incorrect_answers: 0,
            },

            mock_exam: {
              questions_answered: 0,
              correct_answers: 0,
              incorrect_answers: 0,
            },
          },
      });
    } catch (err) {
      console.error(
        "Load study goals error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load study goals."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FORM HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN CREATE FORM
  |--------------------------------------------------------------------------
  */

  const openCreateForm = () => {
    setEditing(false);

    setForm({
      target_questions: 100,
      target_accuracy: 80,
      start_date: "",
      end_date: "",
    });

    setShowForm(true);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT FORM
  |--------------------------------------------------------------------------
  */

  const openEditForm = () => {
    if (!goal) {
      return;
    }

    setEditing(true);

    setForm({
      target_questions:
        goal.target_questions || 100,

      target_accuracy:
        goal.target_accuracy || 80,

      start_date:
        goal.start_date
          ? String(
              goal.start_date
            ).slice(0, 10)
          : "",

      end_date:
        goal.end_date
          ? String(
              goal.end_date
            ).slice(0, 10)
          : "",
    });

    setShowForm(true);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE FORM
  |--------------------------------------------------------------------------
  */

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditing(false);
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE GOAL
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = {
        target_questions:
          Number(
            form.target_questions
          ),

        target_accuracy:
          Number(
            form.target_accuracy
          ),

        start_date:
          form.start_date || null,

        end_date:
          form.end_date || null,
      };

      if (
        editing &&
        goal
      ) {
        await api.put(
          `/goals/${goal.id}`,
          payload
        );
      } else {
        await api.post(
          "/goals",
          payload
        );
      }

      setShowForm(false);
      setEditing(false);

      await loadGoals();
    } catch (err) {
      console.error(
        "Save study goal error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save study goal."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL GOAL
  |--------------------------------------------------------------------------
  */

  const handleCancelGoal = async () => {
    if (!goal) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to cancel your current study goal?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put(
        `/goals/${goal.id}`,
        {
          target_questions:
            Number(
              goal.target_questions
            ),

          target_accuracy:
            Number(
              goal.target_accuracy
            ),

          start_date:
            goal.start_date ||
            null,

          end_date:
            goal.end_date ||
            null,

          status: "cancelled",
        }
      );

      await loadGoals();
    } catch (err) {
      console.error(
        "Cancel study goal error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to cancel study goal."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE GOAL
  |--------------------------------------------------------------------------
  */

  const handleDeleteGoal = async (
    goalId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete this goal?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.delete(
        `/goals/${goalId}`
      );

      await loadGoals();
    } catch (err) {
      console.error(
        "Delete study goal error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete study goal."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) {
      return "No end date";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "No end date";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="study-goals-page">
        <div className="study-goals-loading">
          <FiRefreshCw className="spin" />

          <span>
            Loading study goals...
          </span>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DERIVED VALUES
  |--------------------------------------------------------------------------
  */

  const questionsAnswered =
    Number(
      progress?.questions_answered
    ) || 0;

  const questionsRemaining =
    Number(
      progress?.questions_remaining
    ) || 0;

  const questionProgress =
    Number(
      progress?.question_progress
    ) || 0;

  const correctAnswers =
    Number(
      progress?.correct_answers
    ) || 0;

  const incorrectAnswers =
    Number(
      progress?.incorrect_answers
    ) || 0;

  const accuracy =
    Number(
      progress?.accuracy
    ) || 0;

  const targetAccuracy =
    Number(
      progress?.accuracy_target
    ) || 0;

  const accuracyProgress =
    Number(
      progress?.accuracy_progress
    ) || 0;

  /*
  |--------------------------------------------------------------------------
  | BREAKDOWN VALUES
  |--------------------------------------------------------------------------
  */

  const practiceAnswered =
    Number(
      progress?.breakdown
        ?.practice
        ?.questions_answered
    ) || 0;

  const practiceCorrect =
    Number(
      progress?.breakdown
        ?.practice
        ?.correct_answers
    ) || 0;

  const practiceIncorrect =
    Number(
      progress?.breakdown
        ?.practice
        ?.incorrect_answers
    ) || 0;

  const mockAnswered =
    Number(
      progress?.breakdown
        ?.mock_exam
        ?.questions_answered
    ) || 0;

  const mockCorrect =
    Number(
      progress?.breakdown
        ?.mock_exam
        ?.correct_answers
    ) || 0;

  const mockIncorrect =
    Number(
      progress?.breakdown
        ?.mock_exam
        ?.incorrect_answers
    ) || 0;

  /*
  |--------------------------------------------------------------------------
  | GOAL COMPLETION
  |--------------------------------------------------------------------------
  */

  const goalCompleted =
    progress?.completed === true;

  /*
  |--------------------------------------------------------------------------
  | STREAK VALUES
  |--------------------------------------------------------------------------
  */

  const currentStreak =
    Number(streaks?.current_streak) || 0;

  const longestStreak =
    Number(streaks?.longest_streak) || 0;

  const studyDays =
    Number(streaks?.study_days) || 0;

  const questionsToday =
    Number(streaks?.questions_today) || 0;

  const weeklyActivity =
    streaks?.weekly_activity || [];

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="study-goals-page">

      {/* =========================================================
          PAGE HEADER
      ========================================================= */}

      <div className="study-goals-header">

        <div>
          <span className="study-goals-eyebrow">
            PERSONAL STUDY PLAN
          </span>

          <h1>
            Study Goals
          </h1>

          <p>
            Set a target and track your
            progress as you prepare for
            your board exam.
          </p>
        </div>

        {!goal && (
          <button
            type="button"
            className="primary-button"
            onClick={
              openCreateForm
            }
          >
            <FiPlus />

            Create Goal
          </button>
        )}

      </div>

      {/* =========================================================
          ERROR
      ========================================================= */}

      {error && (
        <div className="study-goals-error">

          <FiXCircle />

          <span>
            {error}
          </span>

        </div>
      )}

      {/* =========================================================
          CREATE / EDIT FORM
      ========================================================= */}

      {showForm && (
        <div className="study-goal-form-card">

          <div className="study-goal-form-header">

            <div>

              <span className="study-goals-eyebrow">
                {editing
                  ? "UPDATE GOAL"
                  : "NEW GOAL"}
              </span>

              <h2>
                {editing
                  ? "Edit Study Goal"
                  : "Create Study Goal"}
              </h2>

            </div>

          </div>

          <form
            className="study-goal-form"
            onSubmit={
              handleSubmit
            }
          >

            <div className="study-goal-form-grid">

              {/* TARGET QUESTIONS */}

              <div className="form-group">

                <label htmlFor="target_questions">
                  Target Questions
                </label>

                <input
                  id="target_questions"
                  name="target_questions"
                  type="number"
                  min="1"
                  required
                  value={
                    form.target_questions
                  }
                  onChange={
                    handleChange
                  }
                />

                <small>
                  Number of questions you
                  want to answer.
                </small>

              </div>

              {/* TARGET ACCURACY */}

              <div className="form-group">

                <label htmlFor="target_accuracy">
                  Target Accuracy
                </label>

                <div className="study-goal-input-with-suffix">

                  <input
                    id="target_accuracy"
                    name="target_accuracy"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={
                      form.target_accuracy
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>
                    %
                  </span>

                </div>

                <small>
                  Accuracy percentage you
                  want to achieve.
                </small>

              </div>

              {/* START DATE */}

              <div className="form-group">

                <label htmlFor="start_date">
                  Start Date
                </label>

                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={
                    form.start_date
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* END DATE */}

              <div className="form-group">

                <label htmlFor="end_date">
                  End Date
                </label>

                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={
                    form.end_date
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>

            <div className="study-goal-form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  closeForm
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editing
                  ? "Save Changes"
                  : "Create Goal"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =========================================================
          NO ACTIVE GOAL
      ========================================================= */}

      {!goal &&
        !showForm && (
          <div className="study-goal-empty">

            <div className="study-goal-empty-icon">
              <FiTarget />
            </div>

            <h2>
              Set Your Study Goal
            </h2>

            <p>
              Create a personalized target
              for the number of questions
              you want to answer and the
              accuracy you want to achieve.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                openCreateForm
              }
            >
              <FiPlus />

              Create Your First Goal
            </button>

          </div>
        )}

      {/* =========================================================
          ACTIVE GOAL
      ========================================================= */}

      {goal && (
        <>

          {/* =====================================================
              GOAL OVERVIEW
          ===================================================== */}

          <div className="study-goal-main-card">

            <div className="study-goal-main-header">

              <div className="study-goal-title">

                <div className="study-goal-icon">
                  <FiTarget />
                </div>

                <div>

                  <span className="study-goals-eyebrow">
                    ACTIVE GOAL
                  </span>

                  <h2>
                    Your Study Goal
                  </h2>

                </div>

              </div>

              <div className="study-goal-actions">

                <button
                  type="button"
                  className="icon-button"
                  onClick={
                    openEditForm
                  }
                  disabled={saving}
                  title="Edit goal"
                >
                  <FiEdit3 />
                </button>

                <button
                  type="button"
                  className="icon-button danger"
                  onClick={
                    handleCancelGoal
                  }
                  disabled={saving}
                  title="Cancel goal"
                >
                  <FiXCircle />
                </button>

              </div>

            </div>

            {/* =================================================
                COMPLETION MESSAGE
            ================================================= */}

            {goalCompleted && (
              <div className="study-goal-completed">

                <FiCheckCircle />

                <div>
                  <strong>
                    Goal Completed!
                  </strong>

                  <span>
                    You reached both your
                    question and accuracy
                    targets.
                  </span>
                </div>

              </div>
            )}

            {/* =================================================
                QUESTION PROGRESS
            ================================================= */}

            <div className="study-goal-progress-section">

              <div className="study-goal-progress-header">

                <div>

                  <span>
                    Questions Answered
                  </span>

                  <strong>
                    {questionsAnswered}
                    {" "}
                    /
                    {" "}
                    {goal.target_questions}
                  </strong>

                </div>

                <strong>
                  {questionProgress.toFixed(
                    0
                  )}
                  %
                </strong>

              </div>

              <div className="study-goal-progress-track">

                <div
                  className="study-goal-progress-fill"
                  style={{
                    width: `${Math.min(
                      questionProgress,
                      100
                    )}%`,
                  }}
                />

              </div>

              <div className="study-goal-progress-footer">

                <span>
                  {questionsRemaining > 0
                    ? `${questionsRemaining} questions remaining`
                    : "Question target reached"}
                </span>

                <span>
                  Target:{" "}
                  {goal.target_questions}
                </span>

              </div>

            </div>

            {/* =================================================
                STAT GRID
            ================================================= */}

            <div className="study-goal-stat-grid">

              {/* CORRECT */}

              <div className="study-goal-stat">

                <div className="study-goal-stat-icon">
                  <FiCheckCircle />
                </div>

                <span>
                  Correct Answers
                </span>

                <strong>
                  {correctAnswers}
                </strong>

              </div>

              {/* INCORRECT */}

              <div className="study-goal-stat">

                <div className="study-goal-stat-icon danger">
                  <FiXCircle />
                </div>

                <span>
                  Incorrect Answers
                </span>

                <strong>
                  {incorrectAnswers}
                </strong>

              </div>

              {/* ACCURACY */}

              <div className="study-goal-stat">

                <div className="study-goal-stat-icon">
                  <FiTarget />
                </div>

                <span>
                  Current Accuracy
                </span>

                <strong>
                  {accuracy.toFixed(
                    2
                  )}
                  %
                </strong>

              </div>

              {/* END DATE */}

              <div className="study-goal-stat">

                <div className="study-goal-stat-icon">
                  <FiCalendar />
                </div>

                <span>
                  End Date
                </span>

                <strong className="date-value">
                  {formatDate(
                    goal.end_date
                  )}
                </strong>

              </div>

            </div>

            {/* =================================================
                ACCURACY
            ================================================= */}

            <div className="study-goal-accuracy">

              <div className="study-goal-accuracy-header">

                <div>

                  <span>
                    Accuracy Target
                  </span>

                  <strong>
                    {accuracy.toFixed(
                      2
                    )}
                    %
                  </strong>

                </div>

                <span>
                  Target{" "}
                  {targetAccuracy.toFixed(
                    0
                  )}
                  %
                </span>

              </div>

              <div className="study-goal-progress-track">

                <div
                  className="study-goal-accuracy-fill"
                  style={{
                    width: `${Math.min(
                      accuracyProgress,
                      100
                    )}%`,
                  }}
                />

              </div>

              <div className="study-goal-progress-footer">

                <span>
                  {accuracy >=
                  targetAccuracy
                    ? "Accuracy target reached"
                    : `${Math.max(
                        targetAccuracy -
                          accuracy,
                        0
                      ).toFixed(
                        2
                      )}% more needed`}
                </span>

                <span>
                  {accuracyProgress.toFixed(
                    0
                  )}
                  % of target
                </span>

              </div>

            </div>

          </div>

          {/* =====================================================
              STUDY STREAK
          ===================================================== */}

          <div className="study-goal-streak-card">

            <div className="study-goal-streak-header">

              <div>

                <span className="study-goals-eyebrow">
                  STUDY HABIT
                </span>

                <h2>
                  Study Streak
                </h2>

                <p>
                  Your consistency supports your
                  progress toward this goal.
                </p>

              </div>

              <div className="study-goal-streak-icon">
                🔥
              </div>

            </div>


            <div className="study-goal-streak-grid">

              <div className="study-goal-streak-current">

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


              <div className="study-goal-streak-stat">

                <FiTrendingUp />

                <span>
                  Longest Streak
                </span>

                <strong>
                  {longestStreak} days
                </strong>

              </div>


              <div className="study-goal-streak-stat">

                <FiCalendar />

                <span>
                  Study Days
                </span>

                <strong>
                  {studyDays}
                </strong>

              </div>


              <div className="study-goal-streak-stat">

                <FiCheckCircle />

                <span>
                  Questions Today
                </span>

                <strong>
                  {questionsToday}
                </strong>

              </div>

            </div>


            <div className="study-goal-weekly-activity">

              <div className="study-goal-weekly-header">

                <span>
                  Last 7 Days
                </span>

                <span>
                  Questions
                </span>

              </div>


              <div className="study-goal-weekly-days">

                {weeklyActivity.length > 0 ? (
                  weeklyActivity.map((day) => (
                    <div
                      key={day.date}
                      className="study-goal-weekly-day"
                    >

                      <span>
                        {day.day}
                      </span>

                      <div
                        className={
                          day.questions_answered > 0
                            ? "study-goal-activity-dot active"
                            : "study-goal-activity-dot"
                        }
                        title={`${day.questions_answered} questions`}
                      />

                      <strong>
                        {day.questions_answered}
                      </strong>

                    </div>
                  ))
                ) : (
                  <p>
                    No activity recorded yet.
                  </p>
                )}

              </div>

            </div>

          </div>

          {/* =====================================================
              BREAKDOWN
          ===================================================== */}

          <div className="study-goal-breakdown">

            <div className="section-heading">

              <div>

                <span className="study-goals-eyebrow">
                  PROGRESS BREAKDOWN
                </span>

                <h2>
                  Where Your Progress Comes From
                </h2>

              </div>

            </div>

            <div className="study-goal-breakdown-grid">

              {/* =================================================
                  PRACTICE
              ================================================= */}

              <div className="study-goal-breakdown-card">

                <div className="study-goal-breakdown-header">

                  <span>
                    Practice
                  </span>

                  <strong>
                    {practiceAnswered}
                  </strong>

                </div>

                <p>
                  Questions answered
                </p>

                {/* EXTRA BREAKDOWN */}

                <div className="study-goal-breakdown-details">

                  <span>
                    <strong>
                      {practiceCorrect}
                    </strong>
                    {" "}
                    correct
                  </span>

                  <span>
                    <strong>
                      {practiceIncorrect}
                    </strong>
                    {" "}
                    incorrect
                  </span>

                </div>

              </div>

              {/* =================================================
                  MOCK EXAMS
              ================================================= */}

              <div className="study-goal-breakdown-card">

                <div className="study-goal-breakdown-header">

                  <span>
                    Mock Exams
                  </span>

                  <strong>
                    {mockAnswered}
                  </strong>

                </div>

                <p>
                  Questions answered
                </p>

                {/* EXTRA BREAKDOWN */}

                <div className="study-goal-breakdown-details">

                  <span>
                    <strong>
                      {mockCorrect}
                    </strong>
                    {" "}
                    correct
                  </span>

                  <span>
                    <strong>
                      {mockIncorrect}
                    </strong>
                    {" "}
                    incorrect
                  </span>

                </div>

              </div>

            </div>

          </div>

        </>
      )}

      {/* =========================================================
          GOAL HISTORY
      ========================================================= */}

      {goals.length > 0 && (
        <div className="study-goal-history">

          <div className="section-heading">

            <div>

              <span className="study-goals-eyebrow">
                HISTORY
              </span>

              <h2>
                Previous Goals
              </h2>

            </div>

          </div>

          <div className="study-goal-history-list">

            {goals
              .filter(
                (item) =>
                  !goal ||
                  item.id !== goal.id
              )
              .map((item) => (
                <div
                  className="study-goal-history-card"
                  key={item.id}
                >

                  <div className="study-goal-history-info">

                    <div className="study-goal-history-icon">
                      <FiTarget />
                    </div>

                    <div>

                      <strong>
                        {item.target_questions}
                        {" "}
                        Questions
                      </strong>

                      <span>
                        Target Accuracy:{" "}
                        {Number(
                          item.target_accuracy
                        ).toFixed(
                          0
                        )}
                        %
                      </span>

                      <small>
                        {formatDate(
                          item.start_date
                        )}
                        {" "}
                        —
                        {" "}
                        {formatDate(
                          item.end_date
                        )}
                      </small>

                    </div>

                  </div>

                  <div className="study-goal-history-right">

                    <span
                      className={`study-goal-status ${item.status}`}
                    >
                      {item.status}
                    </span>

                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() =>
                        handleDeleteGoal(
                          item.id
                        )
                      }
                      disabled={saving}
                      title="Delete goal"
                    >
                      <FiTrash2 />
                    </button>

                  </div>

                </div>
              ))}

          </div>

        </div>
      )}

    </div>
  );
}

export default StudyGoals;