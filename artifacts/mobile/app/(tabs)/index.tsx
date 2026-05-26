import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { api, type ApiFullPlan, type ApiSession, type ApiConversation } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const MUSCLE_COLORS: Record<string, string> = {
  chest: "#FF6B35",
  back: "#2979FF",
  legs: "#00C853",
  shoulders: "#FFD600",
  biceps: "#AA00FF",
  triceps: "#7B1FA2",
  core: "#00BCD4",
  cardio: "#F44336",
};

function SessionCard({ session }: { session: ApiSession }) {
  const colors = useColors();
  const duration = session.endTime
    ? Math.round((session.endTime - session.startTime) / 60000)
    : 0;
  const daysAgo = Math.floor((Date.now() - session.startTime) / (1000 * 60 * 60 * 24));

  return (
    <View style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sessionDot, { backgroundColor: colors.accent }]} />
      <Text style={[styles.sessionFocus, { color: colors.foreground }]} numberOfLines={1}>
        {session.exerciseFocus}
      </Text>
      <Text style={[styles.sessionDay, { color: colors.mutedForeground }]}>{session.dayName}</Text>
      <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>
        {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`} · {duration}m
      </Text>
    </View>
  );
}

export default function StudentHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [plan, setPlan] = useState<ApiFullPlan | null>(null);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace("/login");
      } else if (user.role === "trainer") {
        router.replace("/trainer");
      }
    }, [user])
  );

  useFocusEffect(
    useCallback(() => {
      if (!user || user.role !== "student") return;
      let active = true;

      async function load() {
        setLoading(true);
        try {
          const [plans, sess, convs] = await Promise.all([
            api.plans.list(user!.id),
            api.sessions.list(user!.id),
            api.conversations.list(user!.id),
          ]);

          if (!active) return;
          if (plans.length > 0) {
            const full = await api.plans.get(plans[0].id);
            if (active) setPlan(full);
          }
          if (active) {
            setSessions(sess.filter((s) => s.status === "complete"));
            setConversations(convs);
          }
        } catch {
          // Keep empty state
        } finally {
          if (active) setLoading(false);
        }
      }

      load();
      return () => { active = false; };
    }, [user])
  );

  const scale = React.useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  if (!user || user.role !== "student") return null;

  const topPad = Platform.OS === "web" ? 67 + insets.top : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const todayDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const todayDay = plan?.days.find((d) => d.dayName === todayDayName) ?? plan?.days[0];

  const latestConv = conversations[0];
  const latestMessage = latestConv?.lastMessage;
  const trainerName = latestConv?.participantNames.find((n) => n !== user?.name) ?? "Coach";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Good {getTimeOfDay()},
            </Text>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {user.name.split(" ")[0]}
            </Text>
          </View>
          <Pressable
            onPress={logout}
            style={[styles.avatarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user.name.charAt(0)}
            </Text>
          </Pressable>
        </View>

        {/* Today's workout */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TODAY'S WORKOUT</Text>
          {todayDay ? (
            <LinearGradient
              colors={["#1A0A3E", "#0E0E1C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.workoutCard, { borderColor: colors.primary + "40" }]}
            >
              <View style={styles.workoutTop}>
                <View>
                  <Text style={[styles.workoutDay, { color: colors.primary }]}>{todayDay.dayName}</Text>
                  <Text style={[styles.workoutFocus, { color: colors.foreground }]}>{todayDay.focus}</Text>
                  <Text style={[styles.workoutPlan, { color: colors.mutedForeground }]}>{plan?.name}</Text>
                </View>
                <View style={styles.workoutMeta}>
                  <Text style={[styles.exerciseCount, { color: colors.accent }]}>{todayDay.exercises.length}</Text>
                  <Text style={[styles.exerciseLabel, { color: colors.mutedForeground }]}>exercises</Text>
                </View>
              </View>

              <View style={styles.muscleRow}>
                {[...new Set(todayDay.exercises.map((e) => e.exercise?.muscleGroup).filter(Boolean))].map((mg) => (
                  <View
                    key={mg}
                    style={[styles.musclePill, { backgroundColor: (MUSCLE_COLORS[mg!] ?? colors.primary) + "25", borderColor: (MUSCLE_COLORS[mg!] ?? colors.primary) + "60" }]}
                  >
                    <Text style={[styles.musclePillText, { color: MUSCLE_COLORS[mg!] ?? colors.primary }]}>
                      {mg!.charAt(0).toUpperCase() + mg!.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>

              <Animated.View style={{ transform: [{ scale }] }}>
                <Pressable
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/workout?dayId=${todayDay.id}&planId=${plan?.id}`);
                  }}
                  style={[styles.startBtn, { backgroundColor: colors.accent }]}
                >
                  <MaterialCommunityIcons name="play" size={20} color={colors.accentForeground} />
                  <Text style={[styles.startBtnText, { color: colors.accentForeground }]}>Start Workout</Text>
                </Pressable>
              </Animated.View>
            </LinearGradient>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {loading ? "Loading workout..." : "No plan assigned yet. Check with your trainer!"}
              </Text>
            </View>
          )}
        </View>

        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RECENT SESSIONS</Text>
            <FlatList
              data={sessions.slice(0, 5)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.sessionsList}
              renderItem={({ item }) => <SessionCard session={item} />}
              scrollEnabled={sessions.length > 1}
            />
          </View>
        )}

        {/* Trainer message preview */}
        {latestMessage && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FROM YOUR TRAINER</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/chat")}
              style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.trainerAvatar, { backgroundColor: colors.primary + "30" }]}>
                <Text style={[styles.trainerAvatarText, { color: colors.primary }]}>
                  {trainerName.charAt(0)}
                </Text>
              </View>
              <View style={styles.messageContent}>
                <Text style={[styles.trainerName, { color: colors.foreground }]}>{trainerName}</Text>
                <Text style={[styles.messagePreview, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {latestMessage.text}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 14, fontWeight: "500" },
  name: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  workoutCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  workoutTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  workoutDay: { fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  workoutFocus: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  workoutPlan: { fontSize: 13, marginTop: 4 },
  workoutMeta: { alignItems: "center" },
  exerciseCount: { fontSize: 40, fontWeight: "900", lineHeight: 44 },
  exerciseLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 },
  muscleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  musclePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  musclePillText: { fontSize: 11, fontWeight: "600" },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  startBtnText: { fontSize: 16, fontWeight: "700" },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  sessionsList: { gap: 12, paddingRight: 4 },
  sessionCard: { width: 140, borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  sessionDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  sessionFocus: { fontSize: 13, fontWeight: "700" },
  sessionDay: { fontSize: 12 },
  sessionMeta: { fontSize: 11, marginTop: 4 },
  messageCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  trainerAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  trainerAvatarText: { fontSize: 17, fontWeight: "700" },
  messageContent: { flex: 1, gap: 2 },
  trainerName: { fontSize: 14, fontWeight: "700" },
  messagePreview: { fontSize: 13, lineHeight: 18 },
});
