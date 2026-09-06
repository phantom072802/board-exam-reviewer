const jwt = require("jsonwebtoken");

// ==================================================
// AUTHENTICATION MIDDLEWARE
// ==================================================

const protect = (req, res, next) => {
  try {
    // ==============================================
    // READ AUTHORIZATION HEADER
    // ==============================================

    const authHeader =
      req.headers.authorization;

    console.log(
      "========================================"
    );

    console.log(
      "AUTHENTICATION CHECK"
    );

    console.log(
      "Method:",
      req.method
    );

    console.log(
      "Path:",
      req.originalUrl
    );

    console.log(
      "Authorization header exists:",
      Boolean(authHeader)
    );

    // ==============================================
    // CHECK AUTHORIZATION HEADER
    // ==============================================

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      console.error(
        "Authentication failed: Authorization header missing."
      );

      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ==============================================
    // EXTRACT TOKEN
    // ==============================================

    const token =
      authHeader.substring(7).trim();

    console.log(
      "Token exists:",
      Boolean(token)
    );

    console.log(
      "Token length:",
      token.length
    );

    // Never print the actual token.
    console.log(
      "Token format:",
      token.split(".").length === 3
        ? "JWT format detected"
        : "Invalid JWT format"
    );

    // ==============================================
    // CHECK JWT SECRET
    // ==============================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "Authentication failed: JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration error.",
      });
    }

    console.log(
      "JWT_SECRET configured: true"
    );

    // ==============================================
    // VERIFY TOKEN
    // ==============================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log(
      "JWT verification successful."
    );

    console.log(
      "Authenticated user ID:",
      decoded.id
    );

    console.log(
      "Authenticated user email:",
      decoded.email
    );

    // ==============================================
    // ATTACH USER TO REQUEST
    // ==============================================

    req.user = decoded;

    console.log(
      "Authentication successful."
    );

    console.log(
      "========================================"
    );

    next();

  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "JWT AUTHENTICATION ERROR"
    );

    console.error(
      "Error name:",
      error.name
    );

    console.error(
      "Error message:",
      error.message
    );

    console.error(
      "========================================"
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = {
  protect,
};