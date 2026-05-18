import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { User } from "@/data/types";
import { MOCK_STUDENTS, MOCK_TRAINER } from "@/data/mockData";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginAsStudent: (email: string) => Promise<void>;
  loginAsTrainer: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "trainflow_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored) as User);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loginAsStudent = useCallback(async (email: string) => {
    const found = MOCK_STUDENTS.find(
      (s) => s.email.toLowerCase() === email.toLowerCase()
    );
    const studentUser: User = found
      ? { id: found.id, name: found.name, email: found.email, role: "student" }
      : { id: "student1", name: "Alex Rivera", email, role: "student" };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(studentUser));
    setUser(studentUser);
  }, []);

  const loginAsTrainer = useCallback(
    async (_email: string, _password: string) => {
      const trainerUser: User = {
        id: MOCK_TRAINER.id,
        name: MOCK_TRAINER.name,
        email: MOCK_TRAINER.email,
        role: "trainer",
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(trainerUser));
      setUser(trainerUser);
    },
    []
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAsStudent, loginAsTrainer, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const MOCK_TRAINER = {
  id: "trainer1",
  name: "Jordan Silva",
  email: "jordan@trainflow.com",
  role: "trainer" as const,
};
