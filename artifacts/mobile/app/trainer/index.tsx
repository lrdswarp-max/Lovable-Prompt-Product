import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function TrainerDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { students, conversations, sessions, plans } = useData();

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace("/login");
      } else if (user.role === "student") {
        router.replace("/(tabs)");
      }
    }, [user])
  );

  if (!user || user.role !== "trainer") return null;

  const activeStudents = students.filter((s) => s.status === "active").length;
  const totalStudents = students.length;
  const unreadMessages = conversations.reduce(
    (n, c) => n + c.messages.filter((m) => m.senderId !== user.id).length,
    0
  );
  const recentSessions = sessions.slice(0, 3);
  const publishedPlans = plans.filter((p) => p.isPublished).length;

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{user.name.split(" ")[0]}</Text>
        </View>
        <Pressable
          onPress={async () => { await logout(); router.replace("/login"); }}
          style={[styles.avatarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>{user.name.charAt(0)}</Text>
        </Pressable>
      </View>

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <StatCard label="Active Students" value={String(activeStudents)} sub={`of ${totalStudents} total`} color={colors.primary} colors={colors} />
        <StatCard label="New Messages" value={String(unreadMessages)} sub="unread" color={colors.accent} colors={colors} />
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="users"
            label="Students"
            onPress={() => router.push("/trainer/students")}
            colors={colors}
          />
          <ActionCard
            icon="clipboard"
            label="Plans"
            sub={`${publishedPlans} published`}
            onPress={() => router.push("/trainer/plans")}
            colors={colors}
          />
          <ActionCard
            icon="message-circle"
            label="Messages"
            onPress={() => router.push("/trainer/chat")}
            colors={colors}
            badge={unreadMessages > 0 ? String(unreadMessages) : undefined}
          />
          <ActionCard
            icon="plus-circle"
            label="New Plan"
            onPress={() => router.push("/plan-builder")}
            colors={colors}
          />
        </View>
      </View>

      {/* Recent activity */}
      {recentSessions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RECENT SESSIONS</Text>
          <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recentSessions.map((sess, i) => {
              const student = students.find((s) => s.id === "student1");
              return (
                <View key={sess.id}>
                  <View style={styles.activityRow}>
                    <View style={[styles.activityDot, { backgroundColor: colors.accent }]} />
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityStudent, { color: colors.foreground }]}>
                        {student?.name ?? "Student"}
                      </Text>
                      <Text style={[styles.activityDetail, { color: colors.mutedForeground }]}>
                        {sess.exerciseFocus} · {sess.loggedSets.length} sets logged
                      </Text>
                    </View>
                    <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
                      {Math.floor((Date.now() - sess.startTime) / 3600000)}h ago
                    </Text>
                  </View>
                  {i < recentSessions.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Student roster preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STUDENTS</Text>
          <Pressable onPress={() => router.push("/trainer/students")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </Pressable>
        </View>
        <View style={[styles.rosterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {students.slice(0, 3).map((s, i) => (
            <View key={s.id}>
              <Pressable
                style={styles.rosterRow}
                onPress={() => router.push("/trainer/students")}
              >
                <View style={[styles.rosterAvatar, { backgroundColor: s.status === "active" ? colors.primary + "30" : colors.muted }]}>
                  <Text style={[styles.rosterAvatarText, { color: s.status === "active" ? colors.primary : colors.mutedForeground }]}>
                    {s.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.rosterInfo}>
                  <Text style={[styles.rosterName, { color: colors.foreground }]}>{s.name}</Text>
                  <Text style={[styles.rosterPlan, { color: colors.mutedForeground }]}>
                    {s.activePlanName ?? "No plan assigned"}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: s.status === "active" ? colors.accent + "20" : colors.muted }]}>
                  <Text style={[styles.statusText, { color: s.status === "active" ? colors.accent : colors.mutedForeground }]}>
                    {s.status}
                  </Text>
                </View>
              </Pressable>
              {i < 2 && students.length > i + 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, sub, color, colors }: {
  label: string; value: string; sub: string; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[dashStyles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[dashStyles.statValue, { color }]}>{value}</Text>
      <Text style={[dashStyles.statLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[dashStyles.statSub, { color: colors.mutedForeground }]}>{sub}</Text>
    </View>
  );
}

function ActionCard({ icon, label, sub, onPress, colors, badge }: {
  icon: string; label: string; sub?: string; onPress: () => void;
  colors: ReturnType<typeof useColors>; badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[dashStyles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={{ position: "relative" }}>
        <Feather name={icon as "users"} size={24} color={colors.primary} />
        {badge && (
          <View style={[dashStyles.badgeDot, { backgroundColor: colors.destructive }]}>
            <Text style={dashStyles.badgeDotText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[dashStyles.actionLabel, { color: colors.foreground }]}>{label}</Text>
      {sub && <Text style={[dashStyles.actionSub, { color: colors.mutedForeground }]}>{sub}</Text>}
    </Pressable>
  );
}

const dashStyles = StyleSheet.create({
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 16, gap: 2 },
  statValue: { fontSize: 32, fontWeight: "900" },
  statLabel: { fontSize: 14, fontWeight: "600" },
  statSub: { fontSize: 12 },
  actionCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 16, gap: 6, alignItems: "flex-start", minWidth: "45%" },
  actionLabel: { fontSize: 13, fontWeight: "600" },
  actionSub: { fontSize: 11 },
  badgeDot: { position: "absolute", top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeDotText: { color: "#fff", fontSize: 9, fontWeight: "700" },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 14 },
  name: { fontSize: 28, fontWeight: "800", letterSpacing: -0.3, marginTop: 2 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 12 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  seeAll: { fontSize: 13, fontWeight: "600" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  activityCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  activityRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityInfo: { flex: 1 },
  activityStudent: { fontSize: 14, fontWeight: "600" },
  activityDetail: { fontSize: 12, marginTop: 2 },
  activityTime: { fontSize: 11 },
  divider: { height: 1, marginLeft: 32 },
  rosterCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  rosterRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  rosterAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rosterAvatarText: { fontSize: 16, fontWeight: "700" },
  rosterInfo: { flex: 1 },
  rosterName: { fontSize: 15, fontWeight: "600" },
  rosterPlan: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
