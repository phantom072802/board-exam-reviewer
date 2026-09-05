const express = require("express");

const pool = require("../config/database");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  createNotification,
} = require("../utils/notifications");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| GET NOTIFICATIONS
|--------------------------------------------------------------------------
|
| Returns the user's latest notifications.
|
*/

router.get(
  "/",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.id;

      /*
      |--------------------------------------------------------------------------
      | GET NOTIFICATIONS
      |--------------------------------------------------------------------------
      */

      const result =
        await pool.query(
          `
          SELECT
            id,
            type,
            title,
            message,
            is_read,
            created_at
          FROM notifications
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 50
          `,
          [userId]
        );


      /*
      |--------------------------------------------------------------------------
      | UNREAD COUNT
      |--------------------------------------------------------------------------
      */

      const unreadResult =
        await pool.query(
          `
          SELECT COUNT(*) AS unread_count
          FROM notifications
          WHERE user_id = $1
            AND is_read = FALSE
          `,
          [userId]
        );


      const unreadCount =
        Number(
          unreadResult.rows[0]
            ?.unread_count
        ) || 0;


      res.json({
        success: true,

        data: {
          notifications:
            result.rows,

          unread_count:
            unreadCount,
        },
      });

    } catch (error) {

      console.error(
        "Get notifications error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retrieve notifications.",
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| CREATE NOTIFICATION
|--------------------------------------------------------------------------
|
| Internal/user-triggered notification.
|
*/

router.post(
  "/",
  protect,
  async (req, res) => {
    try {

      const userId =
        req.user.id;

      const {
        type,
        title,
        message,
      } = req.body;


      if (
        !title ||
        !message
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Title and message are required.",
        });
      }


      const notification =
        await createNotification(
          userId,
          type || "system",
          title,
          message
        );


      res.status(201).json({
        success: true,
        data: notification,
      });

    } catch (error) {

      console.error(
        "Create notification error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create notification.",
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| MARK ONE AS READ
|--------------------------------------------------------------------------
*/

router.put(
  "/:id/read",
  protect,
  async (req, res) => {
    try {

      const userId =
        req.user.id;

      const notificationId =
        Number(req.params.id);


      if (
        !Number.isInteger(
          notificationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID.",
        });
      }


      const result =
        await pool.query(
          `
          UPDATE notifications
          SET is_read = TRUE
          WHERE id = $1
            AND user_id = $2
          RETURNING
            id,
            type,
            title,
            message,
            is_read,
            created_at
          `,
          [
            notificationId,
            userId,
          ]
        );


      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }


      res.json({
        success: true,
        data:
          result.rows[0],
      });

    } catch (error) {

      console.error(
        "Mark notification read error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update notification.",
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| MARK ALL AS READ
|--------------------------------------------------------------------------
*/

router.put(
  "/read-all",
  protect,
  async (req, res) => {
    try {

      const userId =
        req.user.id;


      await pool.query(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1
          AND is_read = FALSE
        `,
        [userId]
      );


      res.json({
        success: true,
        message:
          "All notifications marked as read.",
      });

    } catch (error) {

      console.error(
        "Mark all notifications read error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update notifications.",
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| DELETE NOTIFICATION
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {

      const userId =
        req.user.id;

      const notificationId =
        Number(req.params.id);


      if (
        !Number.isInteger(
          notificationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID.",
        });
      }


      const result =
        await pool.query(
          `
          DELETE FROM notifications
          WHERE id = $1
            AND user_id = $2
          RETURNING id
          `,
          [
            notificationId,
            userId,
          ]
        );


      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }


      res.json({
        success: true,
        message:
          "Notification deleted.",
      });

    } catch (error) {

      console.error(
        "Delete notification error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete notification.",
      });
    }
  }
);


module.exports = router;