const express = require("express");
const pool = require("../config/database");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET STUDY STREAK
|--------------------------------------------------------------------------
| GET /api/streaks
|--------------------------------------------------------------------------
*/

router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    /*
    |--------------------------------------------------------------------------
    | Get Activity
    |--------------------------------------------------------------------------
    */

    const result = await pool.query(
      `
      SELECT
        activity_date,
        questions_answered
      FROM study_activity
      WHERE user_id = $1
        AND questions_answered > 0
      ORDER BY activity_date ASC
      `,
      [userId]
    );

    const activity = result.rows.map(
      (row) => ({
        date: String(
          row.activity_date
        ).slice(0, 10),

        questions_answered:
          Number(
            row.questions_answered
          ) || 0,
      })
    );

    /*
    |--------------------------------------------------------------------------
    | Empty Activity
    |--------------------------------------------------------------------------
    */

    if (activity.length === 0) {
      return res.json({
        success: true,

        data: {
          current_streak: 0,
          longest_streak: 0,
          study_days: 0,
          questions_today: 0,
          weekly_activity: [],
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Date Helpers
    |--------------------------------------------------------------------------
    */

    const parseDate = (dateString) => {
      const [year, month, day] =
        dateString
          .split("-")
          .map(Number);

      return new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );
    };

    const formatDate = (date) => {
      return date
        .toISOString()
        .slice(0, 10);
    };

    const addDays = (
      date,
      amount
    ) => {
      const result =
        new Date(date);

      result.setUTCDate(
        result.getUTCDate() +
          amount
      );

      return result;
    };

    /*
    |--------------------------------------------------------------------------
    | Activity Map
    |--------------------------------------------------------------------------
    */

    const activityMap =
      new Map();

    activity.forEach(
      (item) => {
        activityMap.set(
          item.date,
          item.questions_answered
        );
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Current Date
    |--------------------------------------------------------------------------
    */

    const today = new Date();

    const todayString =
      formatDate(today);

    /*
    |--------------------------------------------------------------------------
    | Questions Today
    |--------------------------------------------------------------------------
    */

    const questionsToday =
      activityMap.get(
        todayString
      ) || 0;

    /*
    |--------------------------------------------------------------------------
    | Current Streak
    |--------------------------------------------------------------------------
    |
    | If the user studied today:
    | today counts as day 1.
    |
    | If the user did not study today:
    | we allow yesterday to be the
    | latest active day.
    |
    */

    let currentStreak = 0;

    const yesterday =
      formatDate(
        addDays(today, -1)
      );

    let streakDate = null;

    if (
      activityMap.has(
        todayString
      )
    ) {
      streakDate =
        parseDate(
          todayString
        );
    } else if (
      activityMap.has(
        yesterday
      )
    ) {
      streakDate =
        parseDate(
          yesterday
        );
    }

    if (streakDate) {
      while (true) {
        const dateString =
          formatDate(
            streakDate
          );

        if (
          !activityMap.has(
            dateString
          )
        ) {
          break;
        }

        currentStreak++;

        streakDate =
          addDays(
            streakDate,
            -1
          );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Longest Streak
    |--------------------------------------------------------------------------
    */

    let longestStreak = 0;
    let runningStreak = 0;
    let previousDate = null;

    for (
      const item of activity
    ) {
      const currentDate =
        parseDate(
          item.date
        );

      if (
        previousDate === null
      ) {
        runningStreak = 1;
      } else {
        const expectedDate =
          addDays(
            previousDate,
            1
          );

        if (
          formatDate(
            expectedDate
          ) === item.date
        ) {
          runningStreak++;
        } else {
          runningStreak = 1;
        }
      }

      longestStreak =
        Math.max(
          longestStreak,
          runningStreak
        );

      previousDate =
        currentDate;
    }

    /*
    |--------------------------------------------------------------------------
    | Total Study Days
    |--------------------------------------------------------------------------
    */

    const studyDays =
      activity.length;

    /*
    |--------------------------------------------------------------------------
    | Weekly Activity
    |--------------------------------------------------------------------------
    */

    const weeklyActivity = [];

    for (
      let index = 6;
      index >= 0;
      index--
    ) {
      const date =
        addDays(
          today,
          -index
        );

      const dateString =
        formatDate(date);

      weeklyActivity.push({
        date: dateString,

        day:
          date.toLocaleDateString(
            "en-US",
            {
              weekday: "short",
            }
          ),

        questions_answered:
          activityMap.get(
            dateString
          ) || 0,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    res.json({
      success: true,

      data: {
        current_streak:
          currentStreak,

        longest_streak:
          longestStreak,

        study_days:
          studyDays,

        questions_today:
          questionsToday,

        weekly_activity:
          weeklyActivity,
      },
    });
  } catch (error) {
    console.error(
      "Get study streak error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to retrieve study streak.",
    });
  }
});

module.exports = router;