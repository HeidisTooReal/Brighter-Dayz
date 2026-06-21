import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setToken, getToken } from "@/lib/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = guest, obj = signed in

  useEffect(() => {
    if (!getToken()) { setUser(false); return; }
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => { setToken(null); setUser(false); });
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data);
    return data;
  };
  const register = async (fields) => {
    const { data } = await api.post("/auth/register", fields);
    setToken(data.token);
    setUser(data);
    return data;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (e) {}
    setToken(null);
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
