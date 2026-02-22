import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // INIT AUTH
  useEffect(() => {
    const cachedUser = user;

    api.get("/me")
      .then(res => {
        if (res.data) {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        } else {
          setUser(null);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      })
      .catch(() => {
        if (!cachedUser) {
          setUser(null);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await api.post("/login", credentials);
    if (res.data.success) {
      const token = res.data.token || res.data.access_token;
      if (token) localStorage.setItem("token", token);
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    await api.post("/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get("/me");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      return res.data;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        refreshUser,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);