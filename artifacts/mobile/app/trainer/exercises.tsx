import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MOCK_EXERCISES } from "@/data/mockData";
import type { Exercise, MuscleGroup } from "@/data/types";
import { useColors } from "@/hooks/useColors";

const MUSCLE_GROUPS: { key: MuscleGroup | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "chest", label: "Chest" },
  { key: "back", label: "Back" },
  { key: "legs", label: "Legs" },
  { key: "shoulders", label: "Shoulders" },
  { key: "biceps", label: "Biceps" },
  { key: "triceps", label: "Triceps" },
  { key: "core", label: "Core" },
  { key: "cardio", label: "Cardio" },
];

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: "#FF6B35",
  back: "#2979FF",
  legs: "#00C853",
  shoulders: "#FFD600",
  biceps: "#AA00FF",
  triceps: "#7B1FA2",
  core: "#00BCD4",
  cardio: "#F44336",
};

const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  chest: "arm-flex",
  back: "rowing",
  legs: "run-fast",
  shoulders: "weight-lifter",
  biceps: "arm-flex-outline",
  triceps: "dumbbell",
  core: "yoga",
  cardio: "heart-pulse",
};

export default function ExercisesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");

  const filtered = MOCK_EXERCISES.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = activeGroup === "all" || ex.muscleGroup === activeGroup;
    return matchesSearch && matchesGroup;
  });

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const renderExercise = ({ item }: { item: Exercise }) => {
    const muscleColor = MUSCLE_COLORS[item.muscleGroup];
    const icon = MUSCLE_ICONS[item.muscleGroup];
    return (
      <View style={[styles.exCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.exIcon, { backgroundColor: muscleColor + "25" }]}>
          <MaterialCommunityIcons name={icon as "dumbbell"} size={24} color={muscleColor} />
        </View>
        <View style={styles.exInfo}>
          <Text style={[styles.exName, { color: colors.foreground }]}>{item.name}</Text>
          <View style={styles.exMeta}>
            <View style={[styles.groupPill, { backgroundColor: muscleColor + "20", borderColor: muscleColor + "50" }]}>
              <Text style={[styles.groupPillText, { color: muscleColor }]}>
                {item.muscleGroup.charAt(0).toUpperCase() + item.muscleGroup.slice(1)}
              </Text>
            </View>
            <Text style={[styles.equipment, { color: colors.mutedForeground }]}>{item.equipment}</Text>
          </View>
          {item.description && (
            <Text style={[styles.exDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        {item.isCustom && (
          <View style={[styles.customBadge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.customText, { color: colors.primary }]}>Custom</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Exercise Library</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {filtered.length} exercises
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { paddingHorizontal: 16, marginTop: 12 }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search exercises..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {MUSCLE_GROUPS.map((g) => (
          <Pressable
            key={g.key}
            onPress={() => setActiveGroup(g.key)}
            style={[
              styles.filterChip,
              activeGroup === g.key
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeGroup === g.key ? "#fff" : colors.mutedForeground },
              ]}
            >
              {g.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(ex) => ex.id}
        renderItem={renderExercise}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="activity" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No exercises found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: "800" },
  count: { fontSize: 13 },
  searchRow: {},
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  list: { padding: 16, gap: 10 },
  exCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12, alignItems: "flex-start" },
  exIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  exInfo: { flex: 1, gap: 6 },
  exName: { fontSize: 16, fontWeight: "700" },
  exMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  groupPillText: { fontSize: 11, fontWeight: "600" },
  equipment: { fontSize: 12 },
  exDesc: { fontSize: 13, lineHeight: 18 },
  customBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  customText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
