import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { api, type ApiStudent, type ApiExercise, type ApiDay, type ApiPlan } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

type Step = "plan" | "days" | "exercises" | "review";

interface LocalDay {
  dayName: string;
  focus: string;
  exercises: Array<{ exercise: ApiExercise; sets: number; reps: string; restSeconds: number }>;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function CreatePlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("plan");
  const [planName, setPlanName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [days, setDays] = useState<LocalDay[]>([]);
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [saving, setSaving] = useState(false);

  // For day editing
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayName, setDayName] = useState("");
  const [dayFocus, setDayFocus] = useState("");

  // For exercise picker
  const [exPickerDay, setExPickerDay] = useState<number | null>(null);
  const [exSearch, setExSearch] = useState("");

  useEffect(() => {
    api.students.list().then(setStudents).catch(() => {});
    api.exercises.list().then(setExercises).catch(() => {});
  }, []);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const addDay = () => {
    if (!dayName.trim()) return;
    setDays((prev) => [...prev, { dayName: dayName.trim(), focus: dayFocus.trim(), exercises: [] }]);
    setDayName("");
    setDayFocus("");
    setEditingDay(null);
  };

  const removeDay = (i: number) => setDays((prev) => prev.filter((_, idx) => idx !== i));

  const addExerciseToDay = (dayIdx: number, ex: ApiExercise) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIdx ? d : { ...d, exercises: [...d.exercises, { exercise: ex, sets: 3, reps: "8-12", restSeconds: 90 }] }
      )
    );
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIdx ? d : { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
      )
    );
  };

  const handleSave = async () => {
    if (!planName.trim()) { Alert.alert("Error", "Please enter a plan name."); return; }
    if (days.length === 0) { Alert.alert("Error", "Add at least one training day."); return; }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const plan: ApiPlan = await api.plans.create({
        name: planName.trim(),
        studentId: selectedStudentId ?? undefined,
        isPublished: true,
      });

      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        const dayRes: ApiDay = await api.plans.addDay(plan.id, {
          dayName: d.dayName,
          focus: d.focus,
          orderIndex: i,
        });
        for (let j = 0; j < d.exercises.length; j++) {
          const ex = d.exercises[j];
          await api.plans.addExercise(plan.id, dayRes.id, {
            exerciseId: ex.exercise.id,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            orderIndex: j,
          });
        }
      }

      Alert.alert("Plan Created!", `"${plan.name}" is ready.`, [{ text: "OK", onPress: () => router.back() }]);
    } catch {
      Alert.alert("Error", "Failed to save plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filteredEx = exercises.filter((e) =>
    e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(exSearch.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Plan</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
        </Pressable>
      </View>

      {/* Step tabs */}
      <View style={[styles.stepRow, { borderBottomColor: colors.border }]}>
        {(["plan", "days", "exercises", "review"] as Step[]).map((s) => (
          <Pressable key={s} onPress={() => setStep(s)} style={styles.stepTab}>
            <Text style={[styles.stepTabText, { color: step === s ? colors.primary : colors.mutedForeground, fontWeight: step === s ? "700" : "400" }]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
            {step === s && <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />}
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]} keyboardShouldPersistTaps="handled">
        {/* Step 1: Plan info */}
        {step === "plan" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Plan Details</Text>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Plan Name</Text>
              <View style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.inputText, { color: colors.foreground }]}
                  placeholder="e.g. 4-Day Strength Block"
                  placeholderTextColor={colors.mutedForeground}
                  value={planName}
                  onChangeText={setPlanName}
                />
              </View>
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Assign to Student (optional)</Text>
              <View style={styles.studentList}>
                <Pressable
                  onPress={() => setSelectedStudentId(null)}
                  style={[styles.studentChip, { backgroundColor: !selectedStudentId ? colors.primary : colors.card, borderColor: !selectedStudentId ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: !selectedStudentId ? "#fff" : colors.mutedForeground, fontSize: 13, fontWeight: "600" }}>No assignment</Text>
                </Pressable>
                {students.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setSelectedStudentId(s.id)}
                    style={[styles.studentChip, { backgroundColor: selectedStudentId === s.id ? colors.primary : colors.card, borderColor: selectedStudentId === s.id ? colors.primary : colors.border }]}
                  >
                    <Text style={{ color: selectedStudentId === s.id ? "#fff" : colors.mutedForeground, fontSize: 13, fontWeight: "600" }}>{s.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => setStep("days")}
              style={[styles.nextStepBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.nextStepText}>Next: Training Days →</Text>
            </Pressable>
          </View>
        )}

        {/* Step 2: Days */}
        {step === "days" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Training Days</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Add the days you want to train each week.
            </Text>

            {days.map((d, i) => (
              <View key={i} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayCardName, { color: colors.foreground }]}>{d.dayName}</Text>
                  <Text style={[styles.dayCardFocus, { color: colors.mutedForeground }]}>{d.focus || "No focus set"}</Text>
                </View>
                <Pressable onPress={() => removeDay(i)} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </Pressable>
              </View>
            ))}

            {editingDay === -1 ? (
              <View style={[styles.addDayForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Day of Week</Text>
                <View style={styles.weekdayRow}>
                  {WEEKDAYS.map((wd) => (
                    <Pressable
                      key={wd}
                      onPress={() => setDayName(wd)}
                      style={[styles.weekdayChip, { backgroundColor: dayName === wd ? colors.primary : colors.muted }]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "600", color: dayName === wd ? "#fff" : colors.mutedForeground }}>
                        {wd.slice(0, 3)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Focus / Muscle Group</Text>
                <View style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.inputText, { color: colors.foreground }]}
                    placeholder="e.g. Chest & Triceps"
                    placeholderTextColor={colors.mutedForeground}
                    value={dayFocus}
                    onChangeText={setDayFocus}
                  />
                </View>
                <View style={styles.addDayActions}>
                  <Pressable onPress={() => setEditingDay(null)} style={[styles.cancelChip, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.mutedForeground, fontWeight: "600" }}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={addDay} style={[styles.addDayConfirm, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Add Day</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setEditingDay(-1)}
                style={[styles.addDayBtn, { borderColor: colors.primary }]}
              >
                <Feather name="plus" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Add Training Day</Text>
              </Pressable>
            )}

            <Pressable onPress={() => setStep("exercises")} style={[styles.nextStepBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.nextStepText}>Next: Add Exercises →</Text>
            </Pressable>
          </View>
        )}

        {/* Step 3: Exercises */}
        {step === "exercises" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exercises</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Select a day to add exercises to it.
            </Text>

            {days.map((d, dayIdx) => (
              <View key={dayIdx} style={[styles.exDayBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.exDayHeader}>
                  <View>
                    <Text style={[styles.dayCardName, { color: colors.foreground }]}>{d.dayName}</Text>
                    <Text style={[styles.dayCardFocus, { color: colors.mutedForeground }]}>{d.focus}</Text>
                  </View>
                  <Pressable
                    onPress={() => { setExPickerDay(dayIdx); setExSearch(""); }}
                    style={[styles.addExBtn, { backgroundColor: colors.primary }]}
                  >
                    <Feather name="plus" size={14} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Add</Text>
                  </Pressable>
                </View>
                {d.exercises.map((ex, exIdx) => (
                  <View key={exIdx} style={[styles.exRow, { borderTopColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exName, { color: colors.foreground }]}>{ex.exercise.name}</Text>
                      <Text style={[styles.exMeta, { color: colors.mutedForeground }]}>
                        {ex.sets} sets · {ex.reps} reps · {ex.restSeconds}s rest
                      </Text>
                    </View>
                    <Pressable onPress={() => removeExercise(dayIdx, exIdx)} hitSlop={8}>
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))}
                {d.exercises.length === 0 && (
                  <Text style={[styles.emptyExText, { color: colors.mutedForeground }]}>No exercises yet</Text>
                )}
              </View>
            ))}

            {days.length === 0 && (
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                Go back and add training days first.
              </Text>
            )}

            <Pressable onPress={() => setStep("review")} style={[styles.nextStepBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.nextStepText}>Review & Save →</Text>
            </Pressable>
          </View>
        )}

        {/* Step 4: Review */}
        {step === "review" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Review Plan</Text>
            <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.reviewPlanName, { color: colors.foreground }]}>{planName || "Unnamed Plan"}</Text>
              {selectedStudentId && (
                <Text style={[styles.reviewStudent, { color: colors.primary }]}>
                  Assigned to: {students.find((s) => s.id === selectedStudentId)?.name ?? selectedStudentId}
                </Text>
              )}
              <Text style={[styles.reviewMeta, { color: colors.mutedForeground }]}>
                {days.length} training days · {days.reduce((n, d) => n + d.exercises.length, 0)} total exercises
              </Text>
            </View>

            {days.map((d, i) => (
              <View key={i} style={[styles.reviewDay, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.reviewDayName, { color: colors.foreground }]}>{d.dayName} · {d.focus}</Text>
                {d.exercises.map((ex, j) => (
                  <Text key={j} style={[styles.reviewEx, { color: colors.mutedForeground }]}>
                    {j + 1}. {ex.exercise.name} — {ex.sets}×{ex.reps}
                  </Text>
                ))}
                {d.exercises.length === 0 && (
                  <Text style={[styles.reviewEx, { color: colors.muted }]}>No exercises</Text>
                )}
              </View>
            ))}

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.nextStepBtn, { backgroundColor: colors.accent, opacity: saving ? 0.7 : 1 }]}
            >
              <Text style={[styles.nextStepText, { color: colors.accentForeground }]}>
                {saving ? "Saving Plan..." : "Create Plan"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Exercise picker modal */}
      {exPickerDay !== null && (
        <View style={[StyleSheet.absoluteFill, styles.pickerOverlay, { backgroundColor: "rgba(8,8,17,0.94)" }]}>
          <View style={[styles.pickerModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
                Add to {days[exPickerDay]?.dayName}
              </Text>
              <Pressable onPress={() => setExPickerDay(null)} hitSlop={8}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.pickerSearch, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="search" size={14} color={colors.mutedForeground} />
              <TextInput
                style={[styles.pickerSearchInput, { color: colors.foreground }]}
                placeholder="Search exercises..."
                placeholderTextColor={colors.mutedForeground}
                value={exSearch}
                onChangeText={setExSearch}
                autoFocus
              />
            </View>
            <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
              {filteredEx.map((ex) => (
                <Pressable
                  key={ex.id}
                  onPress={() => {
                    addExerciseToDay(exPickerDay, ex);
                    setExPickerDay(null);
                  }}
                  style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                >
                  <View>
                    <Text style={[styles.pickerExName, { color: colors.foreground }]}>{ex.name}</Text>
                    <Text style={[styles.pickerExMeta, { color: colors.mutedForeground }]}>
                      {ex.muscleGroup} · {ex.equipment}
                    </Text>
                  </View>
                  <Feather name="plus-circle" size={18} color={colors.primary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  stepRow: { flexDirection: "row", borderBottomWidth: 1 },
  stepTab: { flex: 1, alignItems: "center", paddingVertical: 12, position: "relative" },
  stepTabText: { fontSize: 12 },
  stepLine: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2 },
  content: { padding: 16, gap: 16 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  sectionSub: { fontSize: 14, lineHeight: 20 },
  fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  inputText: { fontSize: 15 },
  studentList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  studentChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  nextStepBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  nextStepText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  dayCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  dayCardName: { fontSize: 15, fontWeight: "700" },
  dayCardFocus: { fontSize: 13, marginTop: 2 },
  addDayForm: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  weekdayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  weekdayChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addDayActions: { flexDirection: "row", gap: 10 },
  cancelChip: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: "center" },
  addDayConfirm: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  addDayBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", paddingVertical: 14 },
  exDayBlock: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  exDayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  addExBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  exRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  exName: { fontSize: 14, fontWeight: "600" },
  exMeta: { fontSize: 12, marginTop: 2 },
  emptyExText: { fontSize: 13, padding: 12, paddingTop: 0 },
  reviewCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  reviewPlanName: { fontSize: 20, fontWeight: "800" },
  reviewStudent: { fontSize: 13, fontWeight: "600" },
  reviewMeta: { fontSize: 13 },
  reviewDay: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  reviewDayName: { fontSize: 15, fontWeight: "700" },
  reviewEx: { fontSize: 13, lineHeight: 20 },
  pickerOverlay: { alignItems: "center", justifyContent: "flex-end" },
  pickerModal: { width: "100%", maxHeight: "75%", borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, overflow: "hidden" },
  pickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  pickerTitle: { fontSize: 16, fontWeight: "700" },
  pickerSearch: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  pickerSearchInput: { flex: 1, fontSize: 14 },
  pickerList: { maxHeight: 350 },
  pickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  pickerExName: { fontSize: 15, fontWeight: "600" },
  pickerExMeta: { fontSize: 12, marginTop: 2 },
});
