export type UserRole = "student" | "trainer";
export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core"
  | "cardio";
export type StudentStatus = "invited" | "active";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  description?: string;
  isCustom?: boolean;
  isGlobal?: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  dayName: string;
  focus: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  studentId: string;
  days: WorkoutDay[];
  isPublished: boolean;
}

export interface LoggedSet {
  exerciseId: string;
  planExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  timestamp: number;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  dayId: string;
  dayName: string;
  planName: string;
  exerciseFocus: string;
  startTime: number;
  endTime?: number;
  loggedSets: LoggedSet[];
  status: "active" | "complete";
  totalVolume?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  pending?: boolean;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  title?: string;
  participantIds: string[];
  participantNames: string[];
  messages: Message[];
}

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  status: StudentStatus;
  lastSession?: string;
  activePlanName?: string;
  measurements?: {
    weight?: number;
    height?: number;
    goals?: string;
  };
}
