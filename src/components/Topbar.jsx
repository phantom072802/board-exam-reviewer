import { FiBell, FiSearch } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

function Topbar() {
  const { user } = useAuth();
  return (
    <header className="topbar">
      <div className="mobile-brand">
        <div className="brand-icon">B</div>
        <strong>BoardPrep</strong>
      </div>

      <div className="search-box">
        <FiSearch />

        <input
          type="text"
          placeholder="Search subjects, topics, questions..."
        />
      </div>

      <div className="topbar-actions">
        <button className="icon-button">
          <FiBell />
        </button>

        <div className="topbar-profile">
          <div className="avatar">D</div>

          <div className="profile-info">
            <strong>{user?.name || "Student"}</strong>
            <span>{user?.role || "Student"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;