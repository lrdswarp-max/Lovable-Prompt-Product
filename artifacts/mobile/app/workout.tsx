import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExerciseDisplay } from "@/components/ExerciseDisplay";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { MOCK_PLAN } from "@/data/mockData";
import type { LoggedSet, WorkoutExercise } from "@/data/types";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

type WorkoutStatus = "active" | "resting" | "complete";

export default function WorkoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dayId } = useLocalSearchParams<{ dayId: string }>();

  const day = useMemo(
    () => MOCK_PLAN.days.find((d) => d.id === dayId) ?? MOCK_PLAN.days[0],
    [dayId]
  );
  const exercises = day.exercises;
  const totalSets = useMemo(
    () => exercises.reduce((sum, ex) => sum + ex.sets, 0),
    [exercises]
  );

  const [exIndex, setExIndex] = useState(0);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [status, setStatus] = useState<WorkoutStatus>("active");
  const [restLeft, setRestLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const sessionStart = useRef(Date.now());

  const currentEx: WorkoutExercise = exercises[exIndex];
  const setsLoggedForEx = loggedSets.filter((s) => s.planExerciseId === currentEx.id).length;
  const currentSetNum = setsLoggedForEx + 1;
  const completedSets = loggedSets.length;
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  // Session timer
  useEffect(() => {
    if (status === "complete") return;
    const timer = setInterval(() => {
      if (!isPaused) setSessionTime(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, status]);

  // Rest countdown
  useEffect(() => {
    if (status !== "resting" || isPaused || restLeft <= 0) return;
    const timer = setInterval(() => {
      setRestLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [status, isPaused, restLeft]);

  // When rest hits 0
  useEffect(() => {
    if (status === "resting" && restLeft === 0) {
      setStatus("active");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [status, restLeft]);

  const advanceExercise = useCallback(
    (fromIndex: number, sets: LoggedSet[]) => {
      const next = fromIndex + 1;
      if (next >= exercises.length) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStatus("complete");
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setExIndex(next);
        setStatus("active");
        setWeightInput("");
        setRepsInput("");
      }
    },
    [exercises.length]
  );

  const confirmSet = useCallback(() => {
    const weight = parseFloat(weightInput) || 0;
    const reps = parseInt(repsInput, 10) || 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newSet: LoggedSet = {
      exerciseId: currentEx.exerciseId,
      planExerciseId: currentEx.id,
      setNumber: currentSetNum,
      weight,
      reps,
      timestamp: Date.now(),
    };
    const updated = [...loggedSets, newSet];
    setLoggedSets(updated);
    setWeightInput("");
    setRepsInput("");

    const isLastSet = setsLoggedForEx + 1 >= currentEx.sets;
    if (isLastSet) {
      advanceExercise(exIndex, updated);
    } else {
      setRestLeft(currentEx.restSeconds);
      setStatus("resting");
    }
  }, [
    weightInput, repsInput, currentEx, currentSetNum,
    setsLoggedForEx, loggedSets, exIndex, advanceExercise,
  ]);

  const skipRest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestLeft(0);
    setStatus("active");
  };

  const togglePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused((p) => !p);
  };

  const goBack = () => {
    if (exIndex > 0) {
      setExIndex(exIndex - 1);
      setStatus("active");
    }
  };

  const goNext = () => {
    if (exIndex < exercises.length - 1) {
      setExIndex(exIndex + 1);
      setStatus("active");
    }
  };

  const totalVolume = loggedSets.reduce((s, set) => s + set.weight * set.reps, 0);
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  // Completion screen
  if (status === "complete") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient colors={["#0D0A2E", colors.background]} style={StyleSheet.absoluteFill} />
        <View style={[styles.completionContainer, { paddingTop: topPad + 40, paddingBottom: insets.bottom + 40 }]}>
          <View style={[styles.completionIcon, { backgroundColor: colors.accent + "20", borderColor: colors.accent + "60" }]}>
            <MaterialCommunityIcons name="check-bold" size={48} color={colors.accent} />
          </View>
          <Text style={[styles.completionTitle, { color: colors.foreground }]}>Session Complete</Text>
          <Text style={[styles.completionDay, { color: colors.mutedForeground }]}>
            {day.dayName} · {day.focus}
          </Text>

          <View style={styles.statsRow}>
            <StatBox label="Time" value={formatDuration(sessionTime)} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} card={colors.card} border={colors.border} />
            <StatBox label="Sets" value={String(completedSets)} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} card={colors.card} border={colors.border} />
            <StatBox label="Volume" value={`${totalVolume}kg`} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} card={colors.card} border={colors.border} />
          </View>

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={[styles.doneBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.doneBtnText, { color: colors.accentForeground }]}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Feather name="x" size={22} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.progressCenter}>
          <ProgressRing
            progress={progress}
            size={44}
            strokeWidth={4}
            color={colors.accent}
            trackColor={colors.muted}
          />
          <View style={styles.progressLabel}>
            <Text style={[styles.progressEx, { color: colors.foreground }]}>
              {exIndex + 1}/{exercises.length}
            </Text>
          </View>
        </View>

        <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>
          {formatDuration(sessionTime)}
        </Text>
      </View>

      {/* Exercise display */}
      <ExerciseDisplay
        muscleGroup={currentEx.exercise.muscleGroup}
        exerciseName={currentEx.exercise.name}
      />

      {/* Exercise info */}
      <View style={styles.exInfo}>
        <Text style={[styles.exName, { color: colors.foreground }]} numberOfLines={2}>
          {currentEx.exercise.name}
        </Text>
        <View style={styles.setsRepsRow}>
          <View style={[styles.badge, { backgroundColor: colors.primary + "25", borderColor: colors.primary + "50" }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              Set {Math.min(currentSetNum, currentEx.sets)} of {currentEx.sets}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
              {currentEx.reps} reps
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
              {currentEx.restSeconds}s rest
            </Text>
          </View>
        </View>
        {currentEx.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={2}>
            {currentEx.notes}
          </Text>
        ) : null}
      </View>

      {/* Set logger */}
      <View style={styles.loggerSection}>
        <View style={styles.inputsRow}>
          <View style={[styles.inputBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>WEIGHT (KG)</Text>
            <TextInput
              style={[styles.logInput, { color: colors.foreground }]}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              selectTextOnFocus
            />
          </View>
          <View style={styles.inputSeparator}>
            <Text style={[styles.separatorText, { color: colors.mutedForeground }]}>×</Text>
          </View>
          <View style={[styles.inputBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>REPS</Text>
            <TextInput
              style={[styles.logInput, { color: colors.foreground }]}
              value={repsInput}
              onChangeText={setRepsInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              selectTextOnFocus
            />
          </View>
        </View>

        <Pressable
          onPress={confirmSet}
          style={[styles.confirmBtn, { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.confirmBtnText, { color: colors.accentForeground }]}>
            Confirm Set {Math.min(currentSetNum, currentEx.sets)}
          </Text>
        </Pressable>
      </View>

      {/* Navigation */}
      <View style={[styles.navRow, { paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 16 }]}>
        <Pressable onPress={goBack} disabled={exIndex === 0} style={styles.navBtn} hitSlop={8}>
          <Feather name="skip-back" size={22} color={exIndex === 0 ? colors.muted : colors.mutedForeground} />
        </Pressable>
        <Pressable onPress={togglePause} style={[styles.pauseBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name={isPaused ? "play" : "pause"} size={22} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={goNext} disabled={exIndex === exercises.length - 1} style={styles.navBtn} hitSlop={8}>
          <Feather name="skip-forward" size={22} color={exIndex === exercises.length - 1 ? colors.muted : colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Rest timer overlay */}
      {status === "resting" && (
        <View style={[StyleSheet.absoluteFill, styles.restOverlay]}>
          <LinearGradient
            colors={["rgba(8,8,17,0.96)", "rgba(8,8,17,0.99)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.restContent}>
            <Text style={[styles.restLabel, { color: colors.mutedForeground }]}>REST</Text>
            <View style={styles.ringWrapper}>
              <ProgressRing
                progress={restLeft / (currentEx.restSeconds || 1)}
                size={180}
                strokeWidth={8}
                color={colors.primary}
                trackColor={colors.muted}
              />
              <View style={styles.restCountCenter}>
                <Text style={[styles.restCount, { color: colors.foreground }]}>{restLeft}</Text>
                <Text style={[styles.restSec, { color: colors.mutedForeground }]}>sec</Text>
              </View>
            </View>
            {exIndex + 1 < exercises.length && (
              <View style={styles.nextUpRow}>
                <Text style={[styles.nextUpLabel, { color: colors.mutedForeground }]}>NEXT UP</Text>
                <Text style={[styles.nextUpName, { color: colors.foreground }]}>
                  {exercises[exIndex + 1]?.exercise.name ?? "—"}
                </Text>
              </View>
            )}
            <View style={styles.restActions}>
              <Pressable onPress={togglePause} style={[styles.restBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={isPaused ? "play" : "pause"} size={20} color={colors.foreground} />
              </Pressable>
              <Pressable onPress={skipRest} style={[styles.skipBtn, { backgroundColor: colors.muted }]}>
                <Text style={[styles.skipBtnText, { color: colors.foreground }]}>Skip Rest</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Pause overlay */}
      {isPaused && status === "active" && (
        <View style={[StyleSheet.absoluteFill, styles.pauseOverlay, { backgroundColor: "rgba(8,8,17,0.85)" }]}>
          <Text style={[styles.pausedText, { color: colors.foreground }]}>PAUSED</Text>
          <Pressable onPress={togglePause} style={[styles.resumeBtn, { backgroundColor: colors.accent }]}>
            <Feather name="play" size={24} color={colors.accentForeground} />
            <Text style={[styles.resumeBtnText, { color: colors.accentForeground }]}>Resume</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function StatBox({
  label,
  value,
  accent,
  muted,
  foreground,
  card,
  border,
}: {
  label: string;
  value: string;
  accent: string;
  muted: string;
  foreground: string;
  card: string;
  border: string;
}) {
  return (
    <View style={[statStyles.box, { backgroundColor: card, borderColor: border }]}>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={[statStyles.label, { color: muted }]}>{label}</Text>
    </View>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const statStyles = StyleSheet.create({
  box: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  value: { fontSize: 22, fontWeight: "800" },
  label: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  progressCenter: { alignItems: "center", justifyContent: "center" },
  progressLabel: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  progressEx: { fontSize: 11, fontWeight: "700" },
  sessionTime: { fontSize: 13, fontWeight: "600", minWidth: 40, textAlign: "right" },

  exInfo: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  exName: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, lineHeight: 32 },
  setsRepsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  notes: { fontSize: 13, lineHeight: 19 },

  loggerSection: { paddingHorizontal: 20, marginTop: 20, gap: 14 },
  inputsRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  inputBlock: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
  },
  inputLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  logInput: { fontSize: 36, fontWeight: "800", textAlign: "center" },
  inputSeparator: { width: 32, alignItems: "center" },
  separatorText: { fontSize: 22, fontWeight: "300" },
  confirmBtn: { borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  confirmBtnText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  navBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  restOverlay: { alignItems: "center", justifyContent: "center" },
  restContent: { alignItems: "center", gap: 24 },
  restLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 3, textTransform: "uppercase" },
  ringWrapper: { width: 180, height: 180, alignItems: "center", justifyContent: "center" },
  restCountCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  restCount: { fontSize: 56, fontWeight: "800", lineHeight: 60 },
  restSec: { fontSize: 14, fontWeight: "500" },
  nextUpRow: { alignItems: "center", gap: 4 },
  nextUpLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  nextUpName: { fontSize: 20, fontWeight: "700" },
  restActions: { flexDirection: "row", gap: 12 },
  restBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  skipBtn: { borderRadius: 26, paddingHorizontal: 24, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  skipBtnText: { fontSize: 15, fontWeight: "600" },

  pauseOverlay: { alignItems: "center", justifyContent: "center", gap: 24 },
  pausedText: { fontSize: 24, fontWeight: "800", letterSpacing: 4 },
  resumeBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 16 },
  resumeBtnText: { fontSize: 18, fontWeight: "700" },

  completionContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 20 },
  completionIcon: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  completionTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  completionDay: { fontSize: 16, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 12, width: "100%" },
  doneBtn: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 40, alignItems: "center", marginTop: 8 },
  doneBtnText: { fontSize: 16, fontWeight: "700" },
});
