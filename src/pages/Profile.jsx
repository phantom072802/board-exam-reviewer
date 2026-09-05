import { useEffect, useState } from "react";
import {
  FiMail,
  FiSave,
  FiUser,
} from "react-icons/fi";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ========================================
  // LOAD PROFILE
  // ========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/profile");

        const data = response.data.data;

        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");

        // Keep AuthContext synchronized
        updateUser(data);
      } catch (err) {
        console.error("=================================");
        console.error("LOAD PROFILE ERROR");
        console.error("Message:", err.message);
        console.error(
          "Status:",
          err.response?.status
        );
        console.error(
          "Response:",
          err.response?.data
        );
        console.error("=================================");

        setError(
          err.response?.data?.message ||
            "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [updateUser]);

  // ========================================
  // SAVE PROFILE
  // ========================================

  const handleSave = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    // ------------------------------------
    // VALIDATION
    // ------------------------------------

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put("/profile", {
        name: name.trim(),
        email: email.trim(),
      });

      const updatedProfile =
        response.data.data;

      // ------------------------------------
      // UPDATE PROFILE STATE
      // ------------------------------------

      setProfile(updatedProfile);
      setName(updatedProfile.name || "");
      setEmail(updatedProfile.email || "");

      // ------------------------------------
      // UPDATE GLOBAL AUTH STATE
      // ------------------------------------
      // This makes the Topbar update
      // immediately without refreshing.

      updateUser(updatedProfile);

      // ------------------------------------
      // SUCCESS MESSAGE
      // ------------------------------------

      setMessage(
        response.data.message ||
          "Profile updated successfully."
      );
    } catch (err) {
      console.error("=================================");
      console.error("UPDATE PROFILE ERROR");
      console.error("Message:", err.message);
      console.error(
        "Status:",
        err.response?.status
      );
      console.error(
        "Response:",
        err.response?.data
      );
      console.error(
        "Response message:",
        err.response?.data?.message
      );
      console.error(
        "Response error:",
        err.response?.data?.error
      );
      console.error(
        "Request URL:",
        err.config?.url
      );
      console.error(
        "Request method:",
        err.config?.method
      );
      console.error("=================================");

      setError(
        err.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  // ========================================
  // PROFILE PAGE
  // ========================================

  return (
    <div className="page">

      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <div className="page-header">
        <div>
          <p className="eyebrow">
            Account
          </p>

          <h1>Profile</h1>

          <p className="page-description">
            Manage your BoardPrep account
            information.
          </p>
        </div>
      </div>

      {/* ================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ================================== */}

      {message && (
        <div className="profile-message">
          {message}
        </div>
      )}

      {/* ================================== */}
      {/* ERROR MESSAGE */}
      {/* ================================== */}

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {/* ================================== */}
      {/* PROFILE CARD */}
      {/* ================================== */}

      <section className="content-card profile-card">

        {/* ================================= */}
        {/* PROFILE HEADER */}
        {/* ================================= */}

        <div className="profile-large">

          <div className="profile-avatar">
            {name
              ? name
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </div>

          <div>
            <h2>
              {name || "User"}
            </h2>

            <p>
              {profile?.role || "Student"}
            </p>
          </div>

        </div>

        {/* ================================= */}
        {/* PROFILE FORM */}
        {/* ================================= */}

        <form
          className="profile-form"
          onSubmit={handleSave}
        >

          {/* ================================= */}
          {/* FULL NAME */}
          {/* ================================= */}

          <div className="profile-form-group">

            <label htmlFor="name">
              Full Name
            </label>

            <div className="profile-input-wrapper">

              <FiUser />

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Enter your name"
                disabled={saving}
              />

            </div>

          </div>

          {/* ================================= */}
          {/* EMAIL */}
          {/* ================================= */}

          <div className="profile-form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <div className="profile-input-wrapper">

              <FiMail />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter email address"
                disabled={saving}
              />

            </div>

          </div>

          {/* ================================= */}
          {/* SAVE BUTTON */}
          {/* ================================= */}

          <div className="profile-form-actions">

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >

              <FiSave />

              {saving
                ? "Saving..."
                : "Save Changes"}

            </button>

          </div>

        </form>

        {/* ================================= */}
        {/* ACCOUNT DETAILS */}
        {/* ================================= */}

        {profile && (
          <div className="profile-details">

            <div>
              <span>
                Account ID
              </span>

              <strong>
                #{profile.id}
              </strong>
            </div>

            <div>
              <span>
                Account Type
              </span>

              <strong>
                {profile.role || "Student"}
              </strong>
            </div>

          </div>
        )}

      </section>

    </div>
  );
}

export default Profile;