require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");

const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";

// ==================================================
// START SERVER
// ==================================================

const server = app.listen(
  PORT,
  HOST,
  () => {
    console.log(
      `Server running on http://${HOST}:${PORT}`
    );

    console.log(
      `Environment: ${
        process.env.NODE_ENV || "development"
      }`
    );

    // Test database after the server is listening.
    testDatabaseConnection();
  }
);

// ==================================================
// TEST DATABASE
// ==================================================

async function testDatabaseConnection() {
  try {
    console.log(
      "Testing PostgreSQL connection..."
    );

    const result = await pool.query(
      "SELECT NOW()"
    );

    console.log(
      "Database connection successful"
    );

    console.log(
      `Database time: ${result.rows[0].now}`
    );
  } catch (error) {
    console.error(
      "PostgreSQL connection failed:"
    );

    console.error(error.message);

    console.error(
      "The API server is still running, but database operations may fail."
    );
  }
}

// ==================================================
// GRACEFUL SHUTDOWN
// ==================================================

process.on(
  "SIGTERM",
  async () => {
    console.log(
      "SIGTERM received. Shutting down..."
    );

    server.close(async () => {
      try {
        await pool.end();

        console.log(
          "PostgreSQL connection pool closed."
        );

        process.exit(0);
      } catch (error) {
        console.error(
          "Error closing PostgreSQL pool:",
          error.message
        );

        process.exit(1);
      }
    });
  }
);

process.on(
  "SIGINT",
  async () => {
    console.log(
      "SIGINT received. Shutting down..."
    );

    server.close(async () => {
      try {
        await pool.end();

        console.log(
          "PostgreSQL connection pool closed."
        );

        process.exit(0);
      } catch (error) {
        console.error(
          "Error closing PostgreSQL pool:",
          error.message
        );

        process.exit(1);
      }
    });
  }
);