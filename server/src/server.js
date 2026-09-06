require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log("Testing PostgreSQL connection...");

    await pool.query("SELECT NOW()");

    console.log(
      "Database connection successful"
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to connect to PostgreSQL:"
    );

    console.error(error);

    process.exit(1);
  }
}

startServer();