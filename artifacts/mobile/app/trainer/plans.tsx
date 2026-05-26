import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useData } from "@/context/DataContext";
import type { WorkoutPlan } from "@/data/types";
import { useColors } from "@/hooks/useColors";

export default function PlansScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plans, students, deletePlan } = useData();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const getStudentName = (studentId: string) => {
    if (!studentId) return "Unassigned";
    return students.find((s) => s.id === studentId)?.name ?? "Unknown";
  };

  const handleDelete = (plan: WorkoutPlan) => {
    Alert.alert(
      "Delete Plan",
      `Delete "${plan.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deletePlan(plan.id);
          },
        },
      ]
    );
  };

  const renderPlan = ({ item }: { item: WorkoutPlan }) => {
    const studentName = getStudentName(item.studentId);
    return (
      <Pressable
        onPress={() => router.push({ pathname: "/plan-builder", params: { planId: item.id } })}
        onLongPress={() => handleDelete(item)}
        style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.planTop}>
          <View style={styles.planInfo}>
            <Text style={[styles.planName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.planMeta}>
              <View style={[styles.metaPill, { backgroundColor: colors.muted }]}>
                <Feather name="calendar" size={11} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {item.days.length} {item.days.length === 1 ? "day" : "days"}
                </Text>
              </View>
              <View
                style={[
                  styles.metaPill,
                  {
                    backgroundColor: item.isPublished
                      ? colors.accent + "20"
                      : colors.muted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metaText,
                    { color: item.isPublished ? colors.accent : colors.mutedForeground },
                  ]}
                >
                  {item.isPublished ? "Published" : "Draft"}
                </Text>
              </View>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>

        <View style={[styles.assignedRow, { borderTopColor: colors.border }]}>
          <View
            style={[
              styles.studentAvatar,
              {
                backgroundColor: item.studentId ? colors.primary + "25" : colors.muted,
              },
            ]}
          >
            <Feather
              name="user"
              size={12}
              color={item.studentId ? colors.primary : colors.mutedForeground}
            />
          </View>
          <Text style={[styles.assignedName, { color: item.studentId ? colors.foreground : colors.mutedForeground }]}>
            {studentName}
          </Text>
        </View>

        {item.days.length > 0 && (
          <View style={styles.daysPreview}>
            {item.days.map((d) => (
              <View key={d.id} style={[styles.dayBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.dayBadgeText, { color: colors.mutedForeground }]}>
                  {d.dayName.slice(0, 3)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Plans</Text>
        <Pressable
          onPress={() => router.push("/plan-builder")}
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.newBtnText}>New Plan</Text>
        </Pressable>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(p) => p.id}
        renderItem={renderPlan}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!plans.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="clipboard" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No plans yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Create your first workout plan and assign it to a student.
            </Text>
            <Pressable
              onPress={() => router.push("/plan-builder")}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.emptyBtnText}>Create Plan</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontWeight: "800" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  planCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  planTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  planInfo: { flex: 1, gap: 8 },
  planName: { fontSize: 17, fontWeight: "700" },
  planMeta: { flexDirection: "row", gap: 8 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  metaText: { fontSize: 11, fontWeight: "600" },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  studentAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  assignedName: { fontSize: 13, fontWeight: "500" },
  daysPreview: { flexDirection: "row", gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
  dayBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dayBadgeText: { fontSize: 11, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: "800" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { marginTop: 8, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
