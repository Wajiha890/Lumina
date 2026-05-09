import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("px_token") || "");
  const [role, setRole] = useState(() => localStorage.getItem("px_role") || "");
  const [username, setUsername] = useState(() => localStorage.getItem("px_user") || "");

  useEffect(() => {
    if (token) localStorage.setItem("px_token", token);
    else localStorage.removeItem("px_token");
  }, [token]);
  useEffect(() => {
    if (role) localStorage.setItem("px_role", role);
    else localStorage.removeItem("px_role");
  }, [role]);
  useEffect(() => {
    if (username) localStorage.setItem("px_user", username);
    else localStorage.removeItem("px_user");
  }, [username]);

  const save = (t, r, u) => {
    setToken(t);
    setRole(r);
    setUsername(u);
  };

  const logout = () => {
    setToken("");
    setRole("");
    setUsername("");
    localStorage.removeItem("px_token");
    localStorage.removeItem("px_role");
    localStorage.removeItem("px_user");
    window.location.href = "/login";
  };

  const headers = (json = true) => {
    const h = { Authorization: "Bearer " + token };
    if (json) h["Content-Type"] = "application/json";
    return h;
  };

  const value = useMemo(
    () => ({
      token,
      role,
      username,
      loggedIn: !!token,
      save,
      logout,
      headers,
    }),
    [token, role, username]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
