import { useEffect, useState } from "react";

import {
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiFlag,
} from "react-icons/fi";

import api from "../services/api";

function MockExam() {
  // ========================================
  // SETUP STATE
  // ========================================

  const [setup, setSetup] = useState(true);

  const [subjects, setSubjects] =
    useState([]);

  const [allQuestions, setAllQuestions] =
    useState([]);

  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [selectedTopic, setSelectedTopic] =
    useState("");

  const [selectedDifficulty, setSelectedDifficulty] =
    useState("");

  const [questionCount, setQuestionCount] =
    useState(10);

  const [duration, setDuration] =
    useState(30);

  const [starting, setStarting] =
    useState(false);

  const [error, setError] =
    useState("");


  // ========================================
  // EXAM STATE
  // ========================================

  const [session, setSession] =
    useState(null);

  const [questions, setQuestions] =
    useState([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [flagged, setFlagged] =
    useState({});

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [submitting, setSubmitting] =
    useState(false);


  // ========================================
  // TIMER STATE
  // ========================================

  const isTimerWarning =
    timeLeft > 0 &&
    timeLeft <= 5 * 60;

  const isTimerCritical =
    timeLeft > 0 &&
    timeLeft <= 60;


  // ========================================
  // LOAD SUBJECTS
  // ========================================

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response =
          await api.get("/subjects");

        setSubjects(
          response.data.data || []
        );
      } catch (err) {
        console.error(
          "Load subjects error:",
          err
        );

        setError(
          "Failed to load subjects."
        );
      }
    };

    loadSubjects();
  }, []);


  // ========================================
  // LOAD QUESTIONS
  // ========================================
  //
  // We use the existing question endpoint
  // to build the Topic dropdown.
  //
  // This does NOT start an exam.
  // ========================================

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response =
          await api.get("/questions");

        setAllQuestions(
          response.data.data || []
        );
      } catch (err) {
        console.error(
          "Load questions error:",
          err
        );

        // Do not block the Mock Exam.
        // The backend will still validate
        // the selected filters.
      }
    };

    loadQuestions();
  }, []);


  // ========================================
  // BUILD TOPIC LIST
  // ========================================

  const availableTopics = [];

  const topicMap = new Map();

  allQuestions.forEach(
    (question) => {
      const questionSubjectId =
        question.subject_id != null
          ? String(question.subject_id)
          : "";

      const topicId =
        question.topic_id != null
          ? String(question.topic_id)
          : "";

      const topicName =
        question.topic_name || "";

      if (
        !topicId ||
        !topicName
      ) {
        return;
      }

      if (
        selectedSubject &&
        questionSubjectId !==
          selectedSubject
      ) {
        return;
      }

      if (
        !topicMap.has(topicId)
      ) {
        topicMap.set(
          topicId,
          {
            id: topicId,
            name: topicName,
          }
        );
      }
    }
  );

  topicMap.forEach(
    (topic) => {
      availableTopics.push(
        topic
      );
    }
  );

  availableTopics.sort(
    (a, b) =>
      a.name.localeCompare(
        b.name
      )
  );


  // ========================================
  // ESTIMATE AVAILABLE QUESTIONS
  // ========================================

  const availableQuestionCount =
    allQuestions.filter(
      (question) => {

        // SUBJECT

        if (
          selectedSubject &&
          Number(
            question.subject_id
          ) !==
            Number(
              selectedSubject
            )
        ) {
          return false;
        }


        // TOPIC

        if (
          selectedTopic &&
          Number(
            question.topic_id
          ) !==
            Number(
              selectedTopic
            )
        ) {
          return false;
        }


        // DIFFICULTY

        if (
          selectedDifficulty &&
          String(
            question.difficulty ||
              ""
          ).toLowerCase() !==
            selectedDifficulty.toLowerCase()
        ) {
          return false;
        }


        return true;
      }
    ).length;


  // ========================================
  // START EXAM
  // ========================================

  const startExam = async () => {
    try {
      setStarting(true);
      setError("");

      const response =
        await api.post(
          "/mock-exams/start",
          {
            subject_id:
              selectedSubject === ""
                ? null
                : Number(
                    selectedSubject
                  ),

            topic_id:
              selectedTopic === ""
                ? null
                : Number(
                    selectedTopic
                  ),

            difficulty:
              selectedDifficulty === ""
                ? null
                : selectedDifficulty,

            total_questions:
              Number(
                questionCount
              ),

            duration_minutes:
              Number(
                duration
              ),
          }
        );

      const examData =
        response.data.data;

      // ====================================
      // SAVE SESSION
      // ====================================

      setSession(
        examData.session
      );


      // ====================================
      // SET TIMER
      // ====================================

      setTimeLeft(
        Number(
          examData.session
            .duration_minutes
        ) * 60
      );


      // ====================================
      // SAVE QUESTIONS
      // ====================================

      setQuestions(
        examData.questions || []
      );


      // ====================================
      // RESET EXAM STATE
      // ====================================

      setCurrentQuestion(0);

      setAnswers({});

      setFlagged({});

      setSubmitting(false);


      // ====================================
      // ENTER EXAM
      // ====================================

      setSetup(false);

    } catch (err) {
      console.error(
        "Start mock exam error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to start mock exam."
      );

    } finally {
      setStarting(false);
    }
  };


  // ========================================
  // COUNTDOWN TIMER
  // ========================================

  useEffect(() => {
    if (
      setup ||
      !session ||
      submitting
    ) {
      return;
    }

    const timer =
      setInterval(() => {

        setTimeLeft(
          (previous) => {

            if (
              previous <= 1
            ) {
              clearInterval(
                timer
              );

              return 0;
            }

            return previous - 1;
          }
        );

      }, 1000);

    return () => {
      clearInterval(timer);
    };

  }, [
    setup,
    session,
    submitting,
  ]);


  // ========================================
  // AUTO SUBMIT WHEN TIME EXPIRES
  // ========================================

  useEffect(() => {
    if (
      setup ||
      !session ||
      submitting
    ) {
      return;
    }

    if (
      timeLeft === 0
    ) {
      const autoSubmit =
        async () => {

          try {
            setSubmitting(true);
            setError("");

            const response =
              await api.post(
                `/mock-exams/${session.id}/submit`
              );

            const result =
              response.data.data;

            sessionStorage.setItem(
              "mockExamResult",
              JSON.stringify(
                result
              )
            );

            // IMPORTANT:
            // Results.jsx uses id.
            window.location.href =
              `/results?type=mock&id=${session.id}`;

          } catch (err) {
            console.error(
              "Automatic submission error:",
              err
            );

            setError(
              "Time expired, but the exam could not be submitted."
            );

            setSubmitting(false);
          }
        };

      autoSubmit();
    }

  }, [
    timeLeft,
    setup,
    session,
    submitting,
  ]);


  // ========================================
  // FORMAT TIMER
  // ========================================

  const formatTime = (
    seconds
  ) => {

    const safeSeconds =
      Math.max(
        0,
        Number(seconds) || 0
      );

    const minutes =
      Math.floor(
        safeSeconds / 60
      );

    const remainingSeconds =
      safeSeconds % 60;

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )}`;
  };


  // ========================================
  // SELECT ANSWER
  // ========================================

  const selectAnswer =
    async (
      choiceId
    ) => {

      const question =
        questions[
          currentQuestion
        ];

      if (
        !question ||
        !session
      ) {
        return;
      }


      // ------------------------------------
      // UPDATE UI IMMEDIATELY
      // ------------------------------------

      setAnswers(
        (previous) => ({
          ...previous,

          [question.id]:
            choiceId,
        })
      );


      // ------------------------------------
      // SAVE TO BACKEND
      // ------------------------------------

      try {

        await api.post(
          `/mock-exams/${session.id}/answer`,
          {
            question_id:
              question.id,

            choice_id:
              choiceId,
          }
        );

      } catch (err) {

        console.error(
          "Save mock exam answer error:",
          err
        );

        setError(
          "Your answer could not be saved."
        );
      }
    };


  // ========================================
  // TOGGLE FLAG
  // ========================================

  const toggleFlag = () => {

    const question =
      questions[
        currentQuestion
      ];

    if (!question) {
      return;
    }

    setFlagged(
      (previous) => ({
        ...previous,

        [question.id]:
          !previous[
            question.id
          ],
      })
    );
  };


  // ========================================
  // NAVIGATION
  // ========================================

  const goNext = () => {

    if (
      currentQuestion <
      questions.length - 1
    ) {

      setCurrentQuestion(
        currentQuestion + 1
      );
    }
  };


  const goPrevious = () => {

    if (
      currentQuestion > 0
    ) {

      setCurrentQuestion(
        currentQuestion - 1
      );
    }
  };


  const goToQuestion =
    (index) => {

      setCurrentQuestion(
        index
      );
    };


  // ========================================
  // SUBMIT EXAM
  // ========================================

  const submitExam =
    async () => {

      if (
        !session ||
        submitting
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to submit your mock exam?"
        );

      if (!confirmed) {
        return;
      }

      try {

        setSubmitting(true);
        setError("");

        const response =
          await api.post(
            `/mock-exams/${session.id}/submit`
          );

        const result =
          response.data.data;


        // ----------------------------------
        // SAVE RESULT
        // ----------------------------------

        sessionStorage.setItem(
          "mockExamResult",
          JSON.stringify(
            result
          )
        );


        // ----------------------------------
        // GO TO RESULTS
        // ----------------------------------

        window.location.href =
          `/results?type=mock&id=${session.id}`;

      } catch (err) {

        console.error(
          "Submit mock exam error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to submit mock exam."
        );

        setSubmitting(false);
      }
    };


  // ========================================
  // RESET TOPIC WHEN SUBJECT CHANGES
  // ========================================

  const handleSubjectChange =
    (event) => {

      const value =
        event.target.value;

      setSelectedSubject(
        value
      );

      // A topic may not belong
      // to the newly selected subject.
      setSelectedTopic("");

      setError("");
    };


  // ========================================
  // RESET FILTERS
  // ========================================

  const clearFilters = () => {

    setSelectedSubject("");

    setSelectedTopic("");

    setSelectedDifficulty("");

    setError("");
  };


  // ========================================
  // SETUP SCREEN
  // ========================================

  if (setup) {

    return (
      <div className="page">

        {/* ==================================
            HEADER
            ================================== */}

        <div className="page-header">

          <div>

            <p className="eyebrow">
              Mock Examination
            </p>

            <h1>
              Board Exam Simulation
            </h1>

            <p className="page-description">
              Configure your mock
              examination before
              you begin.
            </p>

          </div>

        </div>


        {/* ==================================
            ERROR
            ================================== */}

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}


        {/* ==================================
            SETUP CARD
            ================================== */}

        <div className="mock-setup-card">


          {/* =================================
              SUBJECT
              ================================= */}

          <div className="mock-setup-section">

            <div className="mock-setup-icon">
              <FiBookOpen />
            </div>

            <div className="mock-setup-content">

              <label>
                Subject
              </label>

              <p>
                Choose a subject
                or practice across
                all subjects.
              </p>

              <select
                value={
                  selectedSubject
                }
                onChange={
                  handleSubjectChange
                }
              >

                <option value="">
                  All Subjects
                </option>

                {subjects.map(
                  (subject) => (
                    <option
                      key={
                        subject.id
                      }
                      value={
                        subject.id
                      }
                    >
                      {subject.name}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>


          {/* =================================
              TOPIC
              ================================= */}

          <div className="mock-setup-section">

            <div className="mock-setup-icon">
              <FiBookOpen />
            </div>

            <div className="mock-setup-content">

              <label>
                Topic
              </label>

              <p>
                Narrow the exam
                down to a specific
                topic.
              </p>

              <select
                value={
                  selectedTopic
                }
                onChange={(event) =>
                  setSelectedTopic(
                    event.target.value
                  )
                }
                disabled={
                  availableTopics.length ===
                  0
                }
              >

                <option value="">
                  All Topics
                </option>

                {availableTopics.map(
                  (topic) => (
                    <option
                      key={
                        topic.id
                      }
                      value={
                        topic.id
                      }
                    >
                      {topic.name}
                    </option>
                  )
                )}

              </select>

              {selectedSubject &&
                availableTopics.length ===
                  0 && (
                  <small>
                    No topics are
                    available for
                    this subject.
                  </small>
                )}

            </div>

          </div>


          {/* =================================
              DIFFICULTY
              ================================= */}

          <div className="mock-setup-section">

            <div className="mock-setup-icon">
              <FiBookOpen />
            </div>

            <div className="mock-setup-content">

              <label>
                Difficulty
              </label>

              <p>
                Choose the difficulty
                level of your
                questions.
              </p>

              <select
                value={
                  selectedDifficulty
                }
                onChange={(event) =>
                  setSelectedDifficulty(
                    event.target.value
                  )
                }
              >

                <option value="">
                  All Difficulties
                </option>

                <option value="easy">
                  Easy
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="hard">
                  Hard
                </option>

              </select>

            </div>

          </div>


          {/* =================================
              QUESTION COUNT
              ================================= */}

          <div className="mock-setup-section">

            <div className="mock-setup-icon">
              <FiBookOpen />
            </div>

            <div className="mock-setup-content">

              <label>
                Number of Questions
              </label>

              <p>
                Select how many
                questions will be
                included.
              </p>

              <div className="setup-options">

                {[5, 10, 15].map(
                  (number) => (
                    <button
                      key={
                        number
                      }
                      type="button"
                      className={
                        questionCount ===
                        number
                          ? "setup-option active"
                          : "setup-option"
                      }
                      onClick={() =>
                        setQuestionCount(
                          number
                        )
                      }
                    >
                      {number}
                    </button>
                  )
                )}

              </div>

            </div>

          </div>


          {/* =================================
              DURATION
              ================================= */}

          <div className="mock-setup-section">

            <div className="mock-setup-icon">
              <FiClock />
            </div>

            <div className="mock-setup-content">

              <label>
                Time Limit
              </label>

              <p>
                Choose how much
                time you have to
                complete the exam.
              </p>

              <div className="setup-options">

                {[10, 20, 30, 60].map(
                  (minutes) => (
                    <button
                      key={
                        minutes
                      }
                      type="button"
                      className={
                        duration ===
                        minutes
                          ? "setup-option active"
                          : "setup-option"
                      }
                      onClick={() =>
                        setDuration(
                          minutes
                        )
                      }
                    >
                      {minutes} min
                    </button>
                  )
                )}

              </div>

            </div>

          </div>


          {/* =================================
              FILTER SUMMARY
              ================================= */}

          <div className="mock-filter-summary">

            <div>

              <span>
                Available questions
              </span>

              <strong>
                {availableQuestionCount}
              </strong>

            </div>

            <div>

              <span>
                Selected
              </span>

              <strong>
                {questionCount}
              </strong>

            </div>

          </div>


          {/* =================================
              START FOOTER
              ================================= */}

          <div className="mock-setup-footer">

            <div>

              <strong>
                Ready to begin?
              </strong>

              <span>
                {questionCount}{" "}
                questions ·{" "}
                {duration} minutes
              </span>

            </div>


            <div className="mock-setup-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  clearFilters
                }
                disabled={
                  starting
                }
              >
                Clear Filters
              </button>


              <button
                type="button"
                className="primary-button"
                onClick={
                  startExam
                }
                disabled={
                  starting ||
                  availableQuestionCount <
                    questionCount
                }
              >

                {starting
                  ? "Starting..."
                  : "Start Mock Exam"}

                <FiArrowRight />

              </button>

            </div>

          </div>


          {/* =================================
              NOT ENOUGH QUESTIONS
              ================================= */}

          {availableQuestionCount <
            questionCount && (
            <div className="mock-question-warning">

              Only{" "}
              <strong>
                {availableQuestionCount}
              </strong>{" "}
              questions are available
              for the selected filters.

              <br />

              Choose fewer questions
              or change your filters.

            </div>
          )}

        </div>

      </div>
    );
  }


  // ========================================
  // NO QUESTIONS
  // ========================================

  if (
    !questions.length
  ) {

    return (
      <div className="page">

        <div className="dashboard-error">

          No questions were returned
          for this exam.

        </div>

      </div>
    );
  }


  // ========================================
  // CURRENT QUESTION
  // ========================================

  const question =
    questions[
      currentQuestion
    ];


  const selectedChoice =
    answers[
      question.id
    ];


  const answeredCount =
    Object.keys(
      answers
    ).length;


  const flaggedCount =
    Object.values(
      flagged
    ).filter(
      Boolean
    ).length;


  // ========================================
  // EXAM SCREEN
  // ========================================

  return (
    <div className="page">


      {/* ==================================
          EXAM HEADER
          ================================== */}

      <div className="exam-top">

        <div>

          <p className="eyebrow">
            Mock Examination
          </p>

          <h1>
            Board Exam Simulation
          </h1>

          <p className="page-description">

            {session?.total_questions}{" "}
            questions ·{" "}
            {session?.duration_minutes}{" "}
            minutes

          </p>

        </div>


        {/* ==================================
            TIMER
            ================================== */}

        <div
          className={[
            "timer",

            isTimerWarning
              ? "timer-warning"
              : "",

            isTimerCritical
              ? "timer-critical"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >

          <FiClock />

          <div>

            <span>
              Time Remaining
            </span>

            <strong>
              {formatTime(
                timeLeft
              )}
            </strong>

          </div>

        </div>

      </div>


      {/* ==================================
          ERROR
          ================================== */}

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}


      {/* ==================================
          EXAM LAYOUT
          ================================== */}

      <div className="exam-layout">


        {/* ==================================
            QUESTION
            ================================== */}

        <main className="question-card">


          {/* QUESTION TOP */}

          <div className="question-card-top">

            <span className="question-number">

              Question{" "}
              {currentQuestion + 1} /{" "}
              {questions.length}

            </span>


            <button
              type="button"
              className={
                flagged[
                  question.id
                ]
                  ? "bookmark-button flagged"
                  : "bookmark-button"
              }
              onClick={
                toggleFlag
              }
            >

              <FiFlag />

              {flagged[
                question.id
              ]
                ? "Flagged"
                : "Flag"}

            </button>

          </div>


          {/* ==================================
              QUESTION META
              ================================== */}

          <div className="mock-question-meta">

            {question.subject_name && (
              <span>
                {
                  question.subject_name
                }
              </span>
            )}

            {question.topic_name && (
              <span>
                {
                  question.topic_name
                }
              </span>
            )}

            {question.difficulty && (
              <span>
                {
                  question.difficulty
                }
              </span>
            )}

          </div>


          {/* ==================================
              QUESTION TEXT
              ================================== */}

          <h2>
            {
              question.question_text
            }
          </h2>


          {/* ==================================
              CHOICES
              ================================== */}

          <div className="choices">

            {question.choices?.map(
              (
                choice,
                index
              ) => {

                const isSelected =
                  selectedChoice ===
                  choice.id;

                return (
                  <button
                    key={
                      choice.id
                    }
                    type="button"
                    className={
                      isSelected
                        ? "choice selected"
                        : "choice"
                    }
                    onClick={() =>
                      selectAnswer(
                        choice.id
                      )
                    }
                    disabled={
                      submitting
                    }
                  >

                    <span className="choice-letter">

                      {String.fromCharCode(
                        65 + index
                      )}

                    </span>

                    <span>
                      {
                        choice.choice_text
                      }
                    </span>

                  </button>
                );
              }
            )}

          </div>


          {/* ==================================
              NAVIGATION
              ================================== */}

          <div className="quiz-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={
                goPrevious
              }
              disabled={
                currentQuestion ===
                  0 ||
                submitting
              }
            >
              Previous
            </button>


            <button
              type="button"
              className="primary-button"
              onClick={
                goNext
              }
              disabled={
                currentQuestion ===
                  questions.length - 1 ||
                submitting
              }
            >

              Next

              <FiArrowRight />

            </button>

          </div>

        </main>


        {/* ==================================
            QUESTION NAVIGATOR
            ================================== */}

        <aside className="exam-navigator">

          <h3>
            Question Navigator
          </h3>


          {/* LEGEND */}

          <div className="navigator-legend">

            <span>

              <i className="legend-current" />

              Current

            </span>


            <span>

              <i className="legend-answered" />

              Answered

            </span>


            <span>

              <i className="legend-empty" />

              Unanswered

            </span>


            <span>

              <i className="legend-flagged" />

              Flagged

            </span>

          </div>


          {/* QUESTION GRID */}

          <div className="question-grid">

            {questions.map(
              (
                item,
                index
              ) => {

                const isAnswered =
                  Boolean(
                    answers[
                      item.id
                    ]
                  );

                const isCurrent =
                  index ===
                  currentQuestion;

                const isFlagged =
                  Boolean(
                    flagged[
                      item.id
                    ]
                  );

                return (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    className={[
                      isCurrent
                        ? "current"
                        : "",

                      isAnswered
                        ? "answered"
                        : "",

                      isFlagged
                        ? "flagged"
                        : "",
                    ]
                      .filter(
                        Boolean
                      )
                      .join(" ")}
                    onClick={() =>
                      goToQuestion(
                        index
                      )
                    }
                    title={
                      isFlagged
                        ? `Question ${
                            index + 1
                          } - Flagged`
                        : `Question ${
                            index + 1
                          }`
                    }
                  >

                    <span>
                      {index + 1}
                    </span>

                    {isFlagged && (
                      <FiFlag className="navigator-flag-icon" />
                    )}

                  </button>
                );
              }
            )}

          </div>


          {/* ==================================
              ANSWER SUMMARY
              ================================== */}

          <div className="navigator-summary">

            <div>

              <span>
                Answered
              </span>

              <strong>
                {answeredCount} /{" "}
                {questions.length}
              </strong>

            </div>


            <div>

              <span>
                Flagged
              </span>

              <strong>
                {flaggedCount}
              </strong>

            </div>

          </div>


          {/* ==================================
              SUBMIT
              ================================== */}

          <button
            type="button"
            className="submit-exam-button"
            onClick={
              submitExam
            }
            disabled={
              submitting
            }
          >

            {submitting
              ? "Submitting..."
              : "Submit Exam"}

          </button>

        </aside>

      </div>

    </div>
  );
}

export default MockExam;