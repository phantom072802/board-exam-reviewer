-- ============================================
-- SUBJECTS
-- ============================================

INSERT INTO subjects (name, description)
VALUES
(
    'General Mathematics',
    'Algebra, geometry, statistics, probability, and calculus.'
),
(
    'Science',
    'Core concepts in biology, chemistry, physics, and earth science.'
),
(
    'English',
    'Grammar, vocabulary, reading comprehension, and communication.'
),
(
    'Professional Education',
    'Teaching principles, learning theories, assessment, and classroom management.'
),
(
    'Information Technology',
    'Programming, databases, networking, and computer systems.'
);


-- ============================================
-- TOPICS
-- ============================================

INSERT INTO topics (subject_id, name, description)
VALUES
(
    1,
    'Algebra',
    'Expressions, equations, inequalities, and functions.'
),
(
    1,
    'Geometry',
    'Shapes, angles, areas, volumes, and geometric relationships.'
),
(
    1,
    'Statistics',
    'Data analysis, probability distributions, and descriptive statistics.'
),
(
    2,
    'Biology',
    'Cells, genetics, organisms, and biological processes.'
),
(
    2,
    'Physics',
    'Motion, forces, energy, electricity, and basic physics.'
),
(
    3,
    'Grammar',
    'Sentence structure, parts of speech, and grammar rules.'
),
(
    5,
    'Programming',
    'Programming fundamentals and problem solving.'
),
(
    5,
    'Database Systems',
    'Database concepts, SQL, and relational database design.'
);


-- ============================================
-- QUESTIONS
-- ============================================

INSERT INTO questions
(
    topic_id,
    question_text,
    explanation,
    difficulty
)
VALUES
(
    1,
    'What is the value of x in the equation 2x + 8 = 20?',
    'Subtract 8 from both sides to get 2x = 12. Divide by 2, giving x = 6.',
    'easy'
),
(
    1,
    'What is the value of x if 3x - 9 = 12?',
    'Add 9 to both sides to get 3x = 21. Divide by 3, giving x = 7.',
    'easy'
),
(
    4,
    'Which organelle is primarily responsible for producing energy in a cell?',
    'The mitochondria produce ATP, which provides usable energy for many cellular processes.',
    'easy'
),
(
    6,
    'Which sentence demonstrates correct subject-verb agreement?',
    'A singular subject requires a singular verb.',
    'medium'
),
(
    7,
    'Which data structure follows the Last In, First Out principle?',
    'A stack follows the Last In, First Out principle.',
    'easy'
),
(
    8,
    'Which SQL command is used to retrieve data from a table?',
    'The SELECT statement is used to retrieve records from a database table.',
    'easy'
);


-- ============================================
-- CHOICES
-- ============================================

-- Question 1
INSERT INTO choices
(question_id, choice_text, is_correct)
VALUES
(1, '4', FALSE),
(1, '6', TRUE),
(1, '8', FALSE),
(1, '10', FALSE);


-- Question 2
INSERT INTO choices
(question_id, choice_text, is_correct)
VALUES
(2, '5', FALSE),
(2, '6', FALSE),
(2, '7', TRUE),
(2, '8', FALSE);


-- Question 3
INSERT INTO choices
(question_id, choice_text, is_correct)
VALUES
(3, 'Nucleus', FALSE),
(3, 'Mitochondria', TRUE),
(3, 'Ribosome', FALSE),
(3, 'Cell wall', FALSE);


-- Question 4
INSERT INTO choices
(question_id, choice_text, is_correct)
VALUES
(4, 'The students studies every night.', FALSE),
(4, 'The student study every night.', FALSE),
(4, 'The student studies every night.', TRUE),
(4, 'The students studies every nights.', FALSE);


-- Question 5
INSERT INTO choices
(question_id, choice_text, is_correct)
VALUES
(5, 'Queue', FALSE),
(5, 'Stack', TRUE),
(5, 'Tree', FALSE),
(5, 'Graph', FALSE);


-- Question 6
INSERT INTO choices
(question_id, choice_text, is_correct)
VALUES
(6, 'INSERT', FALSE),
(6, 'UPDATE', FALSE),
(6, 'SELECT', TRUE),
(6, 'DELETE', FALSE);