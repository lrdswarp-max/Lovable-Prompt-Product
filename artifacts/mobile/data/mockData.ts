import type {
  Conversation,
  Exercise,
  StudentRecord,
  WorkoutPlan,
  WorkoutSession,
} from "./types";

export const MOCK_EXERCISES: Exercise[] = [
  {
    id: "ex1",
    name: "Bench Press",
    muscleGroup: "chest",
    equipment: "Barbell",
    description: "Lie flat on bench, grip barbell shoulder-width, lower to chest and press up explosively.",
    isGlobal: true,
  },
  {
    id: "ex2",
    name: "Incline DB Press",
    muscleGroup: "chest",
    equipment: "Dumbbells",
    description: "Set bench to 30-45°, press dumbbells from shoulder height, squeeze at the top.",
    isGlobal: true,
  },
  {
    id: "ex3",
    name: "Cable Fly",
    muscleGroup: "chest",
    equipment: "Cable Machine",
    description: "Stand between cables set to shoulder height, bring hands together in arc, feel the stretch.",
    isGlobal: true,
  },
  {
    id: "ex4",
    name: "Tricep Pushdown",
    muscleGroup: "triceps",
    equipment: "Cable Machine",
    description: "Stand at cable machine with rope attachment, push down to full extension, squeeze.",
    isGlobal: true,
  },
  {
    id: "ex5",
    name: "Skull Crusher",
    muscleGroup: "triceps",
    equipment: "Barbell",
    description: "Lie on bench, lower EZ bar to forehead under control, extend to lockout.",
    isGlobal: true,
  },
  {
    id: "ex6",
    name: "Squat",
    muscleGroup: "legs",
    equipment: "Barbell",
    description: "Bar on traps, brace core, squat to parallel, drive through heels on the way up.",
    isGlobal: true,
  },
  {
    id: "ex7",
    name: "Romanian Deadlift",
    muscleGroup: "legs",
    equipment: "Barbell",
    description: "Hip hinge with soft knees, lower bar along legs, feel hamstring stretch, drive hips forward.",
    isGlobal: true,
  },
  {
    id: "ex8",
    name: "Pull Up",
    muscleGroup: "back",
    equipment: "Pull-up Bar",
    description: "Dead hang, retract scapula, pull chest to bar, lower under control.",
    isGlobal: true,
  },
  {
    id: "ex9",
    name: "Bent Over Row",
    muscleGroup: "back",
    equipment: "Barbell",
    description: "Hip hinge at 45°, row barbell to lower chest, lead with elbows, squeeze lats.",
    isGlobal: true,
  },
  {
    id: "ex10",
    name: "Lateral Raise",
    muscleGroup: "shoulders",
    equipment: "Dumbbells",
    description: "Slight forward lean, raise arms to sides to shoulder height with pinky slightly higher.",
    isGlobal: true,
  },
  {
    id: "ex11",
    name: "Overhead Press",
    muscleGroup: "shoulders",
    equipment: "Barbell",
    description: "Press barbell from front rack position overhead to full lockout, active shoulders.",
    isGlobal: true,
  },
  {
    id: "ex12",
    name: "Barbell Curl",
    muscleGroup: "biceps",
    equipment: "Barbell",
    description: "Keep elbows fixed at sides, curl barbell to shoulder height, squeeze at top.",
    isGlobal: true,
  },
  {
    id: "ex13",
    name: "Plank",
    muscleGroup: "core",
    equipment: "Bodyweight",
    description: "Forearms on ground, body straight, brace core, hold position.",
    isGlobal: true,
  },
  {
    id: "ex14",
    name: "Leg Press",
    muscleGroup: "legs",
    equipment: "Leg Press Machine",
    description: "Feet shoulder-width on platform, lower to 90° then press to near lockout.",
    isGlobal: true,
  },
  {
    id: "ex15",
    name: "Treadmill Intervals",
    muscleGroup: "cardio",
    equipment: "Treadmill",
    description: "Alternate 30s sprints at high intensity with 60s walking recovery periods.",
    isGlobal: true,
  },
];

export const MOCK_PLAN: WorkoutPlan = {
  id: "plan1",
  name: "Strength Block I",
  studentId: "student1",
  isPublished: true,
  days: [
    {
      id: "day1",
      dayName: "Monday",
      focus: "Chest & Triceps",
      exercises: [
        { id: "pe1", exerciseId: "ex1", exercise: MOCK_EXERCISES[0], sets: 4, reps: "6-8", restSeconds: 120, notes: "Work up to a challenging weight. Full ROM." },
        { id: "pe2", exerciseId: "ex2", exercise: MOCK_EXERCISES[1], sets: 3, reps: "10-12", restSeconds: 90, notes: "" },
        { id: "pe3", exerciseId: "ex3", exercise: MOCK_EXERCISES[2], sets: 3, reps: "12-15", restSeconds: 60, notes: "Light weight — feel the stretch, not the weight." },
        { id: "pe4", exerciseId: "ex4", exercise: MOCK_EXERCISES[3], sets: 4, reps: "12-15", restSeconds: 60, notes: "" },
        { id: "pe5", exerciseId: "ex5", exercise: MOCK_EXERCISES[4], sets: 3, reps: "10-12", restSeconds: 90, notes: "Control the descent. Slow eccentric." },
      ],
    },
    {
      id: "day2",
      dayName: "Wednesday",
      focus: "Back & Biceps",
      exercises: [
        { id: "pe6", exerciseId: "ex8", exercise: MOCK_EXERCISES[7], sets: 4, reps: "5-8", restSeconds: 120, notes: "Add weight if reps feel easy." },
        { id: "pe7", exerciseId: "ex9", exercise: MOCK_EXERCISES[8], sets: 4, reps: "8-10", restSeconds: 90, notes: "" },
        { id: "pe8", exerciseId: "ex12", exercise: MOCK_EXERCISES[11], sets: 3, reps: "10-12", restSeconds: 60, notes: "" },
      ],
    },
    {
      id: "day3",
      dayName: "Friday",
      focus: "Legs & Core",
      exercises: [
        { id: "pe9", exerciseId: "ex6", exercise: MOCK_EXERCISES[5], sets: 4, reps: "5-6", restSeconds: 180, notes: "This is your main strength lift. Max effort." },
        { id: "pe10", exerciseId: "ex7", exercise: MOCK_EXERCISES[6], sets: 3, reps: "10-12", restSeconds: 90, notes: "" },
        { id: "pe11", exerciseId: "ex14", exercise: MOCK_EXERCISES[13], sets: 3, reps: "12-15", restSeconds: 75, notes: "" },
        { id: "pe12", exerciseId: "ex13", exercise: MOCK_EXERCISES[12], sets: 3, reps: "45s", restSeconds: 30, notes: "Hold for time. Breathe." },
      ],
    },
    {
      id: "day4",
      dayName: "Saturday",
      focus: "Shoulders",
      exercises: [
        { id: "pe13", exerciseId: "ex11", exercise: MOCK_EXERCISES[10], sets: 4, reps: "8-10", restSeconds: 90, notes: "" },
        { id: "pe14", exerciseId: "ex10", exercise: MOCK_EXERCISES[9], sets: 4, reps: "12-15", restSeconds: 60, notes: "Light weight, high control." },
      ],
    },
  ],
};

export const MOCK_STUDENTS: StudentRecord[] = [
  {
    id: "student1",
    name: "Alex Rivera",
    email: "alex@example.com",
    status: "active",
    lastSession: "2025-05-16",
    activePlanName: "Strength Block I",
    measurements: { weight: 80, height: 178, goals: "Build muscle and improve overall strength" },
  },
  {
    id: "student2",
    name: "Maria Santos",
    email: "maria@example.com",
    status: "active",
    lastSession: "2025-05-15",
    activePlanName: "Fat Loss Circuit",
    measurements: { weight: 62, height: 164, goals: "Lose 5kg, improve cardio endurance" },
  },
  {
    id: "student3",
    name: "Ben Chen",
    email: "ben@example.com",
    status: "invited",
    measurements: {},
  },
  {
    id: "student4",
    name: "Priya Sharma",
    email: "priya@example.com",
    status: "active",
    lastSession: "2025-05-14",
    activePlanName: "Hypertrophy Block",
    measurements: { weight: 55, height: 160, goals: "Tone and improve posture" },
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1",
    isGroup: false,
    participantIds: ["student1", "trainer1"],
    participantNames: ["Alex Rivera", "Jordan Silva"],
    messages: [
      { id: "m1", senderId: "trainer1", senderName: "Jordan", text: "Great session today! How did the bench feel at 80kg?", timestamp: Date.now() - 3600000 * 25, pending: false },
      { id: "m2", senderId: "student1", senderName: "Alex", text: "Really solid! Hit all 4 sets cleanly.", timestamp: Date.now() - 3600000 * 24, pending: false },
      { id: "m3", senderId: "trainer1", senderName: "Jordan", text: "Let's push to 82.5 next Monday. Rest up this weekend.", timestamp: Date.now() - 3600000 * 2, pending: false },
    ],
  },
  {
    id: "conv2",
    isGroup: true,
    title: "Strength Group",
    participantIds: ["student1", "student2", "student4", "trainer1"],
    participantNames: ["Alex Rivera", "Maria Santos", "Priya Sharma", "Jordan Silva"],
    messages: [
      { id: "gm1", senderId: "trainer1", senderName: "Jordan", text: "Squad — reminder that this week we're testing 1RM on squat and bench. Come rested.", timestamp: Date.now() - 3600000 * 48, pending: false },
      { id: "gm2", senderId: "student2", senderName: "Maria", text: "Ready! Been eating well all week.", timestamp: Date.now() - 3600000 * 47, pending: false },
      { id: "gm3", senderId: "student1", senderName: "Alex", text: "Let's go 💪", timestamp: Date.now() - 3600000 * 46, pending: false },
    ],
  },
];

export const MOCK_PAST_SESSIONS: WorkoutSession[] = [
  {
    id: "sess1",
    planId: "plan1",
    dayId: "day1",
    dayName: "Monday",
    planName: "Strength Block I",
    exerciseFocus: "Chest & Triceps",
    startTime: Date.now() - 3600000 * 25,
    endTime: Date.now() - 3600000 * 23,
    loggedSets: [
      { exerciseId: "ex1", planExerciseId: "pe1", setNumber: 1, weight: 80, reps: 7, timestamp: Date.now() - 3600000 * 25 },
      { exerciseId: "ex1", planExerciseId: "pe1", setNumber: 2, weight: 80, reps: 6, timestamp: Date.now() - 3600000 * 24.8 },
      { exerciseId: "ex1", planExerciseId: "pe1", setNumber: 3, weight: 77.5, reps: 7, timestamp: Date.now() - 3600000 * 24.5 },
      { exerciseId: "ex1", planExerciseId: "pe1", setNumber: 4, weight: 77.5, reps: 7, timestamp: Date.now() - 3600000 * 24.2 },
    ],
    status: "complete",
    totalVolume: 2387.5,
  },
  {
    id: "sess2",
    planId: "plan1",
    dayId: "day2",
    dayName: "Wednesday",
    planName: "Strength Block I",
    exerciseFocus: "Back & Biceps",
    startTime: Date.now() - 3600000 * 72,
    endTime: Date.now() - 3600000 * 70,
    loggedSets: [],
    status: "complete",
    totalVolume: 3120,
  },
  {
    id: "sess3",
    planId: "plan1",
    dayId: "day3",
    dayName: "Friday",
    planName: "Strength Block I",
    exerciseFocus: "Legs & Core",
    startTime: Date.now() - 3600000 * 120,
    endTime: Date.now() - 3600000 * 118,
    loggedSets: [],
    status: "complete",
    totalVolume: 4800,
  },
];

export const getTodayWorkoutDay = () => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  return MOCK_PLAN.days.find((d) => d.dayName === today) ?? MOCK_PLAN.days[0];
};
