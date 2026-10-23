import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  getMe,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  type UserProfile,
  type LoginPayload,
  type RegisterPayload,
} from "../lib/api";

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const current = await getMe();
      setUser(current);
      return current;
    } catch {
      const stored = getStoredUser();
      setUser(stored);
      return stored;
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const current = await getMe();
        if (active) {
          setUser(current);
        }
      } catch {
        if (active) {
          setUser(getStoredUser());
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const login = async (payload: LoginPayload): Promise<UserProfile> => {
    const res = await apiLogin(payload);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: RegisterPayload): Promise<UserProfile> => {
    const res = await apiRegister(payload);
    setUser(res.user);
    return res.user;
  };

  const logout = async (): Promise<void> => {
    await apiLogout();
    clearStoredUser();
    setUser(null);
  };

  const updateUser = (updatedUser: UserProfile): void => {
    setStoredUser(updatedUser);
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
