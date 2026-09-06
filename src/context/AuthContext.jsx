import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ========================================
  // LOAD SAVED USER
  // ========================================

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/profile");

        const responseData = response.data;

        // Backend returns:
        // {
        //   success: true,
        //   user: {...}
        // }

        const savedUser =
          responseData?.user ||
          responseData?.data?.user ||
          responseData?.data;

        if (!savedUser) {
          throw new Error(
            "User information was not returned."
          );
        }

        setUser(savedUser);
      } catch (error) {
        console.error(
          "Load authenticated user error:",
          error
        );

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ========================================
  // LOGIN
  // ========================================

  const login = async (email, password) => {
    const response = await api.post(
      "/auth/login",
      {
        email: email.trim(),
        password,
      }
    );

    /*
      Backend returns:

      {
        success: true,
        message: "Login successful.",
        token: "...",
        user: {...}
      }
    */

    const responseData = response.data;

    const data =
      responseData?.data || responseData;

    const token = data?.token;
    const loggedInUser = data?.user;

    if (!token || !loggedInUser) {
      throw new Error(
        "Login succeeded but authentication data was not returned."
      );
    }

    // Save authentication data
    localStorage.setItem(
      "token",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    return response;
  };

  // ========================================
  // REGISTER
  // ========================================

  const register = async (
    name,
    email,
    password
  ) => {
    const response = await api.post(
      "/auth/register",
      {
        name: name.trim(),
        email: email.trim(),
        password,
      }
    );

    /*
      Backend returns:

      {
        success: true,
        message: "Account created successfully.",
        token: "...",
        user: {...}
      }
    */

    const responseData = response.data;

    const data =
      responseData?.data || responseData;

    const token = data?.token;
    const registeredUser = data?.user;

    if (!token || !registeredUser) {
      throw new Error(
        "Registration succeeded but authentication data was not returned."
      );
    }

    // Save authentication data
    localStorage.setItem(
      "token",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(registeredUser)
    );

    // Immediately authenticate the user
    setUser(registeredUser);

    return response;
  };

  // ========================================
  // LOGOUT
  // ========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  // ========================================
  // UPDATE USER
  // ========================================

  const updateUser = useCallback(
    (updatedUser) => {
      setUser((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      // Keep localStorage synchronized
      const savedUser =
        localStorage.getItem("user");

      if (savedUser) {
        try {
          const parsedUser =
            JSON.parse(savedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsedUser,
              ...updatedUser,
            })
          );
        } catch (error) {
          console.error(
            "Failed to update saved user:",
            error
          );
        }
      }
    },
    []
  );

  // ========================================
  // AUTH PROVIDER
  // ========================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// USE AUTH
// ========================================

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;