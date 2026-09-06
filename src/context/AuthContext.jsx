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

        /*
          Backend currently returns:

          {
            success: true,
            user: {...}
          }

          Support both:
          response.data.data.user
          and
          response.data.user
        */

        const responseBody = response.data;

        const savedUser =
          responseBody?.data?.user ||
          responseBody?.user ||
          responseBody?.data;

        if (!savedUser) {
          throw new Error(
            "Authenticated user data was not returned."
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
      Backend currently returns:

      {
        success: true,
        message: "Login successful.",
        token: "...",
        user: {...}
      }

      Support both the current backend format
      and a nested data format.
    */

    const responseBody = response.data;

    const data =
      responseBody?.data || responseBody;

    const token = data?.token;

    const loggedInUser = data?.user;

    if (!token || !loggedInUser) {
      throw new Error(
        "Login succeeded, but authentication data was not returned."
      );
    }

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
      Backend currently returns:

      {
        success: true,
        message: "Account created successfully.",
        token: "...",
        user: {...}
      }

      Support both the current backend format
      and a nested data format.
    */

    const responseBody = response.data;

    const data =
      responseBody?.data || responseBody;

    const token = data?.token;

    const registeredUser = data?.user;

    if (!token || !registeredUser) {
      throw new Error(
        "Registration succeeded, but authentication data was not returned."
      );
    }

    localStorage.setItem(
      "token",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(registeredUser)
    );

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

      /*
        Keep the saved user synchronized.
      */

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
            "Update saved user error:",
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