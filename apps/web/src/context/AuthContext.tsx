import React, { createContext, useContext, useState, useEffect } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  getStoredUser,
  clearStoredUser,
  type UserProfile,
  type LoginPayload,
} from "../lib/api";

export interface AuthContextType {
  user: UserProfile | null;
  login: (payload: LoginPayload) => Promise<{ user: UserProfile }>;
  logout: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: getStoredUser(),
  login: apiLogin,
  logout: apiLogout,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await apiLogin(payload);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await apiLogout();
    clearStoredUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}
