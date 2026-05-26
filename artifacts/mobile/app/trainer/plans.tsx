import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { api, type ApiPlan, type ApiStudent } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function PlansScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [editPublished, setEditPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([api.plans.list(), api.students.list()]);
      setPlans(p);
      setStudents(s);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user || user.role !== "trainer") {
        router.replace("/login");
        return;
      }
      setLoading(true);
      load();
    }, [user, load])
  );

  const openEdit = (plan: ApiPlan) => {
    setEditingId(plan.id);
    setEditName(plan.name);
    setEditStudentId(plan.studentId ?? null);
    setEditPublished(plan.isPublished ?? false);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (planId: string) => {
    if (!editName.trim()) {
      Alert.alert("Error", "Plan name cannot be empty.");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      const updated = await api.plans.update(planId, {
        name: editName.trim(),
        studentId: editStudentId,
        isPublished: editPublished,
      });
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)));
      setEditingId(null);
    } catch {
      Alert.alert("Error", "Failed to update plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "trainer") return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Plans</Text>
        <Pressable
          onPress={() => router.push("/trainer/create-plan")}
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.newBtnText}>New</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading plans...</Text>
        )}

        {!loading && plans.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clipboard" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No plans yet. Create your first plan!
            </Text>
            <Pressable
              onPress={() => router.push("/trainer/create-plan")}
              style={[styles.createFirstBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.createFirstBtnText}>Create Plan</Text>
            </Pressable>
          </View>
        )}

        {plans.map((plan) => {
          const assignedStudent = students.find((s) => s.id === plan.studentId);
          const isEditing = editingId === plan.id;

          return (
            <View
              key={plan.id}
              style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {!isEditing ? (
                <View style={styles.planRow}>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
                    <Text style={[styles.planMeta, { color: colors.mutedForeground }]}>
                      {assignedStudent ? `Assigned to ${assignedStudent.name}` : "Unassigned"}
                      {" · "}
                      {plan.isPublished ? "Published" : "Draft"}
                    </Text>
                  </View>
                  <View style={styles.planActions}>
                    {plan.isPublished ? (
                      <View style={[styles.publishedBadge, { backgroundColor: colors.accent + "20" }]}>
                        <Text style={[styles.publishedBadgeText, { color: colors.accent }]}>Live</Text>
                      </View>
                    ) : (
                      <View style={[styles.draftBadge, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.draftBadgeText, { color: colors.mutedForeground }]}>Draft</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => openEdit(plan)}
                      style={[styles.editBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
                    >
                      <Feather name="edit-2" size={14} color={colors.primary} />
                      <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.editForm}>
                  <Text style={[styles.editFormTitle, { color: colors.foreground }]}>Edit Plan</Text>

                  <View>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Plan Name</Text>
                    <View style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border }]}>
                      <TextInput
                        style={[styles.inputText, { color: colors.foreground }]}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Plan name"
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Assign Student</Text>
                    <View style={styles.studentChips}>
                      <Pressable
                        onPress={() => setEditStudentId(null)}
                        style={[
                          styles.studentChip,
                          {
                            backgroundColor: editStudentId === null ? colors.primary : colors.card,
                            borderColor: editStudentId === null ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={{ color: editStudentId === null ? "#fff" : colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
                          Unassigned
                        </Text>
                      </Pressable>
                      {students.map((s) => (
                        <Pressable
                          key={s.id}
                          onPress={() => setEditStudentId(s.id)}
                          style={[
                            styles.studentChip,
                            {
                              backgroundColor: editStudentId === s.id ? colors.primary : colors.card,
                              borderColor: editStudentId === s.id ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={{ color: editStudentId === s.id ? "#fff" : colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
                            {s.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.toggleRow}>
                    <View>
                      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Published</Text>
                      <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                        {editPublished ? "Visible to student" : "Hidden from student"}
                      </Text>
                    </View>
                    <Switch
                      value={editPublished}
                      onValueChange={setEditPublished}
                      trackColor={{ false: colors.muted, true: colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>

                  <View style={styles.editActions}>
                    <Pressable
                      onPress={cancelEdit}
                      style={[styles.cancelBtn, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => saveEdit(plan.id)}
                      disabled={saving}
                      style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
                    >
                      <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "800" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: "center" },
  createFirstBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  createFirstBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  planCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  planRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  planInfo: { flex: 1 },
  planName: { fontSize: 15, fontWeight: "700" },
  planMeta: { fontSize: 12, marginTop: 3 },
  planActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  publishedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  publishedBadgeText: { fontSize: 10, fontWeight: "700" },
  draftBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  draftBadgeText: { fontSize: 10, fontWeight: "700" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 12, fontWeight: "600" },
  editForm: { padding: 16, gap: 14 },
  editFormTitle: { fontSize: 16, fontWeight: "700" },
  fieldLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  inputText: { fontSize: 15 },
  studentChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  studentChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleSub: { fontSize: 11, marginTop: 2 },
  editActions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontWeight: "600", fontSize: 14 },
  saveBtn: { flex: 2, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
