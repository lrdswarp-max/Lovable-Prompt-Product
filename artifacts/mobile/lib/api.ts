import Constants from "expo-constants";

const DEV_DOMAIN = Constants.expoConfig?.extra?.EXPO_PUBLIC_DOMAIN as string | undefined;

function getBaseUrl(): string {
  if (DEV_DOMAIN) {
    return `https://${DEV_DOMAIN}`;
  }
  return "";
}

export const BASE_URL = getBaseUrl();

let _currentUserId: string | null = null;

export function setCurrentUserId(id: string | null) {
  _currentUserId = id;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}/api${path}`;
  const authHeaders: Record<string, string> = _currentUserId
    ? { Authorization: `Bearer ${_currentUserId}` }
    : {};
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    studentLogin: (email: string) =>
      apiFetch<{ user: AuthUser; isNewUser: boolean }>("/auth/student-login", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    trainerLogin: (email: string, pin: string) =>
      apiFetch<{ user: AuthUser; isNewUser: boolean }>("/auth/trainer-login", {
        method: "POST",
        body: JSON.stringify({ email, pin }),
      }),
  },
  exercises: {
    list: (params?: { muscleGroup?: string; search?: string }) => {
      const qs = new URLSearchParams();
      if (params?.muscleGroup) qs.set("muscleGroup", params.muscleGroup);
      if (params?.search) qs.set("search", params.search);
      return apiFetch<ApiExercise[]>(`/exercises?${qs.toString()}`);
    },
  },
  students: {
    list: () => apiFetch<ApiStudent[]>("/students"),
    invite: (name: string, email: string) =>
      apiFetch<ApiStudent>("/students", {
        method: "POST",
        body: JSON.stringify({ name, email }),
      }),
  },
  plans: {
    list: (studentId?: string) => {
      const qs = studentId ? `?studentId=${studentId}` : "";
      return apiFetch<ApiPlan[]>(`/plans${qs}`);
    },
    get: (planId: string) => apiFetch<ApiFullPlan>(`/plans/${planId}`),
    create: (data: { name: string; studentId?: string; isPublished?: boolean }) =>
      apiFetch<ApiPlan>("/plans", { method: "POST", body: JSON.stringify(data) }),
    update: (planId: string, data: Partial<{ name: string; studentId: string | null; isPublished: boolean }>) =>
      apiFetch<ApiPlan>(`/plans/${planId}`, { method: "PUT", body: JSON.stringify(data) }),
    addDay: (planId: string, data: { dayName: string; focus: string; orderIndex?: number }) =>
      apiFetch<ApiDay>(`/plans/${planId}/days`, { method: "POST", body: JSON.stringify(data) }),
    addExercise: (
      planId: string,
      dayId: string,
      data: { exerciseId: string; sets: number; reps: string; restSeconds: number; notes?: string; orderIndex?: number }
    ) =>
      apiFetch<ApiPlanExercise>(`/plans/${planId}/days/${dayId}/exercises`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  sessions: {
    list: (studentId: string) => apiFetch<ApiSession[]>(`/sessions?studentId=${studentId}`),
    create: (data: CreateSessionPayload) =>
      apiFetch<ApiSession>("/sessions", { method: "POST", body: JSON.stringify(data) }),
  },
  conversations: {
    list: (userId: string) => apiFetch<ApiConversation[]>(`/conversations?userId=${userId}`),
    messages: (conversationId: string) =>
      apiFetch<ApiMessage[]>(`/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: string, data: { senderId: string; senderName: string; text: string }) =>
      apiFetch<ApiMessage>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  me: {
    onboarding: (data: { userId: string; name?: string; goal?: string; weightKg?: string }) =>
      apiFetch<AuthUser>("/me/onboarding", { method: "POST", body: JSON.stringify(data) }),
  },
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "trainer";
  onboardingDone?: string;
}

export interface ApiExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  description?: string;
  isGlobal?: boolean;
  isCustom?: boolean;
}

export interface ApiStudent {
  id: string;
  name: string;
  email: string;
  status: string;
  lastSession?: string;
  activePlanName?: string;
  goal?: string;
  weightKg?: string;
  heightCm?: string;
}

export interface ApiPlan {
  id: string;
  name: string;
  trainerId: string;
  studentId?: string;
  isPublished?: boolean;
}

export interface ApiPlanExercise {
  id: string;
  dayId: string;
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
  orderIndex: number;
  exercise?: ApiExercise;
}

export interface ApiDay {
  id: string;
  planId: string;
  dayName: string;
  focus: string;
  orderIndex: number;
  exercises: ApiPlanExercise[];
}

export interface ApiFullPlan extends ApiPlan {
  days: ApiDay[];
}

export interface ApiLoggedSet {
  id: string;
  exerciseId: string;
  planExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  timestamp: number;
}

export interface ApiSession {
  id: string;
  studentId: string;
  planId: string;
  dayId: string;
  dayName: string;
  planName: string;
  exerciseFocus: string;
  startTime: number;
  endTime?: number;
  status: "active" | "complete";
  totalVolume?: number;
  loggedSets: ApiLoggedSet[];
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface ApiConversation {
  id: string;
  isGroup: boolean;
  title?: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage?: ApiMessage;
}

export interface CreateSessionPayload {
  studentId: string;
  planId: string;
  dayId: string;
  dayName: string;
  planName: string;
  exerciseFocus: string;
  startTime: number;
  endTime?: number;
  status: "active" | "complete";
  totalVolume?: number;
  loggedSets?: Array<{
    exerciseId: string;
    planExerciseId: string;
    setNumber: number;
    weight: number;
    reps: number;
    timestamp: number;
  }>;
}
