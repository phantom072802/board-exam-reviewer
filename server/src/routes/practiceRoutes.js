const express = require("express");
const pool = require("../config/database");
const { protect } = require("../middleware/authMiddleware");

const {
  recordStudyActivity,
} = require("../utils/studyActivity");

const router = express.Router();


// ========================================
// START PRACTICE SESSION
// ========================================

router.post(
  "/sessions",
  protect,
  async (req, res) => {
    try {
      const {
        total_questions,
      } = req.body;

      if (!total_questions) {
        return res.status(400).json({
          success: false,
          message:
            "total_questions is required.",
        });
      }

      const result =
        await pool.query(
          `
          INSERT INTO practice_sessions (
            user_id,
            score,
            total_questions
          )
          VALUES ($1, 0, $2)
          RETURNING *
          `,
          [
            req.user.id,
            total_questions,
          ]
        );

      res.status(201).json({
        success: true,
        message:
          "Practice session started.",
        data: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Start practice session error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to start practice session.",
      });
    }
  }
);


// ========================================
// SAVE PRACTICE ANSWER
// ========================================

router.post(
  "/sessions/:sessionId/answers",
  protect,
  async (req, res) => {
    try {
      const {
        sessionId,
      } = req.params;

      const {
        question_id,
        choice_id,
      } = req.body;

      if (
        !question_id ||
        !choice_id
      ) {
        return res.status(400).json({
          success: false,
          message:
            "question_id and choice_id are required.",
        });
      }

      // ====================================
      // MAKE SURE SESSION BELONGS TO USER
      // ====================================

      const sessionResult =
        await pool.query(
          `
          SELECT *
          FROM practice_sessions
          WHERE id = $1
            AND user_id = $2
          `,
          [
            sessionId,
            req.user.id,
          ]
        );

      if (
        sessionResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Practice session not found.",
        });
      }

      const session =
        sessionResult.rows[0];

      // ====================================
      // PREVENT ANSWERS AFTER COMPLETION
      // ====================================

      if (session.completed_at) {
        return res.status(400).json({
          success: false,
          message:
            "This practice session has already been completed.",
        });
      }

      // ====================================
      // CHECK WHETHER CHOICE IS CORRECT
      // ====================================

      const choiceResult =
        await pool.query(
          `
          SELECT
            c.id,
            c.question_id,
            c.is_correct,
            q.explanation
          FROM choices c
          JOIN questions q
            ON c.question_id = q.id
          WHERE c.id = $1
            AND q.id = $2
          `,
          [
            choice_id,
            question_id,
          ]
        );

      if (
        choiceResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Invalid question or choice.",
        });
      }

      const answer =
        choiceResult.rows[0];

      // ====================================
      // SAVE ANSWER
      // ====================================

      const answerResult =
        await pool.query(
          `
          INSERT INTO practice_answers (
            session_id,
            question_id,
            choice_id,
            is_correct
          )
          VALUES ($1, $2, $3, $4)
          RETURNING *
          `,
          [
            sessionId,
            question_id,
            choice_id,
            answer.is_correct,
          ]
        );

      // ====================================
      // INCREASE SCORE IF CORRECT
      // ====================================

      if (answer.is_correct) {
        await pool.query(
          `
          UPDATE practice_sessions
          SET score = score + 1
          WHERE id = $1
          `,
          [sessionId]
        );
      }

      res.status(201).json({
        success: true,
        data: {
          correct:
            answer.is_correct,

          explanation:
            answer.explanation,

          answer:
            answerResult.rows[0],
        },
      });

    } catch (error) {
      console.error(
        "Save practice answer error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save practice answer.",
      });
    }
  }
);


// ========================================
// COMPLETE PRACTICE SESSION
// ========================================

router.post(
  "/sessions/:sessionId/complete",
  protect,
  async (req, res) => {
    try {
      const {
        sessionId,
      } = req.params;

      // ====================================
      // CHECK SESSION
      // ====================================

      const sessionCheck =
        await pool.query(
          `
          SELECT
            id,
            user_id,
            score,
            total_questions,
            completed_at
          FROM practice_sessions
          WHERE id = $1
            AND user_id = $2
          `,
          [
            sessionId,
            req.user.id,
          ]
        );

      if (
        sessionCheck.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Practice session not found.",
        });
      }

      const existingSession =
        sessionCheck.rows[0];

      // ====================================
      // PREVENT DUPLICATE COMPLETION
      // ====================================

      if (
        existingSession.completed_at
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This practice session has already been completed.",
        });
      }

      // ====================================
      // COUNT ANSWERED QUESTIONS
      // ====================================

      const activityResult =
        await pool.query(
          `
          SELECT
            COUNT(*) AS answered_questions
          FROM practice_answers
          WHERE session_id = $1
          `,
          [sessionId]
        );

      const answeredQuestions =
        Number(
          activityResult.rows[0]
            .answered_questions
        ) || 0;

      // ====================================
      // COMPLETE SESSION
      // ====================================

      const result =
        await pool.query(
          `
          UPDATE practice_sessions
          SET completed_at =
            CURRENT_TIMESTAMP
          WHERE id = $1
            AND user_id = $2
            AND completed_at IS NULL
          RETURNING *
          `,
          [
            sessionId,
            req.user.id,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Practice session has already been completed.",
        });
      }

      // ====================================
      // RECORD STUDY ACTIVITY
      // ====================================
      //
      // Only answered questions count
      // toward study activity.
      //
      // Example:
      //
      // 10 questions
      // 8 answered
      // 2 unanswered
      //
      // Activity = +8
      //
      // ====================================

      await recordStudyActivity(
        req.user.id,
        answeredQuestions
      );

      // ====================================
      // RESPONSE
      // ====================================

      res.json({
        success: true,
        message:
          "Practice session completed.",

        data: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Complete practice session error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to complete practice session.",
      });
    }
  }
);


// ========================================
// GET USER COMPLETED PRACTICE SESSIONS
// ========================================

router.get(
  "/sessions",
  protect,
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            id,
            score,
            total_questions,
            completed_at
          FROM practice_sessions
          WHERE user_id = $1
            AND completed_at IS NOT NULL
          ORDER BY completed_at DESC
          `,
          [req.user.id]
        );

      res.json({
        success: true,
        data: result.rows,
      });

    } catch (error) {
      console.error(
        "Get practice sessions error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retrieve practice sessions.",
      });
    }
  }
);


// ========================================
// GET SINGLE PRACTICE SESSION
// ========================================

router.get(
  "/sessions/:sessionId",
  protect,
  async (req, res) => {
    try {
      const {
        sessionId,
      } = req.params;

      // ====================================
      // GET SESSION
      // ====================================

      const sessionResult =
        await pool.query(
          `
          SELECT
            id,
            score,
            total_questions,
            completed_at
          FROM practice_sessions
          WHERE id = $1
            AND user_id = $2
          `,
          [
            sessionId,
            req.user.id,
          ]
        );

      if (
        sessionResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Practice session not found.",
        });
      }

      // ====================================
      // GET ANSWERS
      // ====================================

      const answersResult =
        await pool.query(
          `
          SELECT
            pa.id,
            pa.question_id,
            pa.choice_id,
            pa.is_correct,
            pa.answered_at,
            q.question_text,
            c.choice_text
          FROM practice_answers pa
          JOIN questions q
            ON pa.question_id = q.id
          JOIN choices c
            ON pa.choice_id = c.id
          WHERE pa.session_id = $1
          ORDER BY pa.id ASC
          `,
          [sessionId]
        );

      // ====================================
      // RESPONSE
      // ====================================

      res.json({
        success: true,

        data: {
          session:
            sessionResult.rows[0],

          answers:
            answersResult.rows,
        },
      });

    } catch (error) {
      console.error(
        "Get practice session error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retrieve practice session.",
      });
    }
  }
);


// ========================================
// GET USER PROGRESS STATISTICS
// ========================================

router.get(
  "/progress",
  protect,
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            COUNT(pa.id)
              AS total_answered,

            COUNT(
              CASE
                WHEN pa.is_correct = TRUE
                THEN 1
              END
            ) AS correct_answers,

            COUNT(
              CASE
                WHEN pa.is_correct = FALSE
                THEN 1
              END
            ) AS incorrect_answers,

            COUNT(
              DISTINCT ps.id
            ) AS practice_sessions

          FROM practice_sessions ps

          LEFT JOIN practice_answers pa
            ON ps.id = pa.session_id

          WHERE ps.user_id = $1
            AND ps.completed_at IS NOT NULL
          `,
          [req.user.id]
        );

      const stats =
        result.rows[0];

      // ====================================
      // SAFE NUMBERS
      // ====================================

      const totalAnswered =
        Number(
          stats.total_answered
        ) || 0;

      const correctAnswers =
        Number(
          stats.correct_answers
        ) || 0;

      // ====================================
      // ACCURACY
      // ====================================

      const accuracy =
        totalAnswered > 0
          ? (
              (
                correctAnswers /
                totalAnswered
              ) * 100
            ).toFixed(2)
          : "0.00";

      // ====================================
      // RESPONSE
      // ====================================

      res.json({
        success: true,

        data: {
          total_answered:
            totalAnswered,

          correct_answers:
            correctAnswers,

          incorrect_answers:
            Number(
              stats.incorrect_answers
            ) || 0,

          practice_sessions:
            Number(
              stats.practice_sessions
            ) || 0,

          accuracy:
            Number(accuracy),
        },
      });

    } catch (error) {
      console.error(
        "Get progress error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retrieve progress statistics.",
      });
    }
  }
);


module.exports = router;