import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setApiToken } from "../services/api";

const AuthContext = createContext(null);
const STORAGE_TOKEN_KEY = "intrusionx-token";
const STORAGE_USER_KEY = "intrusionx-user";

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_USER_KEY);
    return null;
  }
}

setApiToken(getStoredToken());

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    setApiToken(token);
  }, [token]);

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem(STORAGE_TOKEN_KEY, response.data.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(response.data.user));
    setApiToken(response.data.token);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setApiToken(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
