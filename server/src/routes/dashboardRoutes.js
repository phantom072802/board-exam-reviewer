const express = require("express");
const pool = require("../config/database");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// GET DASHBOARD OVERVIEW
// ========================================

router.get("/overview", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // ====================================
    // OVERALL STATISTICS
    // ====================================

    const statsResult = await pool.query(
      `
      WITH completed_sessions AS (
        SELECT
          score,
          total_questions
        FROM practice_sessions
        WHERE user_id = $1
          AND completed_at IS NOT NULL

        UNION ALL

        SELECT
          score,
          total_questions
        FROM mock_exam_sessions
        WHERE user_id = $1
          AND completed_at IS NOT NULL
      )

      SELECT
        COALESCE(
          ROUND(
            AVG(
              CASE
                WHEN total_questions > 0
                THEN (
                  score::numeric /
                  total_questions
                ) * 100
                ELSE 0
              END
            ),
            2
          ),
          0
        ) AS average_score,

        COALESCE(
          SUM(score),
          0
        ) AS correct_answers,

        COALESCE(
          COUNT(*),
          0
        ) AS completed_exams

      FROM completed_sessions;
      `,
      [userId]
    );

    const stats = statsResult.rows[0];

    // ====================================
    // QUESTIONS ANSWERED
    // ====================================

    const answeredResult = await pool.query(
      `
      SELECT
        (
          SELECT COUNT(*)
          FROM practice_answers pa
          JOIN practice_sessions ps
            ON pa.session_id = ps.id
          WHERE ps.user_id = $1
        )
        +
        (
          SELECT COUNT(*)
          FROM mock_exam_answers mea
          JOIN mock_exam_sessions mes
            ON mea.session_id = mes.id
          WHERE mes.user_id = $1
        )
        AS questions_answered;
      `,
      [userId]
    );

    const questionsAnswered =
      Number(
        answeredResult.rows[0].questions_answered
      ) || 0;

    // ====================================
    // RECENT RESULT
    // ====================================

    const recentResult = await pool.query(
      `
      SELECT *
      FROM (
        SELECT
          ps.id,
          'practice' AS type,
          NULL::integer AS subject_id,
          ps.score,
          ps.total_questions,
          ps.completed_at
        FROM practice_sessions ps
        WHERE ps.user_id = $1
          AND ps.completed_at IS NOT NULL

        UNION ALL

        SELECT
          mes.id,
          'mock' AS type,
          mes.subject_id,
          mes.score,
          mes.total_questions,
          mes.completed_at
        FROM mock_exam_sessions mes
        WHERE mes.user_id = $1
          AND mes.completed_at IS NOT NULL
      ) results

      ORDER BY completed_at DESC
      LIMIT 1;
      `,
      [userId]
    );

    const recentResultData =
      recentResult.rows[0] || null;

    // ====================================
    // SUBJECT PROGRESS
    // ====================================

    const subjectProgressResult =
      await pool.query(
        `
        WITH answered_questions AS (
          SELECT DISTINCT
            q.id AS question_id,
            s.id AS subject_id
          FROM practice_answers pa

          JOIN practice_sessions ps
            ON pa.session_id = ps.id

          JOIN questions q
            ON pa.question_id = q.id

          JOIN topics t
            ON q.topic_id = t.id

          JOIN subjects s
            ON t.subject_id = s.id

          WHERE ps.user_id = $1

          UNION

          SELECT DISTINCT
            q.id AS question_id,
            s.id AS subject_id
          FROM mock_exam_answers mea

          JOIN mock_exam_sessions mes
            ON mea.session_id = mes.id

          JOIN questions q
            ON mea.question_id = q.id

          JOIN topics t
            ON q.topic_id = t.id

          JOIN subjects s
            ON t.subject_id = s.id

          WHERE mes.user_id = $1
        )

        SELECT
          s.id,
          s.name,

          COUNT(DISTINCT q.id)
            AS total_questions,

          COUNT(DISTINCT aq.question_id)
            AS answered_questions,

          CASE
            WHEN COUNT(DISTINCT q.id) = 0
            THEN 0

            ELSE ROUND(
              (
                COUNT(
                  DISTINCT aq.question_id
                )::numeric

                /

                COUNT(
                  DISTINCT q.id
                )
              ) * 100,
              2
            )
          END AS progress

        FROM subjects s

        LEFT JOIN topics t
          ON t.subject_id = s.id

        LEFT JOIN questions q
          ON q.topic_id = t.id

        LEFT JOIN answered_questions aq
          ON aq.question_id = q.id
          AND aq.subject_id = s.id

        GROUP BY
          s.id,
          s.name

        ORDER BY
          s.id ASC;
        `,
        [userId]
      );

    // ====================================
    // CONTINUE STUDYING
    // ====================================

    const continueResult =
      await pool.query(
        `
        SELECT
          s.id AS subject_id,
          s.name AS subject_name,

          t.id AS topic_id,
          t.name AS topic_name,

          COUNT(
            DISTINCT q.id
          ) AS total_questions,

          COUNT(
            DISTINCT CASE
              WHEN aq.question_id IS NOT NULL
              THEN aq.question_id
            END
          ) AS answered_questions

        FROM subjects s

        JOIN topics t
          ON t.subject_id = s.id

        JOIN questions q
          ON q.topic_id = t.id

        LEFT JOIN (
          SELECT DISTINCT
            q.id AS question_id,
            s.id AS subject_id
          FROM practice_answers pa

          JOIN practice_sessions ps
            ON pa.session_id = ps.id

          JOIN questions q
            ON pa.question_id = q.id

          JOIN topics t
            ON q.topic_id = t.id

          JOIN subjects s
            ON t.subject_id = s.id

          WHERE ps.user_id = $1

          UNION

          SELECT DISTINCT
            q.id AS question_id,
            s.id AS subject_id
          FROM mock_exam_answers mea

          JOIN mock_exam_sessions mes
            ON mea.session_id = mes.id

          JOIN questions q
            ON mea.question_id = q.id

          JOIN topics t
            ON q.topic_id = t.id

          JOIN subjects s
            ON t.subject_id = s.id

          WHERE mes.user_id = $1

        ) aq
          ON aq.question_id = q.id

        GROUP BY
          s.id,
          s.name,
          t.id,
          t.name

        ORDER BY
          COUNT(
            DISTINCT CASE
              WHEN aq.question_id IS NOT NULL
              THEN aq.question_id
            END
          ) DESC,

          s.id ASC,
          t.id ASC

        LIMIT 1;
        `,
        [userId]
      );

    const continueStudying =
      continueResult.rows[0] || null;

    // ====================================
    // RESPONSE
    // ====================================

    res.json({
      success: true,

      data: {
        stats: {
          average_score:
            Number(
              stats.average_score
            ) || 0,

          questions_answered:
            questionsAnswered,

          completed_exams:
            Number(
              stats.completed_exams
            ) || 0,

          correct_answers:
            Number(
              stats.correct_answers
            ) || 0,
        },

        recent_result:
          recentResultData,

        subject_progress:
          subjectProgressResult.rows,

        continue_studying:
          continueStudying,
      },
    });

    } catch (error) {
    console.error(
      "Get dashboard overview error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to retrieve dashboard data.",
    });
  }
});


// ========================================
// GET DASHBOARD ANALYTICS
// ========================================

router.get(
  "/analytics",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;

      // ==================================
      // OVERALL ANSWER ANALYTICS
      // ==================================

      const overallResult =
        await pool.query(
          `
          WITH all_answers AS (

            SELECT
              pa.question_id,
              pa.is_correct,
              'practice' AS source

            FROM practice_answers pa

            JOIN practice_sessions ps
              ON pa.session_id = ps.id

            WHERE ps.user_id = $1

            UNION ALL

            SELECT
              mea.question_id,
              mea.is_correct,
              'mock' AS source

            FROM mock_exam_answers mea

            JOIN mock_exam_sessions mes
              ON mea.session_id = mes.id

            WHERE mes.user_id = $1
          )

          SELECT

            COUNT(*)
              AS total_answered,

            COUNT(
              CASE
                WHEN is_correct = TRUE
                THEN 1
              END
            )
              AS total_correct,

            COUNT(
              CASE
                WHEN is_correct = FALSE
                THEN 1
              END
            )
              AS total_incorrect,

            COUNT(
              CASE
                WHEN source = 'practice'
                THEN 1
              END
            )
              AS practice_answers,

            COUNT(
              CASE
                WHEN source = 'mock'
                THEN 1
              END
            )
              AS mock_answers,

            COUNT(
              CASE
                WHEN source = 'practice'
                  AND is_correct = TRUE
                THEN 1
              END
            )
              AS practice_correct,

            COUNT(
              CASE
                WHEN source = 'mock'
                  AND is_correct = TRUE
                THEN 1
              END
            )
              AS mock_correct

          FROM all_answers;
          `,
          [userId]
        );

      const overall =
        overallResult.rows[0];

      // ==================================
      // PRACTICE VS MOCK PERFORMANCE
      // ==================================

      const sessionPerformanceResult =
        await pool.query(
          `
          WITH completed_sessions AS (

            SELECT
              'practice' AS type,
              score,
              total_questions,
              completed_at

            FROM practice_sessions

            WHERE user_id = $1
              AND completed_at IS NOT NULL

            UNION ALL

            SELECT
              'mock' AS type,
              score,
              total_questions,
              completed_at

            FROM mock_exam_sessions

            WHERE user_id = $1
              AND completed_at IS NOT NULL
          )

          SELECT
            type,

            COUNT(*)
              AS sessions,

            COALESCE(
              ROUND(
                AVG(
                  CASE
                    WHEN total_questions > 0
                    THEN (
                      score::numeric /
                      total_questions
                    ) * 100
                    ELSE 0
                  END
                ),
                2
              ),
              0
            ) AS average_score,

            COALESCE(
              SUM(score),
              0
            ) AS correct_answers,

            COALESCE(
              SUM(total_questions),
              0
            ) AS total_questions

          FROM completed_sessions

          GROUP BY type

          ORDER BY type;
          `,
          [userId]
        );

      // ==================================
      // SUBJECT PERFORMANCE
      // ==================================

      const subjectPerformanceResult =
        await pool.query(
          `
          WITH all_answers AS (

            SELECT
              pa.question_id,
              pa.is_correct

            FROM practice_answers pa

            JOIN practice_sessions ps
              ON pa.session_id = ps.id

            WHERE ps.user_id = $1

            UNION ALL

            SELECT
              mea.question_id,
              mea.is_correct

            FROM mock_exam_answers mea

            JOIN mock_exam_sessions mes
              ON mea.session_id = mes.id

            WHERE mes.user_id = $1
          )

          SELECT

            s.id AS subject_id,
            s.name AS subject_name,

            COUNT(*)
              AS answered_questions,

            COUNT(
              CASE
                WHEN aa.is_correct = TRUE
                THEN 1
              END
            ) AS correct_answers,

            COUNT(
              CASE
                WHEN aa.is_correct = FALSE
                THEN 1
              END
            ) AS incorrect_answers,

            CASE
              WHEN COUNT(*) = 0
              THEN 0

              ELSE ROUND(
                (
                  COUNT(
                    CASE
                      WHEN aa.is_correct = TRUE
                      THEN 1
                    END
                  )::numeric
                  /
                  COUNT(*)
                ) * 100,
                2
              )
            END AS accuracy

          FROM all_answers aa

          JOIN questions q
            ON aa.question_id = q.id

          JOIN topics t
            ON q.topic_id = t.id

          JOIN subjects s
            ON t.subject_id = s.id

          GROUP BY
            s.id,
            s.name

          ORDER BY
            accuracy DESC,
            answered_questions DESC;
          `,
          [userId]
        );

      // ==================================
      // TOPIC PERFORMANCE
      // ==================================

      const topicPerformanceResult =
        await pool.query(
          `
          WITH all_answers AS (

            SELECT
              pa.question_id,
              pa.is_correct

            FROM practice_answers pa

            JOIN practice_sessions ps
              ON pa.session_id = ps.id

            WHERE ps.user_id = $1

            UNION ALL

            SELECT
              mea.question_id,
              mea.is_correct

            FROM mock_exam_answers mea

            JOIN mock_exam_sessions mes
              ON mea.session_id = mes.id

            WHERE mes.user_id = $1
          )

          SELECT

            s.id AS subject_id,
            s.name AS subject_name,

            t.id AS topic_id,
            t.name AS topic_name,

            COUNT(*)
              AS answered_questions,

            COUNT(
              CASE
                WHEN aa.is_correct = TRUE
                THEN 1
              END
            ) AS correct_answers,

            COUNT(
              CASE
                WHEN aa.is_correct = FALSE
                THEN 1
              END
            ) AS incorrect_answers,

            CASE
              WHEN COUNT(*) = 0
              THEN 0

              ELSE ROUND(
                (
                  COUNT(
                    CASE
                      WHEN aa.is_correct = TRUE
                      THEN 1
                    END
                  )::numeric
                  /
                  COUNT(*)
                ) * 100,
                2
              )
            END AS accuracy

          FROM all_answers aa

          JOIN questions q
            ON aa.question_id = q.id

          JOIN topics t
            ON q.topic_id = t.id

          JOIN subjects s
            ON t.subject_id = s.id

          GROUP BY
            s.id,
            s.name,
            t.id,
            t.name

          ORDER BY
            accuracy ASC,
            answered_questions DESC;
          `,
          [userId]
        );

      // ==================================
      // SUBJECT ARRAY
      // ==================================

      const subjects =
        subjectPerformanceResult.rows;

      // ==================================
      // STRONGEST SUBJECT
      // ==================================

      const strongestSubject =
        subjects.length > 0
          ? subjects.reduce(
              (best, current) => {
                if (
                  Number(
                    current.answered_questions
                  ) > 0
                  &&
                  Number(
                    current.accuracy
                  ) >
                  Number(
                    best.accuracy
                  )
                ) {
                  return current;
                }

                return best;
              },
              subjects[0]
            )
          : null;

      // ==================================
      // WEAKEST SUBJECT
      // ==================================

      const weakestSubject =
        subjects.length > 0
          ? subjects.reduce(
              (weakest, current) => {
                if (
                  Number(
                    current.answered_questions
                  ) > 0
                  &&
                  Number(
                    current.accuracy
                  ) <
                  Number(
                    weakest.accuracy
                  )
                ) {
                  return current;
                }

                return weakest;
              },
              subjects[0]
            )
          : null;

      // ==================================
      // SAFE NUMBERS
      // ==================================

      const totalAnswered =
        Number(
          overall.total_answered
        ) || 0;

      const totalCorrect =
        Number(
          overall.total_correct
        ) || 0;

      const totalIncorrect =
        Number(
          overall.total_incorrect
        ) || 0;

      const overallAccuracy =
        totalAnswered > 0
          ? Number(
              (
                (
                  totalCorrect /
                  totalAnswered
                ) * 100
              ).toFixed(2)
            )
          : 0;

      // ==================================
      // RESPONSE
      // ==================================

      res.json({
        success: true,

        data: {
          overview: {
            total_answered:
              totalAnswered,

            total_correct:
              totalCorrect,

            total_incorrect:
              totalIncorrect,

            overall_accuracy:
              overallAccuracy,

            practice_answers:
              Number(
                overall.practice_answers
              ) || 0,

            mock_answers:
              Number(
                overall.mock_answers
              ) || 0,

            practice_correct:
              Number(
                overall.practice_correct
              ) || 0,

            mock_correct:
              Number(
                overall.mock_correct
              ) || 0,
          },

          session_performance:
            sessionPerformanceResult.rows,

          subject_performance:
            subjectPerformanceResult.rows,

          topic_performance:
            topicPerformanceResult.rows,

          strongest_subject:
            strongestSubject,

          weakest_subject:
            weakestSubject,
        },
      });

        } catch (error) {
      console.error(
        "Get dashboard analytics error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve dashboard analytics.",
      });
    }
  }
);


// ========================================
// GET PERFORMANCE TRENDS
// ========================================

router.get(
  "/analytics/trends",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        `
        WITH all_sessions AS (

          -- =================================
          -- PRACTICE SESSIONS
          -- =================================

          SELECT
            ps.id,
            'practice' AS type,
            ps.score,
            ps.total_questions,
            ps.completed_at

          FROM practice_sessions ps

          WHERE ps.user_id = $1
            AND ps.completed_at IS NOT NULL

          UNION ALL

          -- =================================
          -- MOCK EXAM SESSIONS
          -- =================================

          SELECT
            mes.id,
            'mock' AS type,
            mes.score,
            mes.total_questions,
            mes.completed_at

          FROM mock_exam_sessions mes

          WHERE mes.user_id = $1
            AND mes.completed_at IS NOT NULL
        )

        SELECT
          id,
          type,
          score,
          total_questions,
          completed_at,

          CASE
            WHEN total_questions > 0

            THEN ROUND(
              (
                score::numeric /
                total_questions::numeric
              ) * 100,
              2
            )

            ELSE 0
          END AS percentage

        FROM all_sessions

        ORDER BY completed_at ASC;
        `,
        [userId]
      );

      // ==================================
      // FORMAT SESSIONS
      // ==================================

      const sessions =
        result.rows.map(
          (session) => ({
            id:
              session.id,

            type:
              session.type,

            score:
              Number(
                session.score
              ) || 0,

            total_questions:
              Number(
                session.total_questions
              ) || 0,

            percentage:
              Number(
                session.percentage
              ) || 0,

            completed_at:
              session.completed_at,
          })
        );

      // ==================================
      // PERCENTAGES
      // ==================================

      const percentages =
        sessions.map(
          (session) =>
            Number(
              session.percentage
            ) || 0
        );

      // ==================================
      // LATEST SESSION
      // ==================================

      const latest =
        sessions.length > 0
          ? sessions[
              sessions.length - 1
            ]
          : null;

      // ==================================
      // PREVIOUS SESSION
      // ==================================

      const previous =
        sessions.length > 1
          ? sessions[
              sessions.length - 2
            ]
          : null;

      // ==================================
      // BEST SCORE
      // ==================================

      const best =
        sessions.length > 0
          ? Math.max(
              ...percentages
            )
          : 0;

      // ==================================
      // LOWEST SCORE
      // ==================================

      const lowest =
        sessions.length > 0
          ? Math.min(
              ...percentages
            )
          : 0;

      // ==================================
      // SCORE CHANGE
      // ==================================

      const change =
        latest && previous
          ? Number(
              latest.percentage
            ) -
            Number(
              previous.percentage
            )
          : 0;

      // ==================================
      // PRACTICE SESSIONS
      // ==================================

      const practiceSessions =
        sessions.filter(
          (session) =>
            session.type ===
            "practice"
        );

      // ==================================
      // MOCK SESSIONS
      // ==================================

      const mockSessions =
        sessions.filter(
          (session) =>
            session.type ===
            "mock"
        );

      // ==================================
      // TREND
      // ==================================

      let trend = "stable";

      if (change > 0) {
        trend = "up";
      } else if (change < 0) {
        trend = "down";
      }

      // ==================================
      // RESPONSE
      // ==================================

      res.json({
        success: true,

        data: {
          sessions,

          practice_sessions:
            practiceSessions,

          mock_sessions:
            mockSessions,

          summary: {
            total_sessions:
              sessions.length,

            latest_score:
              latest
                ? Number(
                    latest.percentage
                  )
                : 0,

            previous_score:
              previous
                ? Number(
                    previous.percentage
                  )
                : 0,

            best_score:
              best,

            lowest_score:
              lowest,

            change:
              Number(
                change.toFixed(2)
              ),

            trend,
          },
        },
      });

        } catch (error) {
      console.error(
        "Get performance trends error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve performance trends.",
      });
    }
  }
);


// ========================================
// GET MOCK EXAM HISTORY
// ========================================

router.get(
  "/mock-exams",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const result =
        await pool.query(
          `
          SELECT

            mes.id,
            mes.subject_id,

            s.name AS subject_name,

            mes.total_questions,
            mes.score,
            mes.duration_minutes,

            mes.started_at,
            mes.completed_at,

            CASE
              WHEN mes.total_questions > 0

              THEN ROUND(
                (
                  mes.score::numeric /
                  mes.total_questions
                ) * 100,
                2
              )

              ELSE 0
            END AS percentage

          FROM mock_exam_sessions mes

          LEFT JOIN subjects s
            ON mes.subject_id = s.id

          WHERE mes.user_id = $1
            AND mes.completed_at IS NOT NULL

          ORDER BY
            mes.completed_at DESC;
          `,
          [userId]
        );

      res.json({
        success: true,
        data: result.rows,
      });

        } catch (error) {
      console.error(
        "Get mock exam history error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve mock exam history.",
      });
    }
  }
);


// ========================================
// GET ALL USER HISTORY
// ========================================

router.get(
  "/history",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const result =
        await pool.query(
          `
          SELECT *

          FROM (

            -- ==========================
            -- PRACTICE SESSIONS
            -- ==========================

            SELECT

              ps.id,

              'practice' AS type,

              'Practice Session'
                AS type_label,

              NULL::integer
                AS subject_id,

              NULL::varchar
                AS subject_name,

              ps.score,
              ps.total_questions,

              CASE
                WHEN ps.total_questions > 0

                THEN ROUND(
                  (
                    ps.score::numeric /
                    ps.total_questions
                  ) * 100,
                  2
                )

                ELSE 0
              END AS percentage,

              NULL::integer
                AS duration_minutes,

              ps.completed_at

            FROM practice_sessions ps

            WHERE ps.user_id = $1
              AND ps.completed_at IS NOT NULL


            UNION ALL


            -- ==========================
            -- MOCK EXAMS
            -- ==========================

            SELECT

              mes.id,

              'mock' AS type,

              'Mock Exam'
                AS type_label,

              mes.subject_id,

              s.name AS subject_name,

              mes.score,
              mes.total_questions,

              CASE
                WHEN mes.total_questions > 0

                THEN ROUND(
                  (
                    mes.score::numeric /
                    mes.total_questions
                  ) * 100,
                  2
                )

                ELSE 0
              END AS percentage,

              mes.duration_minutes,

              mes.completed_at

            FROM mock_exam_sessions mes

            LEFT JOIN subjects s
              ON mes.subject_id = s.id

            WHERE mes.user_id = $1
              AND mes.completed_at IS NOT NULL

          ) history

          ORDER BY
            completed_at DESC;
          `,
          [userId]
        );

      res.json({
        success: true,
        data: result.rows,
      });

        } catch (error) {
      console.error(
        "Get history error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve history.",
      });
    }
  }
);


// ========================================
// GET MOCK EXAM RESULT DETAILS
// ========================================

router.get(
  "/history/mock/:id",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const sessionId =
        Number(
          req.params.id
        );

      // ==================================
      // VALIDATE ID
      // ==================================

      if (
        !Number.isInteger(
          sessionId
        ) ||
        sessionId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid mock exam ID.",
        });
      }

      // ==================================
      // SESSION
      // ==================================

      const sessionResult =
        await pool.query(
          `
          SELECT

            mes.id,
            mes.user_id,
            mes.subject_id,

            s.name AS subject_name,

            mes.total_questions,
            mes.score,
            mes.duration_minutes,

            mes.started_at,
            mes.completed_at

          FROM mock_exam_sessions mes

          LEFT JOIN subjects s
            ON mes.subject_id = s.id

          WHERE mes.id = $1
            AND mes.user_id = $2
            AND mes.completed_at IS NOT NULL

          LIMIT 1;
          `,
          [
            sessionId,
            userId,
          ]
        );

      // ==================================
      // SESSION NOT FOUND
      // ==================================

      if (
        sessionResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Mock exam result not found.",
        });
      }

      const session =
        sessionResult.rows[0];

      // ==================================
      // ANSWERS
      // ==================================

      const answersResult =
        await pool.query(
          `
          SELECT

            mea.question_id,
            mea.choice_id,
            mea.is_correct,
            mea.answered_at,

            q.question_text,
            q.explanation,

            selected_choice.choice_text
              AS selected_choice_text,

            correct_choice.choice_text
              AS correct_choice_text

          FROM mock_exam_answers mea

          JOIN questions q
            ON mea.question_id = q.id

          LEFT JOIN choices selected_choice
            ON mea.choice_id =
               selected_choice.id

          LEFT JOIN choices correct_choice
            ON correct_choice.question_id =
               q.id

            AND correct_choice.is_correct =
               TRUE

          WHERE mea.session_id = $1

          ORDER BY
            mea.question_id ASC;
          `,
          [sessionId]
        );

      // ==================================
      // RESPONSE
      // ==================================

      res.json({
        success: true,

        data: {
          session,

          answers:
            answersResult.rows,
        },
      });

        } catch (error) {
      console.error(
        "Get mock exam result details error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve mock exam result.",
      });
    }
  }
);


// ========================================
// EXPORT ROUTER
// ========================================

module.exports = router;