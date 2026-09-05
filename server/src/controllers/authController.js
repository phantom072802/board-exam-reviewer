const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};


// ========================================
// REGISTER
// ========================================

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    const cleanEmail =
      email.toLowerCase().trim();

    const existingUser =
      await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [cleanEmail]
      );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO users
      (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, role, created_at
      `,
      [
        name.trim(),
        cleanEmail,
        passwordHash,
      ]
    );

    const user = result.rows[0];

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message:
        "Account created successfully.",
      token,
      user,
    });

  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create account.",
    });
  }
};


// ========================================
// LOGIN
// ========================================

const login = async (req, res) => {
  try {
    const { email, password } =
      req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const cleanEmail =
      email.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        created_at
      FROM users
      WHERE email = $1
      `,
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    delete user.password_hash;

    const token =
      generateToken(user);

    res.json({
      success: true,
      message:
        "Login successful.",
      token,
      user,
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to login.",
    });
  }
};


// ========================================
// CURRENT USER
// ========================================

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        created_at
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Get user error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to retrieve user.",
    });
  }
};


// ========================================
// UPDATE PROFILE
// ========================================

const updateProfile = async (
  req,
  res
) => {
  try {
    const { name, email } =
      req.body;

    // ==================================
    // VALIDATION
    // ==================================

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message:
          "Name and email are required.",
      });
    }

    const cleanName =
      name.trim();

    const cleanEmail =
      email.toLowerCase().trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot be empty.",
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email cannot be empty.",
      });
    }

    // ==================================
    // CHECK EMAIL
    // ==================================

    const existingUser =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
          AND id != $2
        `,
        [
          cleanEmail,
          req.user.id,
        ]
      );

    if (
      existingUser.rows.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already being used by another account.",
      });
    }

    // ==================================
    // UPDATE USER
    // ==================================

    const result = await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        email = $2
      WHERE id = $3

      RETURNING
        id,
        name,
        email,
        role,
        created_at
      `,
      [
        cleanName,
        cleanEmail,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    const updatedUser =
      result.rows[0];

    // ==================================
    // GENERATE NEW TOKEN
    // ==================================

    const token =
      generateToken(
        updatedUser
      );

    // ==================================
    // RESPONSE
    // ==================================

    return res.json({
      success: true,
      message:
        "Profile updated successfully.",
      token,
      user: updatedUser,
    });

  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update profile.",
    });
  }
};

// ========================================
// CHANGE PASSWORD
// ========================================

const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    // ==================================
    // VALIDATION
    // ==================================

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password.",
      });
    }

    // ==================================
    // GET CURRENT USER
    // ==================================

    const result = await pool.query(
      `
      SELECT
        id,
        password_hash
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = result.rows[0];

    // ==================================
    // CHECK CURRENT PASSWORD
    // ==================================

    const passwordMatch =
      await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    // ==================================
    // HASH NEW PASSWORD
    // ==================================

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    // ==================================
    // UPDATE PASSWORD
    // ==================================

    await pool.query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
      `,
      [
        newPasswordHash,
        req.user.id,
      ]
    );

    // ==================================
    // SUCCESS
    // ==================================

    return res.json({
      success: true,
      message:
        "Password changed successfully.",
    });

  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to change password.",
    });
  }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};