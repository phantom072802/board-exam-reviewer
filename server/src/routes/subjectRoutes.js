const express = require("express");
const pool = require("../config/database");

const router = express.Router();


// ========================================
// GET ALL SUBJECTS
// ========================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.description,
        s.created_at,
        COUNT(t.id)::INTEGER AS topic_count
      FROM subjects s
      LEFT JOIN topics t
        ON t.subject_id = s.id
      GROUP BY
        s.id,
        s.name,
        s.description,
        s.created_at
      ORDER BY s.id ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error("Get subjects error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve subjects.",
    });
  }
});


// ========================================
// GET SINGLE SUBJECT
// ========================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const subjectResult = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        created_at
      FROM subjects
      WHERE id = $1
      `,
      [id]
    );

    if (subjectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Subject not found.",
      });
    }

    const topicsResult = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        created_at
      FROM topics
      WHERE subject_id = $1
      ORDER BY id ASC
      `,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...subjectResult.rows[0],
        topics: topicsResult.rows,
      },
    });

  } catch (error) {
    console.error("Get subject error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve subject.",
    });
  }
});


module.exports = router;