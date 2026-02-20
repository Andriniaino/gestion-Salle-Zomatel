import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si déjà connecté
  useEffect(() => {
    api.get("/me")
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // LOGIN
  const login = async (credentials) => {
    const res = await api.post("/login", credentials);
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  // LOGOUT
  const logout = async () => {
    await api.post("/logout");
    setUser(null);
  };

  // Rafraîchir l'utilisateur connecté (après mise à jour profil/photo)
  const refreshUser = async () => {
    try {
      const res = await api.get("/me");
      setUser(res.data);
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
