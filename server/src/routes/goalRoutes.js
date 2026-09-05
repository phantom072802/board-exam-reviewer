const express = require("express");
const pool = require("../config/database");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET ALL GOALS
|--------------------------------------------------------------------------
| GET /api/goals
|--------------------------------------------------------------------------
*/

router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        target_questions,
        target_accuracy,
        start_date,
        end_date,
        status,
        created_at,
        updated_at
      FROM study_goals
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get study goals error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve study goals.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET ACTIVE GOAL
|--------------------------------------------------------------------------
| GET /api/goals/active
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This endpoint now returns:
| - goal
| - progress
| - practice breakdown
| - mock exam breakdown
|
| This fixes the issue where the frontend showed:
| Practice: 0
| Mock Exams: 0
|--------------------------------------------------------------------------
*/

router.get("/active", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    /*
    |--------------------------------------------------------------------------
    | Get Active Goal
    |--------------------------------------------------------------------------
    */

    const goalResult = await pool.query(
      `
      SELECT
        id,
        target_questions,
        target_accuracy,
        start_date,
        end_date,
        status,
        created_at,
        updated_at
      FROM study_goals
      WHERE user_id = $1
        AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId]
    );

    /*
    |--------------------------------------------------------------------------
    | No Active Goal
    |--------------------------------------------------------------------------
    */

    if (goalResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const goal = goalResult.rows[0];

    const goalStartDate = goal.start_date;
    const goalEndDate = goal.end_date || null;

    /*
    |--------------------------------------------------------------------------
    | PRACTICE ANSWERS
    |--------------------------------------------------------------------------
    |
    | Only completed practice sessions are counted.
    |
    | The session must:
    | - belong to the current user
    | - be completed
    | - be on/after the goal start date
    | - be on/before the goal end date if one exists
    |
    */

    const practiceResult = await pool.query(
      `
      SELECT
        COUNT(*) AS answered,

        COUNT(*) FILTER (
          WHERE pa.is_correct = true
        ) AS correct

      FROM practice_answers pa

      INNER JOIN practice_sessions ps
        ON ps.id = pa.session_id

      WHERE ps.user_id = $1

        AND ps.completed_at IS NOT NULL

        AND ps.completed_at::date >= $2::date

        AND (
          $3::date IS NULL
          OR ps.completed_at::date <= $3::date
        )
      `,
      [
        userId,
        goalStartDate,
        goalEndDate,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | MOCK EXAM ANSWERS
    |--------------------------------------------------------------------------
    |
    | Only completed mock exams are counted.
    |
    */

    const mockResult = await pool.query(
      `
      SELECT
        COUNT(*) AS answered,

        COUNT(*) FILTER (
          WHERE mea.is_correct = true
        ) AS correct

      FROM mock_exam_answers mea

      INNER JOIN mock_exam_sessions mes
        ON mes.id = mea.session_id

      WHERE mes.user_id = $1

        AND mes.completed_at IS NOT NULL

        AND mes.completed_at::date >= $2::date

        AND (
          $3::date IS NULL
          OR mes.completed_at::date <= $3::date
        )
      `,
      [
        userId,
        goalStartDate,
        goalEndDate,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Convert Database Values
    |--------------------------------------------------------------------------
    */

    const practiceAnswered =
      Number(
        practiceResult.rows[0].answered
      ) || 0;

    const practiceCorrect =
      Number(
        practiceResult.rows[0].correct
      ) || 0;

    const mockAnswered =
      Number(
        mockResult.rows[0].answered
      ) || 0;

    const mockCorrect =
      Number(
        mockResult.rows[0].correct
      ) || 0;

    /*
    |--------------------------------------------------------------------------
    | Combined Totals
    |--------------------------------------------------------------------------
    */

    const totalAnswered =
      practiceAnswered +
      mockAnswered;

    const totalCorrect =
      practiceCorrect +
      mockCorrect;

    const totalIncorrect =
      Math.max(
        totalAnswered -
          totalCorrect,
        0
      );

    /*
    |--------------------------------------------------------------------------
    | Goal Targets
    |--------------------------------------------------------------------------
    */

    const targetQuestions =
      Number(
        goal.target_questions
      ) || 0;

    const targetAccuracy =
      Number(
        goal.target_accuracy
      ) || 0;

    /*
    |--------------------------------------------------------------------------
    | Question Progress
    |--------------------------------------------------------------------------
    */

    const questionsRemaining =
      Math.max(
        targetQuestions -
          totalAnswered,
        0
      );

    const questionProgress =
      targetQuestions > 0
        ? Math.min(
            (
              totalAnswered /
              targetQuestions
            ) * 100,
            100
          )
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Accuracy
    |--------------------------------------------------------------------------
    */

    const accuracy =
      totalAnswered > 0
        ? (
            totalCorrect /
            totalAnswered
          ) * 100
        : 0;

    const accuracyProgress =
      targetAccuracy > 0
        ? Math.min(
            (
              accuracy /
              targetAccuracy
            ) * 100,
            100
          )
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Goal Completion
    |--------------------------------------------------------------------------
    */

    const questionsGoalReached =
      totalAnswered >=
      targetQuestions;

    const accuracyGoalReached =
      accuracy >=
      targetAccuracy;

    const completed =
      questionsGoalReached &&
      accuracyGoalReached;

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.json({
      success: true,

      data: {
        goal: {
          id: goal.id,

          target_questions:
            targetQuestions,

          target_accuracy:
            targetAccuracy,

          start_date:
            goal.start_date,

          end_date:
            goal.end_date,

          status:
            goal.status,

          created_at:
            goal.created_at,

          updated_at:
            goal.updated_at,
        },

        progress: {
          questions_answered:
            totalAnswered,

          questions_remaining:
            questionsRemaining,

          question_progress:
            Number(
              questionProgress.toFixed(2)
            ),

          correct_answers:
            totalCorrect,

          incorrect_answers:
            totalIncorrect,

          accuracy:
            Number(
              accuracy.toFixed(2)
            ),

          accuracy_target:
            targetAccuracy,

          accuracy_progress:
            Number(
              accuracyProgress.toFixed(2)
            ),

          completed,
        },

        breakdown: {
          practice: {
            questions_answered:
              practiceAnswered,

            correct_answers:
              practiceCorrect,

            incorrect_answers:
              Math.max(
                practiceAnswered -
                  practiceCorrect,
                0
              ),
          },

          mock_exam: {
            questions_answered:
              mockAnswered,

            correct_answers:
              mockCorrect,

            incorrect_answers:
              Math.max(
                mockAnswered -
                  mockCorrect,
                0
              ),
          },
        },
      },
    });
  } catch (error) {
    console.error(
      "Get active study goal error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to retrieve active study goal.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| CREATE GOAL
|--------------------------------------------------------------------------
| POST /api/goals
|--------------------------------------------------------------------------
*/

router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      target_questions,
      target_accuracy,
      start_date,
      end_date,
    } = req.body;

    const targetQuestions =
      Number(target_questions);

    const targetAccuracy =
      Number(target_accuracy);

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isInteger(
        targetQuestions
      ) ||
      targetQuestions <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Target questions must be a whole number greater than 0.",
      });
    }

    if (
      Number.isNaN(
        targetAccuracy
      ) ||
      targetAccuracy < 0 ||
      targetAccuracy > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Target accuracy must be between 0 and 100.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Date Range
    |--------------------------------------------------------------------------
    */

    if (
      start_date &&
      end_date &&
      new Date(start_date) >
        new Date(end_date)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date cannot be earlier than the start date.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Existing Active Goal
    |--------------------------------------------------------------------------
    */

    const existingGoal =
      await pool.query(
        `
        SELECT id
        FROM study_goals
        WHERE user_id = $1
          AND status = 'active'
        LIMIT 1
        `,
        [userId]
      );

    if (
      existingGoal.rows.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You already have an active study goal. Complete or cancel it before creating another one.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Goal
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(
        `
        INSERT INTO study_goals (
          user_id,
          target_questions,
          target_accuracy,
          start_date,
          end_date,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          COALESCE(
            $4::date,
            CURRENT_DATE
          ),
          $5::date,
          'active'
        )
        RETURNING
          id,
          target_questions,
          target_accuracy,
          start_date,
          end_date,
          status,
          created_at,
          updated_at
        `,
        [
          userId,
          targetQuestions,
          targetAccuracy,
          start_date || null,
          end_date || null,
        ]
      );

    res.status(201).json({
      success: true,
      message:
        "Study goal created successfully.",
      data:
        result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create study goal error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create study goal.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET ACTIVE GOAL PROGRESS
|--------------------------------------------------------------------------
| GET /api/goals/progress
|--------------------------------------------------------------------------
|
| Counts:
| - Practice answers
| - Mock exam answers
|
| Only completed sessions inside the
| goal date range are counted.
|--------------------------------------------------------------------------
*/

router.get(
  "/progress",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;

      /*
      |--------------------------------------------------------------------------
      | Get Active Goal
      |--------------------------------------------------------------------------
      */

      const goalResult =
        await pool.query(
          `
          SELECT
            id,
            target_questions,
            target_accuracy,
            start_date,
            end_date,
            status,
            created_at,
            updated_at
          FROM study_goals
          WHERE user_id = $1
            AND status = 'active'
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [userId]
        );

      /*
      |--------------------------------------------------------------------------
      | No Active Goal
      |--------------------------------------------------------------------------
      */

      if (
        goalResult.rows.length === 0
      ) {
        return res.json({
          success: true,

          data: {
            goal: null,

            progress: {
              questions_answered: 0,
              questions_remaining: 0,
              question_progress: 0,
              correct_answers: 0,
              incorrect_answers: 0,
              accuracy: 0,
              accuracy_target: 0,
              accuracy_progress: 0,
              completed: false,
            },

            breakdown: {
              practice: {
                questions_answered: 0,
                correct_answers: 0,
                incorrect_answers: 0,
              },

              mock_exam: {
                questions_answered: 0,
                correct_answers: 0,
                incorrect_answers: 0,
              },
            },
          },
        });
      }

      const goal =
        goalResult.rows[0];

      const goalStartDate =
        goal.start_date;

      /*
      |--------------------------------------------------------------------------
      | Practice Answers
      |--------------------------------------------------------------------------
      */

      const practiceResult =
        await pool.query(
          `
          SELECT
            COUNT(*) AS answered,

            COUNT(*) FILTER (
              WHERE pa.is_correct = true
            ) AS correct

          FROM practice_answers pa

          INNER JOIN practice_sessions ps
            ON ps.id = pa.session_id

          WHERE ps.user_id = $1

            AND ps.completed_at IS NOT NULL

            AND ps.completed_at::date >= $2::date

            AND (
              $3::date IS NULL
              OR ps.completed_at::date <= $3::date
            )
          `,
          [
            userId,
            goalStartDate,
            goal.end_date || null,
          ]
        );

      /*
      |--------------------------------------------------------------------------
      | Mock Exam Answers
      |--------------------------------------------------------------------------
      */

      const mockResult =
        await pool.query(
          `
          SELECT
            COUNT(*) AS answered,

            COUNT(*) FILTER (
              WHERE mea.is_correct = true
            ) AS correct

          FROM mock_exam_answers mea

          INNER JOIN mock_exam_sessions mes
            ON mes.id = mea.session_id

          WHERE mes.user_id = $1

            AND mes.completed_at IS NOT NULL

            AND mes.completed_at::date >= $2::date

            AND (
              $3::date IS NULL
              OR mes.completed_at::date <= $3::date
            )
          `,
          [
            userId,
            goalStartDate,
            goal.end_date || null,
          ]
        );

      /*
      |--------------------------------------------------------------------------
      | Convert Values
      |--------------------------------------------------------------------------
      */

      const practiceAnswered =
        Number(
          practiceResult.rows[0]
            .answered
        ) || 0;

      const practiceCorrect =
        Number(
          practiceResult.rows[0]
            .correct
        ) || 0;

      const mockAnswered =
        Number(
          mockResult.rows[0]
            .answered
        ) || 0;

      const mockCorrect =
        Number(
          mockResult.rows[0]
            .correct
        ) || 0;

      /*
      |--------------------------------------------------------------------------
      | Combined Totals
      |--------------------------------------------------------------------------
      */

      const totalAnswered =
        practiceAnswered +
        mockAnswered;

      const totalCorrect =
        practiceCorrect +
        mockCorrect;

      const totalIncorrect =
        totalAnswered -
        totalCorrect;

      /*
      |--------------------------------------------------------------------------
      | Question Progress
      |--------------------------------------------------------------------------
      */

      const targetQuestions =
        Number(
          goal.target_questions
        ) || 0;

      const questionsRemaining =
        Math.max(
          targetQuestions -
            totalAnswered,
          0
        );

      const questionProgress =
        targetQuestions > 0
          ? Math.min(
              (
                totalAnswered /
                targetQuestions
              ) * 100,
              100
            )
          : 0;

      /*
      |--------------------------------------------------------------------------
      | Accuracy
      |--------------------------------------------------------------------------
      */

      const accuracy =
        totalAnswered > 0
          ? (
              totalCorrect /
              totalAnswered
            ) * 100
          : 0;

      const targetAccuracy =
        Number(
          goal.target_accuracy
        ) || 0;

      const accuracyProgress =
        targetAccuracy > 0
          ? Math.min(
              (
                accuracy /
                targetAccuracy
              ) * 100,
              100
            )
          : 0;

      /*
      |--------------------------------------------------------------------------
      | Goal Completion
      |--------------------------------------------------------------------------
      */

      const questionsGoalReached =
        totalAnswered >=
        targetQuestions;

      const accuracyGoalReached =
        accuracy >=
        targetAccuracy;

      const completed =
        questionsGoalReached &&
        accuracyGoalReached;

      /*
      |--------------------------------------------------------------------------
      | Automatically Complete Goal
      |--------------------------------------------------------------------------
      */

      if (completed) {
        await pool.query(
          `
          UPDATE study_goals
          SET
            status = 'completed',
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $1
            AND user_id = $2
          `,
          [
            goal.id,
            userId,
          ]
        );

        goal.status =
          "completed";
      }

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      res.json({
        success: true,

        data: {
          goal: {
            id: goal.id,

            target_questions:
              targetQuestions,

            target_accuracy:
              targetAccuracy,

            start_date:
              goal.start_date,

            end_date:
              goal.end_date,

            status:
              goal.status,

            created_at:
              goal.created_at,

            updated_at:
              goal.updated_at,
          },

          progress: {
            questions_answered:
              totalAnswered,

            questions_remaining:
              questionsRemaining,

            question_progress:
              Number(
                questionProgress.toFixed(
                  2
                )
              ),

            correct_answers:
              totalCorrect,

            incorrect_answers:
              totalIncorrect,

            accuracy:
              Number(
                accuracy.toFixed(
                  2
                )
              ),

            accuracy_target:
              targetAccuracy,

            accuracy_progress:
              Number(
                accuracyProgress.toFixed(
                  2
                )
              ),

            completed,
          },

          breakdown: {
            practice: {
              questions_answered:
                practiceAnswered,

              correct_answers:
                practiceCorrect,

              incorrect_answers:
                Math.max(
                  practiceAnswered -
                    practiceCorrect,
                  0
                ),
            },

            mock_exam: {
              questions_answered:
                mockAnswered,

              correct_answers:
                mockCorrect,

              incorrect_answers:
                Math.max(
                  mockAnswered -
                    mockCorrect,
                  0
                ),
            },
          },
        },
      });
    } catch (error) {
      console.error(
        "Get study goal progress error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to calculate study goal progress.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE GOAL
|--------------------------------------------------------------------------
| PUT /api/goals/:id
|--------------------------------------------------------------------------
*/

router.put(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const goalId =
        Number(req.params.id);

      if (
        !Number.isInteger(goalId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid goal ID.",
        });
      }

      const {
        target_questions,
        target_accuracy,
        start_date,
        end_date,
        status,
      } = req.body;

      const targetQuestions =
        Number(
          target_questions
        );

      const targetAccuracy =
        Number(
          target_accuracy
        );

      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isInteger(
          targetQuestions
        ) ||
        targetQuestions <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Target questions must be a whole number greater than 0.",
        });
      }

      if (
        Number.isNaN(
          targetAccuracy
        ) ||
        targetAccuracy < 0 ||
        targetAccuracy > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Target accuracy must be between 0 and 100.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Date Validation
      |--------------------------------------------------------------------------
      */

      if (
        start_date &&
        end_date &&
        new Date(start_date) >
          new Date(end_date)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "End date cannot be earlier than the start date.",
        });
      }

      const allowedStatuses = [
        "active",
        "completed",
        "cancelled",
      ];

      if (
        status !== undefined &&
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid goal status.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Verify Ownership
      |--------------------------------------------------------------------------
      */

      const existingGoal =
        await pool.query(
          `
          SELECT id
          FROM study_goals
          WHERE id = $1
            AND user_id = $2
          `,
          [
            goalId,
            userId,
          ]
        );

      if (
        existingGoal.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Study goal not found.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent Multiple Active Goals
      |--------------------------------------------------------------------------
      */

      if (
        status === "active"
      ) {
        const anotherActiveGoal =
          await pool.query(
            `
            SELECT id
            FROM study_goals
            WHERE user_id = $1
              AND status = 'active'
              AND id <> $2
            LIMIT 1
            `,
            [
              userId,
              goalId,
            ]
          );

        if (
          anotherActiveGoal.rows
            .length > 0
        ) {
          return res.status(409).json({
            success: false,
            message:
              "You already have another active study goal.",
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Update Goal
      |--------------------------------------------------------------------------
      */

      const result =
        await pool.query(
          `
          UPDATE study_goals
          SET
            target_questions =
              $1,

            target_accuracy =
              $2,

            start_date =
              COALESCE(
                $3::date,
                start_date
              ),

            end_date =
              $4::date,

            status =
              COALESCE(
                $5,
                status
              ),

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $6
            AND user_id = $7

          RETURNING
            id,
            target_questions,
            target_accuracy,
            start_date,
            end_date,
            status,
            created_at,
            updated_at
          `,
          [
            targetQuestions,
            targetAccuracy,
            start_date || null,
            end_date || null,
            status || null,
            goalId,
            userId,
          ]
        );

      res.json({
        success: true,
        message:
          "Study goal updated successfully.",
        data:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Update study goal error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update study goal.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE GOAL
|--------------------------------------------------------------------------
| DELETE /api/goals/:id
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const goalId =
        Number(req.params.id);

      if (
        !Number.isInteger(goalId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid goal ID.",
        });
      }

      const result =
        await pool.query(
          `
          DELETE FROM study_goals
          WHERE id = $1
            AND user_id = $2
          RETURNING id
          `,
          [
            goalId,
            userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Study goal not found.",
        });
      }

      res.json({
        success: true,
        message:
          "Study goal deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete study goal error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete study goal.",
      });
    }
  }
);

module.exports = router;