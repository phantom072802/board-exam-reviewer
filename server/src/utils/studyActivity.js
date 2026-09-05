const pool = require("../config/database");

/*
|--------------------------------------------------------------------------
| RECORD STUDY ACTIVITY
|--------------------------------------------------------------------------
|
| Records the number of questions answered by the user today.
|
| If an activity record already exists for today, the new number of
| answered questions is added to the existing total.
|
|--------------------------------------------------------------------------
*/

async function recordStudyActivity(
  userId,
  questionsAnswered
) {
  const count =
    Number(questionsAnswered) || 0;

  if (count <= 0) {
    return null;
  }

  const result = await pool.query(
    `
    INSERT INTO study_activity (
      user_id,
      activity_date,
      questions_answered
    )
    VALUES (
      $1,
      CURRENT_DATE,
      $2
    )
    ON CONFLICT (
      user_id,
      activity_date
    )
    DO UPDATE SET
      questions_answered =
        study_activity.questions_answered
        + EXCLUDED.questions_answered
    RETURNING
      id,
      user_id,
      activity_date,
      questions_answered
    `,
    [
      userId,
      count,
    ]
  );

  return result.rows[0];
}

module.exports = {
  recordStudyActivity,
};