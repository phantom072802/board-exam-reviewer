const express = require("express");
const pool = require("../config/database");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// GET PROFILE
// GET /api/profile
// ========================================

router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("=================================");
    console.error("GET PROFILE ERROR");
    console.error(error);
    console.error("=================================");

    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile.",
      error: error.message,
    });
  }
});

// ========================================
// UPDATE PROFILE
// PUT /api/profile
// ========================================

router.put("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const { name, email } = req.body;

    // ------------------------------------
    // VALIDATION
    // ------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // ------------------------------------
    // CHECK DUPLICATE EMAIL
    // ------------------------------------

    const existingEmail = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
        AND id <> $2
      `,
      [cleanEmail, userId]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "That email address is already being used.",
      });
    }

    // ------------------------------------
    // UPDATE USER
    // ------------------------------------

    const result = await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        email = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING
        id,
        name,
        email,
        role,
        created_at,
        updated_at
      `,
      [cleanName, cleanEmail, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("=================================");
    console.error("UPDATE PROFILE ERROR");
    console.error(error);
    console.error("=================================");

    res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    });
  }
});

module.exports = router;