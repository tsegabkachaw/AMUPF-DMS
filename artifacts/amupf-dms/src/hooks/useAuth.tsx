import { createContext, useContext, useEffect, useState } from "react";
import { useGetCurrentUser, setAuthTokenGetter } from "@workspace/api-client-react";
import type { GetCurrentUserResponse } from "@workspace/api-client-react";

type User = GetCurrentUserResponse;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem("amupf_token");
  });

  const { data: user, isLoading } = useGetCurrentUser({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("amupf_token", newToken);
    } else {
      localStorage.removeItem("amupf_token");
    }
    setTokenState(newToken);
  };

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("amupf_token"));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        token,
        setToken,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
