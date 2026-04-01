import {
  createContext,
  useState,
  ReactNode,
} from "react";
import { api, tokenStore } from "../services/api";
import { AuthTokens, User } from "../types/api";

type SafeUser = Pick<User, "id" | "name" | "email">;

export interface AuthContextValue {
  user: SafeUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): SafeUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<SafeUser | null>(loadUser());

  const login = async (email: string, password: string) => {
    const { data } = await api.post<{ success: boolean; data: AuthTokens }>(
      "/auth/login",
      { email, password }
    );

    const { accessToken, refreshToken, user: userData } = data.data;

    tokenStore.setTokens(accessToken, refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post("/auth/register", { name, email, password });
  };

  const logout = async () => {
    const refreshToken = tokenStore.getRefresh();

    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {}
    }

    tokenStore.clear();
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 👇 export context for hook
export { AuthContext };