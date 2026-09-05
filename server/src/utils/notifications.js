const pool = require("../config/database");

/*
|--------------------------------------------------------------------------
| CREATE NOTIFICATION
|--------------------------------------------------------------------------
*/

async function createNotification(
  userId,
  type,
  title,
  message
) {
  const result = await pool.query(
    `
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message
    )
    VALUES (
      $1,
      $2,
      $3,
      $4
    )
    RETURNING
      id,
      user_id,
      type,
      title,
      message,
      is_read,
      created_at
    `,
    [
      userId,
      type,
      title,
      message,
    ]
  );

  return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  createNotification,
};