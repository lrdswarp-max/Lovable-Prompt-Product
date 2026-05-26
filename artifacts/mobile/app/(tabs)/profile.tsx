import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BarChart } from "@/components/ui/BarChart";
import { api, type ApiSession, type ApiFullPlan } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [plan, setPlan] = useState<ApiFullPlan | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user || user.role !== "student") return;
      let active = true;

      async function load() {
        try {
          const [sess, plans] = await Promise.all([
            api.sessions.list(user!.id),
            api.plans.list(user!.id),
          ]);
          if (!active) return;
          setSessions(sess.filter((s) => s.status === "complete"));
          if (plans.length > 0) {
            const full = await api.plans.get(plans[0].id);
            if (active) setPlan(full);
          }
        } catch {
          // keep empty
        }
      }

      load();
      return () => { active = false; };
    }, [user])
  );
  const totalSessions = sessions.length;
  const totalVolume = sessions.reduce((s, sess) => s + (sess.totalVolume ?? 0), 0);

  const topPad = Platform.OS === "web" ? 67 + insets.top : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/login");
  };

  const recentSessions = sessions.slice(0, 7);
  const chartData = recentSessions
    .slice()
    .reverse()
    .map((s) => ({
      label: s.dayName.slice(0, 3),
      value: Math.round((s.totalVolume ?? 0) / 10) * 10,
    }));

  const weekSessions = sessions.filter(
    (s) => Date.now() - s.startTime < 7 * 24 * 3600000
  ).length;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
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

      <View style={styles.statsRow}>
        {[
          { label: "Sessions", value: String(totalSessions) },
          { label: "Volume (kg)", value: totalVolume > 0 ? (totalVolume / 1000).toFixed(1) + "t" : "0" },
          { label: "Active Plan", value: plan ? plan.name.split(" ").slice(0, 2).join(" ") : "—" },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Volume Chart */}
      {chartData.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>VOLUME PER SESSION</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <BarChart
              data={chartData}
              height={130}
              barColor={colors.primary}
              trackColor={colors.muted}
              labelColor={colors.mutedForeground}
              valueColor={colors.foreground}
              unit="kg"
            />
            <Text style={[styles.chartCaption, { color: colors.mutedForeground }]}>
              Last {chartData.length} sessions · {chartData.filter(d => d.value > 0).length} with data
            </Text>
          </View>
        </View>
      )}

      {plan && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CURRENT PROGRAM</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
            <Text style={[styles.planDays, { color: colors.mutedForeground }]}>
              {plan.days.length} training days per week
            </Text>
            <View style={styles.daysList}>
              {plan.days.map((d) => (
                <View key={d.id} style={[styles.dayChip, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.dayChipText, { color: colors.foreground }]}>
                    {d.dayName.slice(0, 3)} · {d.focus}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT ACTIVITY</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {sessions.slice(0, 5).map((s, i) => (
              <View key={s.id}>
                <View style={styles.sessionRow}>
                  <View style={[styles.sessionDot, { backgroundColor: colors.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionFocus, { color: colors.foreground }]}>{s.exerciseFocus}</Text>
                    <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>
                      {s.dayName} · {s.totalVolume ? `${s.totalVolume}kg total` : `${s.loggedSets.length} sets`}
                    </Text>
                  </View>
                  <Text style={[styles.sessionDate, { color: colors.mutedForeground }]}>
                    {Math.floor((Date.now() - s.startTime) / 86400000)}d ago
                  </Text>
                </View>
                {i < Math.min(sessions.length, 5) - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      )}

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
  chartCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  chartCaption: { fontSize: 11, textAlign: "center", marginTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  planName: { fontSize: 18, fontWeight: "800" },
  planDays: { fontSize: 13 },
  daysList: { gap: 6 },
  dayChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  dayChipText: { fontSize: 13, fontWeight: "500" },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionFocus: { fontSize: 14, fontWeight: "600" },
  sessionMeta: { fontSize: 12, marginTop: 2 },
  sessionDate: { fontSize: 11 },
  divider: { height: 1, marginVertical: 8 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
  logoutText: { fontSize: 15, fontWeight: "600" },
});
