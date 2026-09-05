import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function ProtectedRoute() {

  const { user, loading } =
    useAuth();


  // ========================================
  // CHECK AUTH LOADING
  // ========================================

  if (loading) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Poppins, sans-serif",
          color: "#718096",
        }}
      >
        Loading...
      </div>
    );

  }


  // ========================================
  // NOT LOGGED IN
  // ========================================

  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // ========================================
  // AUTHENTICATED
  // ========================================

  return <Outlet />;
}


export default ProtectedRoute;