"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { User } from "@/server/auth/user";
import type { Session } from "@/server/auth/session";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  setAuthData: (data: { user: User; session: Session; role: string }) => void;
  clearAuthData: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  initialData: {
    user: User;
    session: Session;
  } | null;
  children: ReactNode;
};

export function AuthProvider({ initialData, children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialData?.user ?? null);
  const [session, setSession] = useState<Session | null>(
    initialData?.session ?? null,
  );

  const setAuthData = (data: {
    user: User;
    session: Session;
    role: string;
  }) => {
    setUser(data.user);
    setSession(data.session);
  };

  const clearAuthData = () => {
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, setAuthData, clearAuthData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");

  return context;
}
