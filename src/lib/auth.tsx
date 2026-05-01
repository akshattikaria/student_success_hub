import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { type StoredUser } from "./dataStore";

export type Role = "student" | "teacher" | "advisor" | "admin" | "hod";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  title: string;
}

const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  teacher: "Teacher",
  advisor: "Academic Advisor",
  admin: "Admin / HOD",
  hod: "Head of Department",
};

export const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "student", label: "Student",          description: "View your own performance & risk" },
  { value: "teacher", label: "Teacher",          description: "Monitor class analytics" },
  { value: "advisor", label: "Academic Advisor", description: "Counsel and support at-risk students" },
  { value: "admin",   label: "Admin / HOD",      description: "Department reports & user management" },
  { 
  value: "hod", 
  label: "Head of Department", 
  description: "Department-wide analytics & equity monitoring" },
];

export const ROLE_HOME: Record<Role, string> = {
  student: "/student",
  teacher: "/teacher",
  advisor: "/advisor",
  admin:   "/admin",
  hod: "/hod/dashboard"
};

export function roleLabel(role: Role) {
  return ROLE_LABELS[role];
}

const AUTH_TOKEN_KEY = "edu_auth_token";
const AUTH_USER_KEY  = "edu_auth_user";
const API_BASE       = "http://localhost:5000";

function toAuthUser(u: StoredUser): AuthUser {
  return {
    id:     u.id,
    name:   u.name,
    email:  u.email,
    role:   u.role,
    avatar: u.avatar,
    title:  u.title ?? roleLabel(u.role),
  };
}

export type LoginResult =
  | { ok: true;  user: AuthUser }
  | { ok: false; error: string };

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  // On mount: verify stored token is still valid with backend
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { setUser(null); return; }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const au = toAuthUser(data.user as StoredUser);
        setUser(au);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(au));
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setUser(null);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { ok: false, error: data.error ?? "Login failed." };
      }

      const au = toAuthUser(data.user as StoredUser);
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(au));
      setUser(au);
      return { ok: true, user: au };
    } catch {
      return { ok: false, error: "Cannot reach the server. Is the backend running?" };
    }
  };

  const logout = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
