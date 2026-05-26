import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { MOCK_CONVERSATIONS, MOCK_PAST_SESSIONS, MOCK_PLAN, MOCK_STUDENTS } from "@/data/mockData";
import type { Conversation, Message, StudentRecord, WorkoutPlan, WorkoutSession } from "@/data/types";

const SESSIONS_KEY = "trainflow_sessions_v2";
const CONVERSATIONS_KEY = "trainflow_conversations_v2";
const PLANS_KEY = "trainflow_plans_v2";
const STUDENTS_KEY = "trainflow_students_v2";

interface DataContextType {
  sessions: WorkoutSession[];
  saveSession: (s: WorkoutSession) => Promise<void>;

  conversations: Conversation[];
  sendMessage: (convId: string, msg: Message) => Promise<void>;

  plans: WorkoutPlan[];
  savePlan: (plan: WorkoutPlan) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;

  students: StudentRecord[];
  addStudent: (student: StudentRecord) => Promise<void>;
  assignPlan: (studentId: string, planId: string, planName: string) => Promise<void>;

  isLoading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sessRaw, convRaw, planRaw, studRaw] = await Promise.all([
          AsyncStorage.getItem(SESSIONS_KEY),
          AsyncStorage.getItem(CONVERSATIONS_KEY),
          AsyncStorage.getItem(PLANS_KEY),
          AsyncStorage.getItem(STUDENTS_KEY),
        ]);
        setSessions(sessRaw ? (JSON.parse(sessRaw) as WorkoutSession[]) : MOCK_PAST_SESSIONS);
        setConversations(convRaw ? (JSON.parse(convRaw) as Conversation[]) : MOCK_CONVERSATIONS);
        setPlans(planRaw ? (JSON.parse(planRaw) as WorkoutPlan[]) : [MOCK_PLAN]);
        setStudents(studRaw ? (JSON.parse(studRaw) as StudentRecord[]) : MOCK_STUDENTS);
      } catch {
        setSessions(MOCK_PAST_SESSIONS);
        setConversations(MOCK_CONVERSATIONS);
        setPlans([MOCK_PLAN]);
        setStudents(MOCK_STUDENTS);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveSession = useCallback(async (session: WorkoutSession) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      const updated = idx >= 0 ? prev.map((s, i) => (i === idx ? session : s)) : [session, ...prev];
      AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const sendMessage = useCallback(async (convId: string, msg: Message) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, msg] } : c
      );
      AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const savePlan = useCallback(async (plan: WorkoutPlan) => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === plan.id);
      const updated = idx >= 0 ? prev.map((p, i) => (i === idx ? plan : p)) : [...prev, plan];
      AsyncStorage.setItem(PLANS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const deletePlan = useCallback(async (planId: string) => {
    setPlans((prev) => {
      const updated = prev.filter((p) => p.id !== planId);
      AsyncStorage.setItem(PLANS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const addStudent = useCallback(async (student: StudentRecord) => {
    setStudents((prev) => {
      const updated = [student, ...prev];
      AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const assignPlan = useCallback(async (studentId: string, planId: string, planName: string) => {
    setPlans((prev) => {
      const updated = prev.map((p) =>
        p.id === planId ? { ...p, studentId, isPublished: true } : p
      );
      AsyncStorage.setItem(PLANS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === studentId ? { ...s, activePlanName: planName } : s
      );
      AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  return (
    <DataContext.Provider
      value={{
        sessions, saveSession,
        conversations, sendMessage,
        plans, savePlan, deletePlan,
        students, addStudent, assignPlan,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
