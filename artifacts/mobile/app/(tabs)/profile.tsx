import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
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
import { MOCK_PAST_SESSIONS, MOCK_PLAN, MOCK_STUDENTS } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const studentRecord = MOCK_STUDENTS.find((s) => s.id === user?.id) ?? MOCK_STUDENTS[0];
  const totalSessions = MOCK_PAST_SESSIONS.length;
  const totalVolume = MOCK_PAST_SESSIONS.reduce((s, sess) => s + (sess.totalVolume ?? 0), 0);

  const topPad = Platform.OS === "web" ? 67 + insets.top : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/login");
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <LinearGradient
        colors={["#1A0A3E", colors.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.profileHero}
      >
        <View style={[styles.bigAvatar, { borderColor: colors.primary }]}>
          <Text style={[styles.bigAvatarText, { color: colors.primary }]}>
            {user?.name.charAt(0) ?? "A"}
          </Text>
        </View>
        <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.name}</Text>
        <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Sessions", value: String(totalSessions) },
          { label: "Volume (kg)", value: (totalVolume / 1000).toFixed(1) + "t" },
          { label: "Active Plan", value: MOCK_PLAN.name.split(" ").slice(0, 2).join(" ") },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Measurements */}
      {studentRecord.measurements && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MEASUREMENTS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {studentRecord.measurements.weight && (
              <Row icon="activity" label="Weight" value={`${studentRecord.measurements.weight} kg`} colors={colors} />
            )}
            {studentRecord.measurements.height && (
              <Row icon="maximize-2" label="Height" value={`${studentRecord.measurements.height} cm`} colors={colors} />
            )}
            {studentRecord.measurements.goals && (
              <Row icon="target" label="Goal" value={studentRecord.measurements.goals} colors={colors} />
            )}
          </View>
        </View>
      )}

      {/* Active plan */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CURRENT PROGRAM</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.planName, { color: colors.foreground }]}>{MOCK_PLAN.name}</Text>
          <Text style={[styles.planDays, { color: colors.mutedForeground }]}>
            {MOCK_PLAN.days.length} training days per week
          </Text>
          <View style={styles.daysList}>
            {MOCK_PLAN.days.map((d) => (
              <View key={d.id} style={[styles.dayChip, { backgroundColor: colors.muted }]}>
                <Text style={[styles.dayChipText, { color: colors.foreground }]}>
                  {d.dayName.slice(0, 3)} · {d.focus}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        style={[styles.logoutBtn, { borderColor: colors.border }]}
      >
        <Feather name="log-out" size={16} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.row}>
      <Feather name={icon as "activity"} size={16} color={colors.mutedForeground} />
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.foreground }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },
  profileHero: { alignItems: "center", paddingVertical: 24, borderRadius: 20, gap: 8 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, backgroundColor: "rgba(124,123,255,0.15)", alignItems: "center", justifyContent: "center" },
  bigAvatarText: { fontSize: 32, fontWeight: "800" },
  profileName: { fontSize: 22, fontWeight: "800" },
  profileEmail: { fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, textAlign: "center" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { fontSize: 13, width: 60 },
  rowValue: { flex: 1, fontSize: 14, fontWeight: "600" },
  planName: { fontSize: 18, fontWeight: "800" },
  planDays: { fontSize: 13 },
  daysList: { gap: 6 },
  dayChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  dayChipText: { fontSize: 13, fontWeight: "500" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
  logoutText: { fontSize: 15, fontWeight: "600" },
});
