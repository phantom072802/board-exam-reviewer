import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  FiGrid,
  FiBookOpen,
  FiEdit3,
  FiClock,
  FiBarChart2,
  FiBookmark,
  FiSearch,
  FiUser,
  FiSettings,
  FiLogOut,
  FiTarget,
  FiCalendar,
  FiBell,
} from "react-icons/fi";

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // =========================================================
  // SIDEBAR MENU
  // =========================================================

  const menu = [
    {
      title: "Overview",

      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <FiGrid />,
        },

        {
          name: "Analytics",
          path: "/analytics",
          icon: <FiBarChart2 />,
        },

        {
          name: "Subjects",
          path: "/subjects",
          icon: <FiBookOpen />,
        },
      ],
    },

    {
      title: "Study",

      items: [
        {
          name: "Question Bank",
          path: "/questions",
          icon: <FiSearch />,
        },

        {
          name: "Practice",
          path: "/practice",
          icon: <FiEdit3 />,
        },

        {
          name: "Mock Exam",
          path: "/mock-exam",
          icon: <FiClock />,
        },

        {
          name: "Results",
          path: "/results",
          icon: <FiBarChart2 />,
        },

        {
          name: "History",
          path: "/history",
          icon: <FiBarChart2 />,
        },

        {
          name: "Bookmarks",
          path: "/bookmarks",
          icon: <FiBookmark />,
        },

        {
          name: "Study Goals",
          path: "/goals",
          icon: <FiTarget />,
        },

        {
          name: "Study Activity",
          path: "/study-activity",
          icon: <FiCalendar />,
        },

        {
          name: "Notifications",
          path: "/notifications",
          icon: <FiBell />,
        },
      ],
    },

    {
      title: "Account",

      items: [
        {
          name: "Profile",
          path: "/profile",
          icon: <FiUser />,
        },

        {
          name: "Settings",
          path: "/settings",
          icon: <FiSettings />,
        },
      ],
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <aside className="sidebar">

      {/* =====================================================
          BRAND
      ===================================================== */}

      <div className="brand">

        <div className="brand-icon">
          B
        </div>

        <div>
          <h2>
            BoardPrep
          </h2>

          <span>
            Review smarter
          </span>
        </div>

      </div>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="sidebar-navigation">

        {menu.map((section) => (
          <div
            className="nav-section"
            key={section.title}
          >

            {/* SECTION TITLE */}

            <p className="nav-section-title">
              {section.title}
            </p>


            {/* SECTION ITEMS */}

            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive ? "active" : ""
                  }`
                }
              >

                <span className="nav-icon">
                  {item.icon}
                </span>

                <span>
                  {item.name}
                </span>

              </NavLink>
            ))}

          </div>
        ))}

      </nav>


      {/* =====================================================
          LOGOUT
      ===================================================== */}

      <div className="sidebar-bottom">

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >

          <FiLogOut />

          <span>
            Log out
          </span>

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;