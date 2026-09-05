const express = require("express");
const pool = require("../config/database");

const router = express.Router();


// ========================================
// GET ALL QUESTIONS
// ========================================

router.get("/", async (req, res) => {
  try {
    const questionsResult = await pool.query(`
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
      ORDER BY q.id ASC
    `);

    const questions = [];

    for (const question of questionsResult.rows) {
      const choicesResult = await pool.query(
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
        choices: choicesResult.rows,
      });
    }

    res.json({
      success: true,
      data: questions,
    });

  } catch (error) {
    console.error("Get questions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve questions.",
    });
  }
});


// ========================================
// GET QUESTIONS BY TOPIC
// IMPORTANT: Keep this BEFORE /:id
// ========================================

router.get("/topic/:topicId", async (req, res) => {
  try {
    const { topicId } = req.params;

    const questionsResult = await pool.query(
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
      WHERE q.topic_id = $1
      ORDER BY q.id ASC
      `,
      [topicId]
    );

    const questions = [];

    for (const question of questionsResult.rows) {
      const choicesResult = await pool.query(
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
        choices: choicesResult.rows,
      });
    }

    res.json({
      success: true,
      data: questions,
    });

  } catch (error) {
    console.error("Get topic questions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve topic questions.",
    });
  }
});


// ========================================
// SUBMIT ANSWER
// ========================================

router.post("/:id/answer", async (req, res) => {
  try {
    const { id } = req.params;
    const { choice_id } = req.body;

    if (!choice_id) {
      return res.status(400).json({
        success: false,
        message: "choice_id is required.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.choice_text,
        c.is_correct,
        q.explanation
      FROM choices c
      JOIN questions q
        ON c.question_id = q.id
      WHERE c.id = $1
        AND q.id = $2
      `,
      [choice_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid question or choice.",
      });
    }

    const answer = result.rows[0];

    res.json({
      success: true,
      data: {
        correct: answer.is_correct,
        explanation: answer.explanation,
        selected_choice: {
          id: answer.id,
          text: answer.choice_text,
        },
      },
    });

  } catch (error) {
    console.error("Submit answer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit answer.",
    });
  }
});


// ========================================
// GET SINGLE QUESTION
// IMPORTANT: Keep this AFTER /topic/:topicId
// ========================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const questionResult = await pool.query(
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
      WHERE q.id = $1
      `,
      [id]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    const choicesResult = await pool.query(
      `
      SELECT
        id,
        choice_text
      FROM choices
      WHERE question_id = $1
      ORDER BY id ASC
      `,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...questionResult.rows[0],
        choices: choicesResult.rows,
      },
    });

  } catch (error) {
    console.error("Get question error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve question.",
    });
  }
});


module.exports = router;