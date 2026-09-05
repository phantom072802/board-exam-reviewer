import { useEffect, useState } from "react";

import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiTarget,
  FiTrash2,
  FiBookOpen,
  FiAward,
  FiActivity,
} from "react-icons/fi";

import api from "../services/api";


function Notifications() {

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const loadNotifications =
    async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/notifications"
          );

        const data =
          response.data?.data || {};

        setNotifications(
          data.notifications || []
        );

        setUnreadCount(
          Number(
            data.unread_count
          ) || 0
        );

      } catch (err) {

        console.error(
          "Load notifications error:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Failed to load notifications."
        );

      } finally {

        setLoading(false);

      }
    };


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    loadNotifications();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | MARK READ
  |--------------------------------------------------------------------------
  */

  const markAsRead =
    async (notification) => {

      if (
        notification.is_read
      ) {
        return;
      }

      try {

        await api.put(
          `/notifications/${notification.id}/read`
        );

        setNotifications(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                notification.id
                  ? {
                      ...item,
                      is_read: true,
                    }
                  : item
            )
        );

        setUnreadCount(
          (previous) =>
            Math.max(
              previous - 1,
              0
            )
        );

      } catch (err) {

        console.error(
          "Mark notification read error:",
          err
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | MARK ALL READ
  |--------------------------------------------------------------------------
  */

  const markAllAsRead =
    async () => {

      if (
        unreadCount === 0
      ) {
        return;
      }

      try {

        await api.put(
          "/notifications/read-all"
        );

        setNotifications(
          (previous) =>
            previous.map(
              (notification) => ({
                ...notification,
                is_read: true,
              })
            )
        );

        setUnreadCount(0);

      } catch (err) {

        console.error(
          "Mark all notifications read error:",
          err
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const deleteNotification =
    async (notificationId) => {

      try {

        const notification =
          notifications.find(
            (item) =>
              item.id ===
              notificationId
          );

        await api.delete(
          `/notifications/${notificationId}`
        );

        setNotifications(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                notificationId
            )
        );

        if (
          notification &&
          !notification.is_read
        ) {
          setUnreadCount(
            (previous) =>
              Math.max(
                previous - 1,
                0
              )
          );
        }

      } catch (err) {

        console.error(
          "Delete notification error:",
          err
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | FORMAT DATE
  |--------------------------------------------------------------------------
  */

  const formatDate =
    (value) => {

      if (!value) {
        return "";
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }

      return date.toLocaleString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      );
    };


  /*
  |--------------------------------------------------------------------------
  | ICON
  |--------------------------------------------------------------------------
  */

  const getNotificationIcon =
    (type) => {

      switch (type) {

        case "practice":
          return <FiBookOpen />;

        case "mock":
          return <FiAward />;

        case "goal":
          return <FiTarget />;

        case "streak":
          return <FiActivity />;

        case "reminder":
          return <FiClock />;

        case "success":
          return <FiCheckCircle />;

        default:
          return <FiBell />;
      }
    };


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (
      <div className="notifications-page">

        <div className="notifications-loading">

          <div className="notifications-loading-icon">
            <FiBell />
          </div>

          <p>
            Loading notifications...
          </p>

        </div>

      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {

    return (
      <div className="notifications-page">

        <div className="notifications-error">

          <div className="notifications-error-icon">
            <FiBell />
          </div>

          <h2>
            Unable to load notifications
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="notifications-primary-button"
            onClick={loadNotifications}
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="notifications-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="notifications-header">

        <div>

          <p className="notifications-eyebrow">
            NOTIFICATIONS
          </p>

          <h1>
            Notifications
          </h1>

          <p>
            Stay updated with your study
            progress, goals, and reminders.
          </p>

        </div>


        {unreadCount > 0 && (

          <button
            type="button"
            className="notifications-mark-all"
            onClick={markAllAsRead}
          >

            <FiCheck />

            Mark all as read

          </button>

        )}

      </div>


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="notifications-summary">

        <div className="notifications-summary-card">

          <div className="notifications-summary-icon">
            <FiBell />
          </div>

          <div>

            <span>
              Total Notifications
            </span>

            <strong>
              {notifications.length}
            </strong>

          </div>

        </div>


        <div className="notifications-summary-card">

          <div className="notifications-summary-icon">
            <FiActivity />
          </div>

          <div>

            <span>
              Unread
            </span>

            <strong>
              {unreadCount}
            </strong>

          </div>

        </div>

      </div>


      {/* =================================================
          LIST
      ================================================= */}

      {notifications.length === 0 ? (

        <div className="notifications-empty">

          <div className="notifications-empty-icon">
            <FiBell />
          </div>

          <h2>
            You're all caught up
          </h2>

          <p>
            New study reminders and
            progress updates will appear
            here.
          </p>

        </div>

      ) : (

        <div className="notifications-list">

          {notifications.map(
            (notification) => (

              <article
                key={notification.id}
                className={
                  notification.is_read
                    ? "notification-card"
                    : "notification-card unread"
                }
                onClick={() =>
                  markAsRead(
                    notification
                  )
                }
              >

                <div className="notification-icon">

                  {getNotificationIcon(
                    notification.type
                  )}

                </div>


                <div className="notification-content">

                  <div className="notification-title-row">

                    <h3>
                      {notification.title}
                    </h3>

                    {!notification.is_read && (
                      <span className="notification-unread-dot" />
                    )}

                  </div>


                  <p>
                    {notification.message}
                  </p>


                  <span className="notification-date">

                    {formatDate(
                      notification.created_at
                    )}

                  </span>

                </div>


                <button
                  type="button"
                  className="notification-delete"
                  onClick={(event) => {
                    event.stopPropagation();

                    deleteNotification(
                      notification.id
                    );
                  }}
                  title="Delete notification"
                  aria-label="Delete notification"
                >

                  <FiTrash2 />

                </button>

              </article>

            )
          )}

        </div>

      )}

    </div>
  );
}


export default Notifications;