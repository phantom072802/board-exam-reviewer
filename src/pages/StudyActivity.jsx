import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  FiArrowLeft,
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";

import api from "../services/api";

function StudyActivity() {
  // ========================================
  // STATE
  // ========================================

  const [activity, setActivity] = useState([]);
  const [streaks, setStreaks] = useState(null);

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [selectedDate, setSelectedDate] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // LOAD ACTIVITY
  // ========================================

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          activityResponse,
          streakResponse,
        ] = await Promise.all([
          api.get("/study-activity"),
          api.get("/streaks"),
        ]);

        setActivity(
          activityResponse.data?.data || []
        );

        setStreaks(
          streakResponse.data?.data || null
        );
      } catch (err) {
        console.error(
          "Study activity loading error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load study activity."
        );
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, []);

  // ========================================
  // ACTIVITY MAP
  // ========================================

  const activityMap = useMemo(() => {
    const map = new Map();

    activity.forEach((item) => {
      map.set(
        item.date,
        Number(
          item.questions_answered
        ) || 0
      );
    });

    return map;
  }, [activity]);

  // ========================================
  // DATE HELPERS
  // ========================================

  const formatDate = (date) => {
    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const createDate = (
    year,
    month,
    day
  ) => {
    return new Date(
      year,
      month,
      day
    );
  };

  // ========================================
  // CURRENT MONTH
  // ========================================

  const currentYear =
    currentDate.getFullYear();

  const currentMonth =
    currentDate.getMonth();

  const monthName =
    currentDate.toLocaleDateString(
      "en-US",
      {
        month: "long",
      }
    );

  const firstDayOfMonth =
    createDate(
      currentYear,
      currentMonth,
      1
    );

  const lastDayOfMonth =
    createDate(
      currentYear,
      currentMonth + 1,
      0
    );

  const daysInMonth =
    lastDayOfMonth.getDate();

  const startingDay =
    firstDayOfMonth.getDay();

  // ========================================
  // CALENDAR DAYS
  // ========================================

  const calendarDays = [];

  // Empty cells before month starts
  for (
    let index = 0;
    index < startingDay;
    index++
  ) {
    calendarDays.push(null);
  }

  // Actual month days
  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    calendarDays.push(
      createDate(
        currentYear,
        currentMonth,
        day
      )
    );
  }

  // ========================================
  // TODAY
  // ========================================

  const todayString =
    formatDate(new Date());

  // ========================================
  // ACTIVITY TOTALS
  // ========================================

  const totalQuestions =
    activity.reduce(
      (sum, item) =>
        sum +
        (
          Number(
            item.questions_answered
          ) || 0
        ),
      0
    );

  const studyDays =
    Number(
      streaks?.study_days
    ) || activity.length;

  const currentStreak =
    Number(
      streaks?.current_streak
    ) || 0;

  const longestStreak =
    Number(
      streaks?.longest_streak
    ) || 0;

  const questionsToday =
    Number(
      streaks?.questions_today
    ) || 0;

  // ========================================
  // MONTHLY TOTAL
  // ========================================

  const monthlyQuestions =
    calendarDays.reduce(
      (sum, date) => {
        if (!date) {
          return sum;
        }

        const dateString =
          formatDate(date);

        return (
          sum +
          (
            activityMap.get(
              dateString
            ) || 0
          )
        );
      },
      0
    );

  const monthlyStudyDays =
    calendarDays.reduce(
      (count, date) => {
        if (!date) {
          return count;
        }

        const dateString =
          formatDate(date);

        return activityMap.has(
          dateString
        )
          ? count + 1
          : count;
      },
      0
    );

  // ========================================
  // MONTH NAVIGATION
  // ========================================

  const goToPreviousMonth =
    () => {
      setCurrentDate(
        new Date(
          currentYear,
          currentMonth - 1,
          1
        )
      );

      setSelectedDate(null);
    };

  const goToNextMonth =
    () => {
      setCurrentDate(
        new Date(
          currentYear,
          currentMonth + 1,
          1
        )
      );

      setSelectedDate(null);
    };

  const goToCurrentMonth =
    () => {
      const today = new Date();

      setCurrentDate(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        )
      );

      setSelectedDate(
        todayString
      );
    };

  // ========================================
  // SELECT DATE
  // ========================================

  const handleSelectDate =
    (date) => {
      if (!date) {
        return;
      }

      setSelectedDate(
        formatDate(date)
      );
    };

  // ========================================
  // SELECTED DAY
  // ========================================

  const selectedQuestions =
    selectedDate
      ? activityMap.get(
          selectedDate
        ) || 0
      : 0;

  const selectedDateObject =
    selectedDate
      ? new Date(
          `${selectedDate}T00:00:00`
        )
      : null;

  const selectedDateLabel =
    selectedDateObject
      ? selectedDateObject.toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        )
      : "Select a date";

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="study-activity-page">

        <div className="study-activity-loading">

          <div className="study-activity-loading-icon">
            <FiCalendar />
          </div>

          <p>
            Loading study activity...
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
      <div className="study-activity-page">

        <div className="study-activity-error">

          <FiCalendar />

          <h2>
            Unable to load activity
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="study-activity-primary-button"
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
    <div className="study-activity-page">

      {/* ==================================
          PAGE HEADER
      ================================== */}

      <section className="study-activity-header">

        <div>

          <p className="study-activity-eyebrow">
            STUDY HABIT
          </p>

          <h1>
            Study Activity
          </h1>

          <p>
            Review your study history and
            keep track of your consistency.
          </p>

        </div>

        <Link
          to="/dashboard"
          className="study-activity-back-button"
        >
          <FiArrowLeft />

          Dashboard
        </Link>

      </section>


      {/* ==================================
          SUMMARY CARDS
      ================================== */}

      <section className="study-activity-stats">

        {/* TOTAL QUESTIONS */}

        <div className="study-activity-stat-card">

          <div className="study-activity-stat-icon">
            <FiBookOpen />
          </div>

          <div>

            <span>
              Questions Answered
            </span>

            <strong>
              {totalQuestions}
            </strong>

          </div>

        </div>


        {/* STUDY DAYS */}

        <div className="study-activity-stat-card">

          <div className="study-activity-stat-icon">
            <FiCalendar />
          </div>

          <div>

            <span>
              Study Days
            </span>

            <strong>
              {studyDays}
            </strong>

          </div>

        </div>


        {/* CURRENT STREAK */}

        <div className="study-activity-stat-card">

          <div className="study-activity-stat-icon">
            <FiTrendingUp />
          </div>

          <div>

            <span>
              Current Streak
            </span>

            <strong>
              {currentStreak}{" "}
              {currentStreak === 1
                ? "day"
                : "days"}
            </strong>

          </div>

        </div>


        {/* LONGEST STREAK */}

        <div className="study-activity-stat-card">

          <div className="study-activity-stat-icon">
            <FiTarget />
          </div>

          <div>

            <span>
              Longest Streak
            </span>

            <strong>
              {longestStreak}{" "}
              {longestStreak === 1
                ? "day"
                : "days"}
            </strong>

          </div>

        </div>

      </section>


      {/* ==================================
          CALENDAR + DETAILS
      ================================== */}

      <section className="study-activity-main-grid">

        {/* CALENDAR */}

        <div className="study-activity-card">

          <div className="study-activity-card-header">

            <div>

              <p className="study-activity-section-label">
                ACTIVITY CALENDAR
              </p>

              <h2>
                {monthName}{" "}
                {currentYear}
              </h2>

            </div>


            <div className="study-activity-calendar-actions">

              <button
                type="button"
                onClick={
                  goToPreviousMonth
                }
                aria-label="Previous month"
              >
                <FiArrowLeft />
              </button>

              <button
                type="button"
                onClick={
                  goToCurrentMonth
                }
              >
                Today
              </button>

              <button
                type="button"
                onClick={
                  goToNextMonth
                }
                aria-label="Next month"
              >
                <FiArrowRight />
              </button>

            </div>

          </div>


          {/* MONTH SUMMARY */}

          <div className="study-activity-month-summary">

            <div>

              <span>
                This Month
              </span>

              <strong>
                {monthlyQuestions}
              </strong>

              <small>
                questions answered
              </small>

            </div>


            <div>

              <span>
                Active Days
              </span>

              <strong>
                {monthlyStudyDays}
              </strong>

              <small>
                study days
              </small>

            </div>

          </div>


          {/* CALENDAR */}

          <div className="study-calendar">

            {/* WEEKDAYS */}

            <div className="study-calendar-weekdays">

              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map(
                (day) => (
                  <div
                    key={day}
                    className="study-calendar-weekday"
                  >
                    {day}
                  </div>
                )
              )}

            </div>


            {/* DAYS */}

            <div className="study-calendar-grid">

              {calendarDays.map(
                (date, index) => {

                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="study-calendar-empty"
                      />
                    );
                  }

                  const dateString =
                    formatDate(date);

                  const questions =
                    activityMap.get(
                      dateString
                    ) || 0;

                  const isToday =
                    dateString ===
                    todayString;

                  const isSelected =
                    dateString ===
                    selectedDate;

                  return (
                    <button
                      type="button"
                      key={dateString}
                      className={[
                        "study-calendar-day",
                        questions > 0
                          ? "has-activity"
                          : "",
                        isToday
                          ? "today"
                          : "",
                        isSelected
                          ? "selected"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        handleSelectDate(
                          date
                        )
                      }
                      title={
                        questions > 0
                          ? `${questions} questions answered`
                          : "No activity"
                      }
                    >

                      <span className="study-calendar-day-number">
                        {date.getDate()}
                      </span>

                      <span
                        className={
                          questions > 0
                            ? "study-calendar-activity active"
                            : "study-calendar-activity"
                        }
                      />

                      {questions > 0 && (
                        <small>
                          {questions}
                        </small>
                      )}

                    </button>
                  );
                }
              )}

            </div>


            {/* LEGEND */}

            <div className="study-calendar-legend">

              <span>

                <i className="study-calendar-legend-dot active" />

                Studied

              </span>

              <span>

                <i className="study-calendar-legend-dot" />

                No activity

              </span>

              <span>

                <i className="study-calendar-legend-today" />

                Today

              </span>

            </div>

          </div>

        </div>


        {/* SELECTED DAY */}

        <div className="study-activity-card study-activity-details-card">

          <div className="study-activity-card-header">

            <div>

              <p className="study-activity-section-label">
                DAILY ACTIVITY
              </p>

              <h2>
                {selectedDate
                  ? selectedDateLabel
                  : "Select a Date"}
              </h2>

            </div>

            <FiClock />

          </div>


          {selectedDate ? (

            <div className="study-activity-day-details">

              <div className="study-activity-day-icon">

                {selectedQuestions > 0 ? (
                  <FiCheckCircle />
                ) : (
                  <FiClock />
                )}

              </div>


              <strong>
                {selectedQuestions}
              </strong>


              <span>
                {selectedQuestions === 1
                  ? "question answered"
                  : "questions answered"}
              </span>


              {selectedQuestions > 0 ? (

                <p>
                  Great work! You studied
                  on this day.
                </p>

              ) : (

                <p>
                  No study activity was
                  recorded on this date.
                </p>

              )}

            </div>

          ) : (

            <div className="study-activity-empty-details">

              <FiCalendar />

              <h3>
                Choose a date
              </h3>

              <p>
                Select a day from the calendar
                to view your study activity.
              </p>

            </div>

          )}

        </div>

      </section>


      {/* ==================================
          TODAY
      ================================== */}

      <section className="study-activity-today-card">

        <div className="study-activity-today-icon">
          <FiBookOpen />
        </div>

        <div>

          <p>
            TODAY'S ACTIVITY
          </p>

          <h2>
            {questionsToday}{" "}
            {questionsToday === 1
              ? "question"
              : "questions"}{" "}
            answered today
          </h2>

          <span>
            {questionsToday > 0
              ? "Keep going to maintain your study streak."
              : "Complete a practice session or mock exam to start today's activity."}
          </span>

        </div>


        <Link
          to="/practice"
          className="study-activity-primary-button"
        >
          Practice Now

          <FiArrowRight />
        </Link>

      </section>

    </div>
  );
}

export default StudyActivity;