import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { MuscleGroup } from "@/data/types";

const MUSCLE_CONFIG: Record<
  MuscleGroup,
  { gradient: [string, string]; icon: string; label: string }
> = {
  chest: { gradient: ["#FF6B35", "#FF3B30"], icon: "arm-flex", label: "Chest" },
  back: { gradient: ["#2979FF", "#1565C0"], icon: "rowing", label: "Back" },
  legs: { gradient: ["#00C853", "#1B5E20"], icon: "run-fast", label: "Legs" },
  shoulders: { gradient: ["#FFD600", "#F57F17"], icon: "weight-lifter", label: "Shoulders" },
  biceps: { gradient: ["#AA00FF", "#6200EA"], icon: "arm-flex-outline", label: "Biceps" },
  triceps: { gradient: ["#7B1FA2", "#4A148C"], icon: "dumbbell", label: "Triceps" },
  core: { gradient: ["#00BCD4", "#006064"], icon: "yoga", label: "Core" },
  cardio: { gradient: ["#F44336", "#B71C1C"], icon: "heart-pulse", label: "Cardio" },
};

interface ExerciseDisplayProps {
  muscleGroup: MuscleGroup;
  exerciseName: string;
}

export function ExerciseDisplay({ muscleGroup, exerciseName }: ExerciseDisplayProps) {
  const config = MUSCLE_CONFIG[muscleGroup] ?? MUSCLE_CONFIG.chest;

  return (
    <LinearGradient
      colors={config.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons
          name={config.icon as "dumbbell"}
          size={80}
          color="rgba(255,255,255,0.9)"
        />
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{config.label}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
