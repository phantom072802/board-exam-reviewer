const express = require("express");
const pool = require("../config/database");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// GET USER BOOKMARKS
// ========================================

router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.question_id,
        b.created_at,

        q.question_text,
        q.explanation,
        q.difficulty,

        t.id AS topic_id,
        t.name AS topic_name,

        s.id AS subject_id,
        s.name AS subject_name

      FROM bookmarks b

      JOIN questions q
        ON b.question_id = q.id

      JOIN topics t
        ON q.topic_id = t.id

      JOIN subjects s
        ON t.subject_id = s.id

      WHERE b.user_id = $1

      ORDER BY b.created_at DESC;
      `,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error(
      "Get bookmarks error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to retrieve bookmarks.",
    });
  }
});


// ========================================
// CHECK IF QUESTION IS BOOKMARKED
// ========================================

router.get(
  "/question/:questionId",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const questionId =
        req.params.questionId;

      const result = await pool.query(
        `
        SELECT id
        FROM bookmarks

        WHERE user_id = $1
          AND question_id = $2
        `,
        [
          userId,
          questionId,
        ]
      );

      res.json({
        success: true,
        bookmarked:
          result.rows.length > 0,
      });

    } catch (error) {
      console.error(
        "Check bookmark error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to check bookmark.",
      });
    }
  }
);


// ========================================
// ADD BOOKMARK
// ========================================

router.post(
  "/:questionId",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const questionId =
        req.params.questionId;

      // Check question exists
      const questionResult =
        await pool.query(
          `
          SELECT id
          FROM questions
          WHERE id = $1
          `,
          [questionId]
        );

      if (
        questionResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found.",
        });
      }

      // Add bookmark
      const result = await pool.query(
        `
        INSERT INTO bookmarks (
          user_id,
          question_id
        )

        VALUES ($1, $2)

        ON CONFLICT (
          user_id,
          question_id
        )

        DO NOTHING

        RETURNING *;
        `,
        [
          userId,
          questionId,
        ]
      );

      res.status(201).json({
        success: true,
        bookmarked: true,
        data:
          result.rows[0] || null,
      });

    } catch (error) {
      console.error(
        "Add bookmark error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to add bookmark.",
      });
    }
  }
);


// ========================================
// REMOVE BOOKMARK
// ========================================

router.delete(
  "/:questionId",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const questionId =
        req.params.questionId;

      await pool.query(
        `
        DELETE FROM bookmarks

        WHERE user_id = $1
          AND question_id = $2
        `,
        [
          userId,
          questionId,
        ]
      );

      res.json({
        success: true,
        bookmarked: false,
        message:
          "Bookmark removed.",
      });

    } catch (error) {
      console.error(
        "Remove bookmark error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to remove bookmark.",
      });
    }
  }
);


module.exports = router;