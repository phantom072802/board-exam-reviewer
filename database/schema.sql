-- ============================================
-- BOARDPREP DATABASE
-- ============================================

-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'student'
        CHECK (role IN ('student', 'admin')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- SUBJECTS
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- TOPICS
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,

    subject_id INTEGER NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_topics_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
);


-- QUESTIONS
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,

    topic_id INTEGER NOT NULL,

    question_text TEXT NOT NULL,

    explanation TEXT,

    difficulty VARCHAR(20) DEFAULT 'medium'
        CHECK (
            difficulty IN (
                'easy',
                'medium',
                'hard'
            )
        ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_questions_topic
        FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE CASCADE
);


-- CHOICES
CREATE TABLE choices (
    id SERIAL PRIMARY KEY,

    question_id INTEGER NOT NULL,

    choice_text TEXT NOT NULL,

    is_correct BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_choices_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE
);


-- EXAMS
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    subject_id INTEGER,

    score INTEGER DEFAULT 0,

    total_questions INTEGER NOT NULL,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    completed_at TIMESTAMP,

    CONSTRAINT fk_exams_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_exams_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE SET NULL
);


-- EXAM ANSWERS
CREATE TABLE exam_answers (
    id SERIAL PRIMARY KEY,

    exam_id INTEGER NOT NULL,

    question_id INTEGER NOT NULL,

    choice_id INTEGER,

    is_correct BOOLEAN DEFAULT FALSE,

    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_answers_exam
        FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_exam_answers_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_exam_answers_choice
        FOREIGN KEY (choice_id)
        REFERENCES choices(id)
        ON DELETE SET NULL
);


-- BOOKMARKS
CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    question_id INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bookmarks_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_bookmarks_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_question_bookmark
        UNIQUE(user_id, question_id)
);


-- USER PROGRESS
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    subject_id INTEGER NOT NULL,

    questions_answered INTEGER DEFAULT 0,

    correct_answers INTEGER DEFAULT 0,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_progress_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_progress_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_subject_progress
        UNIQUE(user_id, subject_id)
);


-- INDEXES
CREATE INDEX idx_topics_subject
ON topics(subject_id);

CREATE INDEX idx_questions_topic
ON questions(topic_id);

CREATE INDEX idx_choices_question
ON choices(question_id);

CREATE INDEX idx_exams_user
ON exams(user_id);

CREATE INDEX idx_exam_answers_exam
ON exam_answers(exam_id);

CREATE INDEX idx_bookmarks_user
ON bookmarks(user_id);

CREATE INDEX idx_progress_user
ON user_progress(user_id);


-- DASHBOARD, PRACTICE, AND ACTIVITY
CREATE TABLE study_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_questions INTEGER NOT NULL CHECK (target_questions > 0),
    target_accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (target_accuracy >= 0 AND target_accuracy <= 100),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE practice_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE practice_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    choice_id INTEGER REFERENCES choices(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_practice_session_question UNIQUE(session_id, question_id)
);

CREATE TABLE mock_exam_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE mock_exam_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES mock_exam_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    choice_id INTEGER REFERENCES choices(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_mock_exam_session_question UNIQUE(session_id, question_id)
);

CREATE TABLE study_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_user_activity_date UNIQUE(user_id, activity_date)
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_practice_sessions_user ON practice_sessions(user_id);
CREATE INDEX idx_study_goals_user_status ON study_goals(user_id, status);
CREATE INDEX idx_practice_answers_session ON practice_answers(session_id);
CREATE INDEX idx_mock_exam_sessions_user ON mock_exam_sessions(user_id);
CREATE INDEX idx_mock_exam_answers_session ON mock_exam_answers(session_id);
CREATE INDEX idx_study_activity_user_date ON study_activity(user_id, activity_date);
CREATE INDEX idx_notifications_user_created_at ON notifications(user_id, created_at DESC);
