const pool = require("./database");

// These tables were added after the original schema.sql was deployed. The
// migration is deliberately idempotent so every Render restart can safely run
// it and existing production data is never replaced.
const dashboardTablesMigration = `
  CREATE TABLE IF NOT EXISTS practice_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS practice_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    choice_id INTEGER REFERENCES choices(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT practice_answers_session_question_key
      UNIQUE (session_id, question_id)
  );

  CREATE TABLE IF NOT EXISTS mock_exam_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mock_exam_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES mock_exam_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    choice_id INTEGER REFERENCES choices(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT mock_exam_answers_session_question_key
      UNIQUE (session_id, question_id)
  );

  CREATE TABLE IF NOT EXISTS study_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT study_activity_user_date_key UNIQUE (user_id, activity_date)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_practice_sessions_user
    ON practice_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_practice_answers_session
    ON practice_answers(session_id);
  CREATE INDEX IF NOT EXISTS idx_mock_exam_sessions_user
    ON mock_exam_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_mock_exam_answers_session
    ON mock_exam_answers(session_id);
  CREATE INDEX IF NOT EXISTS idx_study_activity_user_date
    ON study_activity(user_id, activity_date);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
    ON notifications(user_id, created_at DESC);
`;

async function runMigrations() {
  await pool.query(dashboardTablesMigration);
  console.log("Database migrations completed.");
}

module.exports = { runMigrations };
