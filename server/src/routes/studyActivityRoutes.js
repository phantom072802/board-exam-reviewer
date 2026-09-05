const express = require("express");
const pool = require("../config/database");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/*
========================================
GET STUDY ACTIVITY
========================================
*/

router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        activity_date,
        questions_answered
      FROM study_activity
      WHERE user_id = $1
      ORDER BY activity_date DESC
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

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error(
      "Get study activity error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to retrieve study activity.",
    });
  }
});

module.exports = router;