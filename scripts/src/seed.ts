import { db } from "@workspace/db";
import {
  usersTable,
  exercisesTable,
  workoutPlansTable,
  workoutDaysTable,
  planExercisesTable,
  workoutSessionsTable,
  loggedSetsTable,
  conversationsTable,
  conversationParticipantsTable,
  messagesTable,
  studentTrainerAssignmentsTable,
} from "@workspace/db";

async function seed() {
  console.log("🌱 Seeding database...");

  // Trainer
  await db.insert(usersTable).values({
    id: "trainer1",
    name: "Jordan Silva",
    email: "jordan@trainflow.com",
    role: "trainer",
    pinHash: "1234",
    onboardingDone: "true",
  }).onConflictDoNothing();

  // Students
  await db.insert(usersTable).values([
    { id: "student1", name: "Alex Rivera", email: "alex@example.com", role: "student", goal: "Build muscle and improve overall strength", weightKg: "80", heightCm: "178", onboardingDone: "true" },
    { id: "student2", name: "Maria Santos", email: "maria@example.com", role: "student", goal: "Lose 5kg, improve cardio endurance", weightKg: "62", heightCm: "164", onboardingDone: "true" },
    { id: "student3", name: "Ben Chen", email: "ben@example.com", role: "student", onboardingDone: "false" },
    { id: "student4", name: "Priya Sharma", email: "priya@example.com", role: "student", goal: "Tone and improve posture", weightKg: "55", heightCm: "160", onboardingDone: "true" },
  ]).onConflictDoNothing();

  // Assignments
  await db.insert(studentTrainerAssignmentsTable).values([
    { id: "assign1", studentId: "student1", trainerId: "trainer1", status: "active", activePlanId: "plan1" },
    { id: "assign2", studentId: "student2", trainerId: "trainer1", status: "active" },
    { id: "assign3", studentId: "student3", trainerId: "trainer1", status: "invited" },
    { id: "assign4", studentId: "student4", trainerId: "trainer1", status: "active" },
  ]).onConflictDoNothing();

  // Exercises
  await db.insert(exercisesTable).values([
    { id: "ex1", name: "Bench Press", muscleGroup: "chest", equipment: "Barbell", description: "Lie flat on bench, grip barbell shoulder-width, lower to chest and press up explosively.", isGlobal: true },
    { id: "ex2", name: "Incline DB Press", muscleGroup: "chest", equipment: "Dumbbells", description: "Set bench to 30-45°, press dumbbells from shoulder height, squeeze at the top.", isGlobal: true },
    { id: "ex3", name: "Cable Fly", muscleGroup: "chest", equipment: "Cable Machine", description: "Stand between cables set to shoulder height, bring hands together in arc, feel the stretch.", isGlobal: true },
    { id: "ex4", name: "Tricep Pushdown", muscleGroup: "triceps", equipment: "Cable Machine", description: "Stand at cable machine with rope attachment, push down to full extension, squeeze.", isGlobal: true },
    { id: "ex5", name: "Skull Crusher", muscleGroup: "triceps", equipment: "Barbell", description: "Lie on bench, lower EZ bar to forehead under control, extend to lockout.", isGlobal: true },
    { id: "ex6", name: "Squat", muscleGroup: "legs", equipment: "Barbell", description: "Bar on traps, brace core, squat to parallel, drive through heels on the way up.", isGlobal: true },
    { id: "ex7", name: "Romanian Deadlift", muscleGroup: "legs", equipment: "Barbell", description: "Hip hinge with soft knees, lower bar along legs, feel hamstring stretch, drive hips forward.", isGlobal: true },
    { id: "ex8", name: "Pull Up", muscleGroup: "back", equipment: "Pull-up Bar", description: "Dead hang, retract scapula, pull chest to bar, lower under control.", isGlobal: true },
    { id: "ex9", name: "Bent Over Row", muscleGroup: "back", equipment: "Barbell", description: "Hip hinge at 45°, row barbell to lower chest, lead with elbows, squeeze lats.", isGlobal: true },
    { id: "ex10", name: "Lateral Raise", muscleGroup: "shoulders", equipment: "Dumbbells", description: "Slight forward lean, raise arms to sides to shoulder height with pinky slightly higher.", isGlobal: true },
    { id: "ex11", name: "Overhead Press", muscleGroup: "shoulders", equipment: "Barbell", description: "Press barbell from front rack position overhead to full lockout, active shoulders.", isGlobal: true },
    { id: "ex12", name: "Barbell Curl", muscleGroup: "biceps", equipment: "Barbell", description: "Keep elbows fixed at sides, curl barbell to shoulder height, squeeze at top.", isGlobal: true },
    { id: "ex13", name: "Plank", muscleGroup: "core", equipment: "Bodyweight", description: "Forearms on ground, body straight, brace core, hold position.", isGlobal: true },
    { id: "ex14", name: "Leg Press", muscleGroup: "legs", equipment: "Leg Press Machine", description: "Feet shoulder-width on platform, lower to 90° then press to near lockout.", isGlobal: true },
    { id: "ex15", name: "Treadmill Intervals", muscleGroup: "cardio", equipment: "Treadmill", description: "Alternate 30s sprints at high intensity with 60s walking recovery periods.", isGlobal: true },
  ]).onConflictDoNothing();

  // Workout plan
  await db.insert(workoutPlansTable).values({
    id: "plan1",
    name: "Strength Block I",
    trainerId: "trainer1",
    studentId: "student1",
    isPublished: true,
  }).onConflictDoNothing();

  // Workout days
  await db.insert(workoutDaysTable).values([
    { id: "day1", planId: "plan1", dayName: "Monday", focus: "Chest & Triceps", orderIndex: 0 },
    { id: "day2", planId: "plan1", dayName: "Wednesday", focus: "Back & Biceps", orderIndex: 1 },
    { id: "day3", planId: "plan1", dayName: "Friday", focus: "Legs & Core", orderIndex: 2 },
    { id: "day4", planId: "plan1", dayName: "Saturday", focus: "Shoulders", orderIndex: 3 },
  ]).onConflictDoNothing();

  // Plan exercises
  await db.insert(planExercisesTable).values([
    // Day 1
    { id: "pe1", dayId: "day1", exerciseId: "ex1", sets: 4, reps: "6-8", restSeconds: 120, notes: "Work up to a challenging weight. Full ROM.", orderIndex: 0 },
    { id: "pe2", dayId: "day1", exerciseId: "ex2", sets: 3, reps: "10-12", restSeconds: 90, notes: "", orderIndex: 1 },
    { id: "pe3", dayId: "day1", exerciseId: "ex3", sets: 3, reps: "12-15", restSeconds: 60, notes: "Light weight — feel the stretch, not the weight.", orderIndex: 2 },
    { id: "pe4", dayId: "day1", exerciseId: "ex4", sets: 4, reps: "12-15", restSeconds: 60, notes: "", orderIndex: 3 },
    { id: "pe5", dayId: "day1", exerciseId: "ex5", sets: 3, reps: "10-12", restSeconds: 90, notes: "Control the descent. Slow eccentric.", orderIndex: 4 },
    // Day 2
    { id: "pe6", dayId: "day2", exerciseId: "ex8", sets: 4, reps: "5-8", restSeconds: 120, notes: "Add weight if reps feel easy.", orderIndex: 0 },
    { id: "pe7", dayId: "day2", exerciseId: "ex9", sets: 4, reps: "8-10", restSeconds: 90, notes: "", orderIndex: 1 },
    { id: "pe8", dayId: "day2", exerciseId: "ex12", sets: 3, reps: "10-12", restSeconds: 60, notes: "", orderIndex: 2 },
    // Day 3
    { id: "pe9", dayId: "day3", exerciseId: "ex6", sets: 4, reps: "5-6", restSeconds: 180, notes: "This is your main strength lift. Max effort.", orderIndex: 0 },
    { id: "pe10", dayId: "day3", exerciseId: "ex7", sets: 3, reps: "10-12", restSeconds: 90, notes: "", orderIndex: 1 },
    { id: "pe11", dayId: "day3", exerciseId: "ex14", sets: 3, reps: "12-15", restSeconds: 75, notes: "", orderIndex: 2 },
    { id: "pe12", dayId: "day3", exerciseId: "ex13", sets: 3, reps: "45s", restSeconds: 30, notes: "Hold for time. Breathe.", orderIndex: 3 },
    // Day 4
    { id: "pe13", dayId: "day4", exerciseId: "ex11", sets: 4, reps: "8-10", restSeconds: 90, notes: "", orderIndex: 0 },
    { id: "pe14", dayId: "day4", exerciseId: "ex10", sets: 4, reps: "12-15", restSeconds: 60, notes: "Light weight, high control.", orderIndex: 1 },
  ]).onConflictDoNothing();

  // Past sessions
  const now = Date.now();
  await db.insert(workoutSessionsTable).values([
    { id: "sess1", studentId: "student1", planId: "plan1", dayId: "day1", dayName: "Monday", planName: "Strength Block I", exerciseFocus: "Chest & Triceps", startTime: now - 3600000 * 25, endTime: now - 3600000 * 23, status: "complete", totalVolume: 2388 },
    { id: "sess2", studentId: "student1", planId: "plan1", dayId: "day2", dayName: "Wednesday", planName: "Strength Block I", exerciseFocus: "Back & Biceps", startTime: now - 3600000 * 72, endTime: now - 3600000 * 70, status: "complete", totalVolume: 3120 },
    { id: "sess3", studentId: "student1", planId: "plan1", dayId: "day3", dayName: "Friday", planName: "Strength Block I", exerciseFocus: "Legs & Core", startTime: now - 3600000 * 120, endTime: now - 3600000 * 118, status: "complete", totalVolume: 4800 },
  ]).onConflictDoNothing();

  await db.insert(loggedSetsTable).values([
    { id: "ls1", sessionId: "sess1", exerciseId: "ex1", planExerciseId: "pe1", setNumber: 1, weight: 80, reps: 7, timestamp: now - 3600000 * 25 },
    { id: "ls2", sessionId: "sess1", exerciseId: "ex1", planExerciseId: "pe1", setNumber: 2, weight: 80, reps: 6, timestamp: now - 3600000 * 24.8 },
    { id: "ls3", sessionId: "sess1", exerciseId: "ex1", planExerciseId: "pe1", setNumber: 3, weight: 77, reps: 7, timestamp: now - 3600000 * 24.5 },
    { id: "ls4", sessionId: "sess1", exerciseId: "ex1", planExerciseId: "pe1", setNumber: 4, weight: 77, reps: 7, timestamp: now - 3600000 * 24.2 },
  ]).onConflictDoNothing();

  // Conversations
  await db.insert(conversationsTable).values([
    { id: "conv1", isGroup: false },
    { id: "conv2", isGroup: true, title: "Strength Group" },
  ]).onConflictDoNothing();

  await db.insert(conversationParticipantsTable).values([
    { id: "cp1", conversationId: "conv1", userId: "student1" },
    { id: "cp2", conversationId: "conv1", userId: "trainer1" },
    { id: "cp3", conversationId: "conv2", userId: "student1" },
    { id: "cp4", conversationId: "conv2", userId: "student2" },
    { id: "cp5", conversationId: "conv2", userId: "student4" },
    { id: "cp6", conversationId: "conv2", userId: "trainer1" },
  ]).onConflictDoNothing();

  const t = Date.now();
  await db.insert(messagesTable).values([
    { id: "m1", conversationId: "conv1", senderId: "trainer1", senderName: "Jordan", text: "Great session today! How did the bench feel at 80kg?", timestamp: t - 3600000 * 25 },
    { id: "m2", conversationId: "conv1", senderId: "student1", senderName: "Alex", text: "Really solid! Hit all 4 sets cleanly.", timestamp: t - 3600000 * 24 },
    { id: "m3", conversationId: "conv1", senderId: "trainer1", senderName: "Jordan", text: "Let's push to 82.5 next Monday. Rest up this weekend.", timestamp: t - 3600000 * 2 },
    { id: "gm1", conversationId: "conv2", senderId: "trainer1", senderName: "Jordan", text: "Squad — reminder that this week we're testing 1RM on squat and bench. Come rested.", timestamp: t - 3600000 * 48 },
    { id: "gm2", conversationId: "conv2", senderId: "student2", senderName: "Maria", text: "Ready! Been eating well all week.", timestamp: t - 3600000 * 47 },
    { id: "gm3", conversationId: "conv2", senderId: "student1", senderName: "Alex", text: "Let's go 💪", timestamp: t - 3600000 * 46 },
  ]).onConflictDoNothing();

  // 1:1 conversations for other students
  await db.insert(conversationsTable).values([
    { id: "conv_student2_trainer1", isGroup: false },
    { id: "conv_student3_trainer1", isGroup: false },
    { id: "conv_student4_trainer1", isGroup: false },
  ]).onConflictDoNothing();

  await db.insert(conversationParticipantsTable).values([
    { id: "cp_s2_1", conversationId: "conv_student2_trainer1", userId: "student2" },
    { id: "cp_s2_2", conversationId: "conv_student2_trainer1", userId: "trainer1" },
    { id: "cp_s3_1", conversationId: "conv_student3_trainer1", userId: "student3" },
    { id: "cp_s3_2", conversationId: "conv_student3_trainer1", userId: "trainer1" },
    { id: "cp_s4_1", conversationId: "conv_student4_trainer1", userId: "student4" },
    { id: "cp_s4_2", conversationId: "conv_student4_trainer1", userId: "trainer1" },
  ]).onConflictDoNothing();

  console.log("✅ Seed complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
