const express = require("express");
const pool = require("../config/database");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// START MOCK EXAM
// ========================================

router.post("/start", protect, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      subject_id,
      topic_id,
      difficulty,
      total_questions = 10,
      duration_minutes = 30,
    } = req.body;

    // ====================================
    // NORMALIZE VALUES
    // ====================================

    const subjectId =
      subject_id === null ||
      subject_id === undefined ||
      subject_id === ""
        ? null
        : Number(subject_id);

    const topicId =
      topic_id === null ||
      topic_id === undefined ||
      topic_id === ""
        ? null
        : Number(topic_id);

    const difficultyValue =
      difficulty === null ||
      difficulty === undefined ||
      difficulty === ""
        ? null
        : String(difficulty).toLowerCase();

    // ====================================
    // VALIDATE QUESTION COUNT
    // ====================================

    const questionCount =
      Number(total_questions);

    if (
      !Number.isInteger(
        questionCount
      ) ||
      questionCount < 1 ||
      questionCount > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Question count must be between 1 and 100.",
      });
    }

    // ====================================
    // VALIDATE DURATION
    // ====================================

    const duration =
      Number(duration_minutes);

    if (
      ![10, 20, 30, 60].includes(
        duration
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be 10, 20, 30, or 60 minutes.",
      });
    }

    // ====================================
    // VALIDATE DIFFICULTY
    // ====================================

    if (
      difficultyValue &&
      ![
        "easy",
        "medium",
        "hard",
      ].includes(
        difficultyValue
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Difficulty must be easy, medium, or hard.",
      });
    }

    // ====================================
    // VALIDATE SUBJECT
    // ====================================

    if (subjectId !== null) {
      const subjectResult =
        await client.query(
          `
          SELECT
            id,
            name
          FROM subjects
          WHERE id = $1
          `,
          [subjectId]
        );

      if (
        subjectResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Subject not found.",
        });
      }
    }

    // ====================================
    // VALIDATE TOPIC
    // ====================================

    if (topicId !== null) {
      const topicResult =
        await client.query(
          `
          SELECT
            id,
            name,
            subject_id
          FROM topics
          WHERE id = $1
          `,
          [topicId]
        );

      if (
        topicResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Topic not found.",
        });
      }

      if (
        subjectId !== null &&
        Number(
          topicResult.rows[0]
            .subject_id
        ) !== subjectId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected topic does not belong to the selected subject.",
        });
      }
    }

    // ====================================
    // CHECK AVAILABLE QUESTIONS
    // ====================================

    const countResult =
      await client.query(
        `
        SELECT COUNT(*) AS count
        FROM questions q
        JOIN topics t
          ON q.topic_id = t.id
        JOIN subjects s
          ON t.subject_id = s.id
        WHERE
          (
            $1::integer IS NULL
            OR s.id = $1
          )
          AND
          (
            $2::integer IS NULL
            OR t.id = $2
          )
          AND
          (
            $3::text IS NULL
            OR LOWER(q.difficulty) = $3
          )
        `,
        [
          subjectId,
          topicId,
          difficultyValue,
        ]
      );

    const availableQuestions =
      Number(
        countResult.rows[0]
          .count
      );

    if (
      availableQuestions <
      questionCount
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Only ${availableQuestions} questions are available for this selection.`,
        available_questions:
          availableQuestions,
      });
    }

    // ====================================
    // GET RANDOM QUESTIONS
    // ====================================

    const questionsResult =
      await client.query(
        `
        SELECT
          q.id,
          q.question_text,
          q.explanation,
          q.difficulty,
          q.topic_id,
          t.name AS topic_name,
          s.id AS subject_id,
          s.name AS subject_name
        FROM questions q
        JOIN topics t
          ON q.topic_id = t.id
        JOIN subjects s
          ON t.subject_id = s.id
        WHERE
          (
            $1::integer IS NULL
            OR s.id = $1
          )
          AND
          (
            $2::integer IS NULL
            OR t.id = $2
          )
          AND
          (
            $3::text IS NULL
            OR LOWER(q.difficulty) = $3
          )
        ORDER BY RANDOM()
        LIMIT $4
        `,
        [
          subjectId,
          topicId,
          difficultyValue,
          questionCount,
        ]
      );

    // ====================================
    // GET CHOICES
    // ====================================

    const questions = [];

    for (
      const question of
      questionsResult.rows
    ) {
      const choicesResult =
        await client.query(
          `
          SELECT
            id,
            choice_text
          FROM choices
          WHERE question_id = $1
          ORDER BY id ASC
          `,
          [question.id]
        );

      questions.push({
        ...question,
        choices:
          choicesResult.rows,
      });
    }

    // ====================================
    // CREATE SESSION
    // ====================================

    await client.query(
      "BEGIN"
    );

    const sessionResult =
      await client.query(
        `
        INSERT INTO mock_exam_sessions (
          user_id,
          subject_id,
          total_questions,
          score,
          duration_minutes,
          started_at,
          completed_at
        )
        VALUES (
          $1,
          $2,
          $3,
          0,
          $4,
          CURRENT_TIMESTAMP,
          NULL
        )
        RETURNING *
        `,
        [
          req.user.id,
          subjectId,
          questionCount,
          duration,
        ]
      );

    await client.query(
      "COMMIT"
    );

    const session =
      sessionResult.rows[0];

    // ====================================
    // RESPONSE
    // ====================================

    res.status(201).json({
      success: true,
      message:
        "Mock exam started.",
      data: {
        session,
        questions,
        filters: {
          subject_id:
            subjectId,

          topic_id:
            topicId,

          difficulty:
            difficultyValue,
        },
      },
    });
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
    }

    console.error(
      "Start mock exam error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to start mock exam.",
    });
  } finally {
    client.release();
  }
});

// ========================================
// GET MOCK EXAM SESSION
// ========================================

router.get(
  "/:sessionId",
  protect,
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const sessionResult =
        await pool.query(
          `
          SELECT
            me.id,
            me.user_id,
            me.subject_id,
            s.name AS subject_name,
            me.total_questions,
            me.score,
            me.duration_minutes,
            me.started_at,
            me.completed_at
          FROM mock_exam_sessions me
          LEFT JOIN subjects s
            ON me.subject_id = s.id
          WHERE
            me.id = $1
            AND me.user_id = $2
          `,
          [
            sessionId,
            req.user.id,
          ]
        );

      if (
        sessionResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Mock exam session not found.",
        });
      }

      const answersResult =
        await pool.query(
          `
          SELECT
            mea.id,
            mea.question_id,
            mea.choice_id,
            mea.is_correct,
            mea.answered_at,
            q.question_text,
            c.choice_text
          FROM mock_exam_answers mea
          JOIN questions q
            ON mea.question_id = q.id
          LEFT JOIN choices c
            ON mea.choice_id = c.id
          WHERE mea.session_id = $1
          ORDER BY mea.id ASC
          `,
          [sessionId]
        );

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
        "Get mock exam error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retrieve mock exam.",
      });
    }
  }
);

// ========================================
// GET MOCK EXAM HISTORY
// ========================================

router.get(
  "/",
  protect,
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            me.id,
            me.subject_id,
            s.name AS subject_name,
            me.total_questions,
            me.score,
            me.duration_minutes,
            me.started_at,
            me.completed_at
          FROM mock_exam_sessions me
          LEFT JOIN subjects s
            ON me.subject_id = s.id
          WHERE me.user_id = $1
          ORDER BY me.started_at DESC
          `,
          [req.user.id]
        );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error(
        "Get mock exam history error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retrieve mock exam history.",
      });
    }
  }
);

// ========================================
// SAVE MOCK EXAM ANSWER
// ========================================

router.post(
  "/:sessionId/answer",
  protect,
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

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

      // ==================================
      // VERIFY SESSION
      // ==================================

      const sessionResult =
        await pool.query(
          `
          SELECT id
          FROM mock_exam_sessions
          WHERE
            id = $1
            AND user_id = $2
            AND completed_at IS NULL
          `,
          [
            sessionId,
            req.user.id,
          ]
        );

      if (
        sessionResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Active mock exam session not found.",
        });
      }

      // ==================================
      // VERIFY CHOICE
      // ==================================

      const choiceResult =
        await pool.query(
          `
          SELECT
            id,
            question_id,
            is_correct
          FROM choices
          WHERE
            id = $1
            AND question_id = $2
          `,
          [
            choice_id,
            question_id,
          ]
        );

      if (
        choiceResult.rows.length ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid choice for this question.",
        });
      }

      const choice =
        choiceResult.rows[0];

      // ==================================
      // SAVE ANSWER
      // ==================================

      const answerResult =
        await pool.query(
          `
          INSERT INTO mock_exam_answers (
            session_id,
            question_id,
            choice_id,
            is_correct
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          ON CONFLICT (
            session_id,
            question_id
          )
          DO UPDATE SET
            choice_id =
              EXCLUDED.choice_id,
            is_correct =
              EXCLUDED.is_correct,
            answered_at =
              CURRENT_TIMESTAMP
          RETURNING *
          `,
          [
            sessionId,
            question_id,
            choice_id,
            choice.is_correct,
          ]
        );

      // ==================================
      // UPDATE SCORE
      // ==================================

      const scoreResult =
        await pool.query(
          `
          SELECT COUNT(*) AS score
          FROM mock_exam_answers
          WHERE
            session_id = $1
            AND is_correct = TRUE
          `,
          [sessionId]
        );

      const score =
        Number(
          scoreResult.rows[0]
            .score
        ) || 0;

      await pool.query(
        `
        UPDATE mock_exam_sessions
        SET score = $1
        WHERE
          id = $2
          AND user_id = $3
        `,
        [
          score,
          sessionId,
          req.user.id,
        ]
      );

      res.json({
        success: true,
        message:
          "Answer saved.",
        data: {
          answer:
            answerResult.rows[0],
          score,
        },
      });
    } catch (error) {
      console.error(
        "Save mock exam answer error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save answer.",
      });
    }
  }
);

// ========================================
// SUBMIT MOCK EXAM
// ========================================

router.post(
  "/:sessionId/submit",
  protect,
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const { sessionId } =
        req.params;

      await client.query(
        "BEGIN"
      );

      // ==================================
      // GET SESSION
      // ==================================

      const sessionResult =
        await client.query(
          `
          SELECT
            id,
            user_id,
            total_questions,
            score,
            completed_at
          FROM mock_exam_sessions
          WHERE
            id = $1
            AND user_id = $2
          FOR UPDATE
          `,
          [
            sessionId,
            req.user.id,
          ]
        );

      if (
        sessionResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Mock exam session not found.",
        });
      }

      const session =
        sessionResult.rows[0];

      // ==================================
      // PREVENT DUPLICATE SUBMISSION
      // ==================================

      if (
        session.completed_at
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "This mock exam has already been submitted.",
        });
      }

      // ==================================
      // SCORE
      // ==================================

      const scoreResult =
        await client.query(
          `
          SELECT
            COUNT(*) FILTER (
              WHERE is_correct = TRUE
            ) AS correct_answers,

            COUNT(*) FILTER (
              WHERE is_correct = FALSE
            ) AS incorrect_answers,

            COUNT(*) AS answered_questions

          FROM mock_exam_answers
          WHERE session_id = $1
          `,
          [sessionId]
        );

      const stats =
        scoreResult.rows[0];

      const correctAnswers =
        Number(
          stats.correct_answers
        ) || 0;

      const incorrectAnswers =
        Number(
          stats.incorrect_answers
        ) || 0;

      const answeredQuestions =
        Number(
          stats.answered_questions
        ) || 0;

      const unansweredQuestions =
        Number(
          session.total_questions
        ) -
        answeredQuestions;

      // ==================================
      // UPDATE SESSION
      // ==================================

      const completedResult =
        await client.query(
          `
          UPDATE mock_exam_sessions
          SET
            score = $1,
            completed_at =
              CURRENT_TIMESTAMP
          WHERE
            id = $2
            AND user_id = $3
          RETURNING
            id,
            user_id,
            subject_id,
            total_questions,
            score,
            duration_minutes,
            started_at,
            completed_at
          `,
          [
            correctAnswers,
            sessionId,
            req.user.id,
          ]
        );

      await client.query(
        "COMMIT"
      );

      // ==================================
      // PERCENTAGE
      // ==================================

      const percentage =
        Number(
          session.total_questions
        ) > 0
          ? (
              (correctAnswers /
                Number(
                  session.total_questions
                )) *
              100
            ).toFixed(2)
          : "0.00";

      // ==================================
      // RESPONSE
      // ==================================

      res.json({
        success: true,
        message:
          "Mock exam submitted successfully.",

        data: {
          session:
            completedResult.rows[0],

          score:
            correctAnswers,

          total_questions:
            Number(
              session.total_questions
            ),

          percentage:
            Number(
              percentage
            ),

          correct_answers:
            correctAnswers,

          incorrect_answers:
            incorrectAnswers,

          unanswered_questions:
            unansweredQuestions,
        },
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }

      console.error(
        "Submit mock exam error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to submit mock exam.",
      });
    } finally {
      client.release();
    }
  }
);

module.exports = router;