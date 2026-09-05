import { useEffect, useState } from "react";
import {
  FiLock,
  FiSave,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

import api from "../services/api";

function Settings() {
  // ========================================
  // SETTINGS STATE
  // ========================================

  const [appearance, setAppearance] =
    useState("Light");

  const [showExplanations, setShowExplanations] =
    useState(true);

  const [studyReminders, setStudyReminders] =
    useState(true);

  const [settingsMessage, setSettingsMessage] =
    useState("");

  // ========================================
  // PASSWORD STATE
  // ========================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");


  // ========================================
  // LOAD SETTINGS
  // ========================================

  useEffect(() => {
    const savedAppearance =
      localStorage.getItem(
        "boardprep_appearance"
      );

    const savedExplanations =
      localStorage.getItem(
        "boardprep_explanations"
      );

    const savedReminders =
      localStorage.getItem(
        "boardprep_reminders"
      );

    if (savedAppearance) {
      setAppearance(savedAppearance);
    }

    if (savedExplanations !== null) {
      setShowExplanations(
        savedExplanations === "true"
      );
    }

    if (savedReminders !== null) {
      setStudyReminders(
        savedReminders === "true"
      );
    }
  }, []);


  // ========================================
  // SAVE SETTINGS
  // ========================================

  const handleSaveSettings = () => {
    localStorage.setItem(
      "boardprep_appearance",
      appearance
    );

    localStorage.setItem(
      "boardprep_explanations",
      String(showExplanations)
    );

    localStorage.setItem(
      "boardprep_reminders",
      String(studyReminders)
    );

    setSettingsMessage(
      "Settings saved successfully."
    );

    setTimeout(() => {
      setSettingsMessage("");
    }, 3000);
  };


  // ========================================
  // CHANGE PASSWORD
  // ========================================

  const handleChangePassword = async (
    event
  ) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    // ==================================
    // VALIDATION
    // ==================================

    if (!currentPassword) {
      setPasswordError(
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword) {
      setPasswordError(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    // ==================================
    // SEND REQUEST
    // ==================================

    try {
      setPasswordSaving(true);

      const response = await api.put(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
        }
      );

      setPasswordMessage(
        response.data.message ||
          "Password changed successfully."
      );

      // Clear fields after successful change
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error(
        "Change password error:",
        err
      );

      setPasswordError(
        err.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };


  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="page">

      {/* ================================== */}
      {/* PAGE HEADER */}
      {/* ================================== */}

      <div className="page-header">
        <div>
          <p className="eyebrow">
            Account
          </p>

          <h1>Settings</h1>

          <p className="page-description">
            Customize your reviewer experience.
          </p>
        </div>
      </div>


      {/* ================================== */}
      {/* SETTINGS SUCCESS */}
      {/* ================================== */}

      {settingsMessage && (
        <div className="profile-message">
          {settingsMessage}
        </div>
      )}


      {/* ================================== */}
      {/* GENERAL SETTINGS */}
      {/* ================================== */}

      <section className="content-card settings-card">

        {/* ================================= */}
        {/* APPEARANCE */}
        {/* ================================= */}

        <div className="settings-section">

          <div>
            <h2>
              Appearance
            </h2>

            <p>
              Choose how BoardPrep looks
              on your device.
            </p>
          </div>

          <select
            value={appearance}
            onChange={(event) =>
              setAppearance(
                event.target.value
              )
            }
          >
            <option value="Light">
              Light
            </option>

            <option value="Dark">
              Dark
            </option>

            <option value="System Default">
              System Default
            </option>
          </select>

        </div>


        {/* ================================= */}
        {/* EXPLANATIONS */}
        {/* ================================= */}

        <div className="settings-section">

          <div>
            <h2>
              Question explanations
            </h2>

            <p>
              Show explanations after
              answering a question.
            </p>
          </div>

          <label className="switch">

            <input
              type="checkbox"
              checked={showExplanations}
              onChange={(event) =>
                setShowExplanations(
                  event.target.checked
                )
              }
            />

            <span />

          </label>

        </div>


        {/* ================================= */}
        {/* STUDY REMINDERS */}
        {/* ================================= */}

        <div className="settings-section">

          <div>
            <h2>
              Study reminders
            </h2>

            <p>
              Receive reminders about
              your study progress.
            </p>
          </div>

          <label className="switch">

            <input
              type="checkbox"
              checked={studyReminders}
              onChange={(event) =>
                setStudyReminders(
                  event.target.checked
                )
              }
            />

            <span />

          </label>

        </div>


        {/* ================================= */}
        {/* SAVE SETTINGS */}
        {/* ================================= */}

        <div className="settings-save">

          <button
            type="button"
            className="primary-button"
            onClick={
              handleSaveSettings
            }
          >
            <FiSave />
            Save Settings
          </button>

        </div>

      </section>


      {/* ================================== */}
      {/* SECURITY */}
      {/* ================================== */}

      <section className="content-card settings-security-card">

        <div className="settings-security-header">

          <div className="settings-security-icon">
            <FiLock />
          </div>

          <div>
            <h2>
              Change Password
            </h2>

            <p>
              Update your password to keep
              your BoardPrep account secure.
            </p>
          </div>

        </div>


        {/* ================================= */}
        {/* PASSWORD SUCCESS */}
        {/* ================================= */}

        {passwordMessage && (
          <div className="profile-message">
            {passwordMessage}
          </div>
        )}


        {/* ================================= */}
        {/* PASSWORD ERROR */}
        {/* ================================= */}

        {passwordError && (
          <div className="dashboard-error">
            {passwordError}
          </div>
        )}


        {/* ================================= */}
        {/* PASSWORD FORM */}
        {/* ================================= */}

        <form
          className="password-form"
          onSubmit={
            handleChangePassword
          }
        >

          {/* CURRENT PASSWORD */}

          <div className="profile-form-group">

            <label htmlFor="current-password">
              Current Password
            </label>

            <div className="password-input-wrapper">

              <input
                id="current-password"
                type={
                  showCurrentPassword
                    ? "text"
                    : "password"
                }
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value
                  )
                }
                placeholder="Enter current password"
                disabled={passwordSaving}
              />

              <button
                type="button"
                className="password-visibility-button"
                onClick={() =>
                  setShowCurrentPassword(
                    (previous) =>
                      !previous
                  )
                }
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <FiEyeOff />
                ) : (
                  <FiEye />
                )}
              </button>

            </div>

          </div>


          {/* NEW PASSWORD */}

          <div className="profile-form-group">

            <label htmlFor="new-password">
              New Password
            </label>

            <div className="password-input-wrapper">

              <input
                id="new-password"
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                disabled={passwordSaving}
              />

              <button
                type="button"
                className="password-visibility-button"
                onClick={() =>
                  setShowNewPassword(
                    (previous) =>
                      !previous
                  )
                }
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <FiEyeOff />
                ) : (
                  <FiEye />
                )}
              </button>

            </div>

            <small className="password-hint">
              Password must be at least
              6 characters.
            </small>

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="profile-form-group">

            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <div className="password-input-wrapper">

              <input
                id="confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm new password"
                disabled={passwordSaving}
              />

              <button
                type="button"
                className="password-visibility-button"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) =>
                      !previous
                  )
                }
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <FiEyeOff />
                ) : (
                  <FiEye />
                )}
              </button>

            </div>

          </div>


          {/* SUBMIT */}

          <div className="password-form-actions">

            <button
              type="submit"
              className="primary-button"
              disabled={passwordSaving}
            >
              <FiLock />

              {passwordSaving
                ? "Changing Password..."
                : "Change Password"}
            </button>

          </div>

        </form>

      </section>

    </div>
  );
}

export default Settings;