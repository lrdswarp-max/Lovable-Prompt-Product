import { Feather } from "@expo/vector-icons";
import { useListStudents, useInviteStudent } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, type ApiPlan } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

type ApiStudent = {
  id: string;
  name: string;
  email: string;
  status: string;
  activePlanName?: string;
  lastSession?: string;
  goal?: string;
  weightKg?: string;
};

export default function StudentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<ApiStudent | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const { data: students = [], isLoading: loading, refetch } = useListStudents();
  const inviteStudent = useInviteStudent();

  useFocusEffect(
    useCallback(() => {
      api.plans.list().then(setPlans).catch(() => {});
    }, [])
  );

  const filtered = useMemo(
    () =>
      students.filter(
        (s: ApiStudent) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
      ),
    [students, search]
  );

  const handleAddStudent = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await inviteStudent.mutateAsync({ data: { name: newName.trim(), email: newEmail.trim() } });
      setNewName("");
      setNewEmail("");
      setShowAddModal(false);
      refetch();
      Alert.alert("Invite Sent", `Magic link sent to ${newEmail.trim()}`);
    } catch {
      Alert.alert("Error", "Failed to invite student. Please try again.");
    }
  };

  const handleAssignPlan = async (plan: ApiPlan) => {
    if (!showAssignModal) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.plans.update(plan.id, { studentId: showAssignModal.id });
      setShowAssignModal(null);
      refetch();
      Alert.alert("Plan Assigned", `"${plan.name}" assigned to ${showAssignModal.name}.`);
    } catch {
      Alert.alert("Error", "Failed to assign plan.");
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const renderStudent = ({ item }: { item: ApiStudent }) => (
    <View style={[styles.studentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: item.status === "active" ? colors.primary + "30" : colors.muted }]}>
        <Text style={[styles.avatarText, { color: item.status === "active" ? colors.primary : colors.mutedForeground }]}>
          {item.name.charAt(0)}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.studentName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.studentEmail, { color: colors.mutedForeground }]}>{item.email}</Text>
        {item.activePlanName && (
          <Text style={[styles.planTag, { color: colors.primary }]}>{item.activePlanName}</Text>
        )}
        {item.lastSession && (
          <Text style={[styles.lastSession, { color: colors.mutedForeground }]}>
            Last session: {item.lastSession}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        <View style={[styles.statusBadge, { backgroundColor: item.status === "active" ? colors.accent + "20" : colors.muted }]}>
          <Text style={[styles.statusText, { color: item.status === "active" ? colors.accent : colors.mutedForeground }]}>
            {item.status}
          </Text>
        </View>
        {item.status === "active" && (
          <Pressable
            onPress={() => setShowAssignModal(item)}
            style={[styles.assignBtn, { borderColor: colors.primary + "60", backgroundColor: colors.primary + "15" }]}
            hitSlop={4}
          >
            <Feather name="clipboard" size={12} color={colors.primary} />
            <Text style={[styles.assignBtnText, { color: colors.primary }]}>Plan</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Students</Text>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="user-plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: 12 }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search students..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        renderItem={renderStudent}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {loading ? "Loading..." : "No students found"}
            </Text>
          </View>
        }
      />

      {showAddModal && (
        <View style={[StyleSheet.absoluteFill, styles.modalOverlay, { backgroundColor: "rgba(8,8,17,0.92)" }]}>
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add New Student</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              They'll receive a magic link to create their account.
            </Text>
            <View style={[styles.modalInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                style={[styles.modalInputText, { color: colors.foreground }]}
                placeholder="Full name"
                placeholderTextColor={colors.mutedForeground}
                value={newName}
                onChangeText={setNewName}
              />
            </View>
            <View style={[styles.modalInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                style={[styles.modalInputText, { color: colors.foreground }]}
                placeholder="Email address"
                placeholderTextColor={colors.mutedForeground}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAddModal(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddStudent} style={[styles.inviteBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.inviteText}>Send Invite</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {showAssignModal && (
        <View style={[StyleSheet.absoluteFill, styles.modalOverlay, { backgroundColor: "rgba(8,8,17,0.92)" }]}>
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleInfo}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Assign Plan</Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                  Choose a plan for {showAssignModal.name}
                </Text>
              </View>
              <Pressable onPress={() => setShowAssignModal(null)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {plans.length === 0 ? (
              <Text style={[styles.noPlansText, { color: colors.mutedForeground }]}>
                No plans available. Create a plan first.
              </Text>
            ) : (
              plans.map((plan) => (
                <Pressable
                  key={plan.id}
                  onPress={() => handleAssignPlan(plan)}
                  style={[styles.planOption, {
                    backgroundColor: showAssignModal.activePlanName === plan.name ? colors.primary + "20" : colors.input,
                    borderColor: showAssignModal.activePlanName === plan.name ? colors.primary : colors.border,
                  }]}
                >
                  <View style={styles.planOptionInfo}>
                    <Text style={[styles.planOptionName, { color: colors.foreground }]}>{plan.name}</Text>
                    <Text style={[styles.planOptionMeta, { color: colors.mutedForeground }]}>
                      {plan.isPublished ? "Published" : "Draft"}
                    </Text>
                  </View>
                  {showAssignModal.activePlanName === plan.name && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </Pressable>
              ))
            )}

            <Pressable onPress={() => setShowAssignModal(null)} style={[styles.cancelBtnFull, { borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  searchWrapper: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  searchInput: { flex: 1, fontSize: 15 },
  list: { padding: 16, gap: 10 },
  studentCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  info: { flex: 1, gap: 2 },
  studentName: { fontSize: 16, fontWeight: "700" },
  studentEmail: { fontSize: 13 },
  planTag: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  lastSession: { fontSize: 11, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  assignBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  assignBtnText: { fontSize: 11, fontWeight: "600" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  modalOverlay: { alignItems: "center", justifyContent: "center" },
  modal: { width: "88%", borderRadius: 20, borderWidth: 1, padding: 24, gap: 12 },
  modalTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitleInfo: { flex: 1, gap: 4 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalSub: { fontSize: 14, lineHeight: 20 },
  modalInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  modalInputText: { fontSize: 15 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: "center" },
  cancelBtnFull: { borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 15, fontWeight: "600" },
  inviteBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  inviteText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  planOption: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  planOptionInfo: { flex: 1, gap: 2 },
  planOptionName: { fontSize: 15, fontWeight: "700" },
  planOptionMeta: { fontSize: 12 },
  noPlansText: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingVertical: 8 },
});
