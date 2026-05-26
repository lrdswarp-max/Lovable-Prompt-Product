import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
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

import { useData } from "@/context/DataContext";
import { MOCK_EXERCISES } from "@/data/mockData";
import type { Exercise, WorkoutDay, WorkoutExercise, WorkoutPlan } from "@/data/types";
import { useColors } from "@/hooks/useColors";

type DraftExercise = {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: string;
  reps: string;
  restSeconds: string;
  notes: string;
};

type DraftDay = {
  id: string;
  dayName: string;
  focus: string;
  exercises: DraftExercise[];
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MUSCLE_GROUPS = ["chest", "back", "legs", "shoulders", "biceps", "triceps", "core", "cardio"];

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function planToDraft(plan: WorkoutPlan): { name: string; studentId: string; days: DraftDay[] } {
  return {
    name: plan.name,
    studentId: plan.studentId,
    days: plan.days.map((d) => ({
      id: d.id,
      dayName: d.dayName,
      focus: d.focus,
      exercises: d.exercises.map((e) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        exercise: e.exercise,
        sets: String(e.sets),
        reps: e.reps,
        restSeconds: String(e.restSeconds),
        notes: e.notes ?? "",
      })),
    })),
  };
}

function draftToPlan(
  id: string,
  name: string,
  studentId: string,
  days: DraftDay[],
  isPublished: boolean
): WorkoutPlan {
  return {
    id,
    name: name.trim() || "Untitled Plan",
    studentId,
    isPublished,
    days: days.map((d) => ({
      id: d.id,
      dayName: d.dayName,
      focus: d.focus.trim() || "Training",
      exercises: d.exercises.map<WorkoutExercise>((e) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        exercise: e.exercise,
        sets: Math.max(1, parseInt(e.sets) || 3),
        reps: e.reps || "8-12",
        restSeconds: Math.max(30, parseInt(e.restSeconds) || 90),
        notes: e.notes,
      })),
    })),
  };
}

export default function PlanBuilderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const { plans, students, savePlan } = useData();

  const existingPlan = planId ? plans.find((p) => p.id === planId) : undefined;
  const draft = existingPlan ? planToDraft(existingPlan) : null;

  const [planName, setPlanName] = useState(draft?.name ?? "");
  const [selectedStudentId, setSelectedStudentId] = useState(draft?.studentId ?? "");
  const [days, setDays] = useState<DraftDay[]>(draft?.days ?? []);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState<string | null>(null);
  const [exerciseFilter, setExerciseFilter] = useState("");
  const [editingExercise, setEditingExercise] = useState<{
    dayId: string;
    ex: DraftExercise;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "active"),
    [students]
  );

  const filteredExercises = useMemo(
    () =>
      MOCK_EXERCISES.filter(
        (e) =>
          e.name.toLowerCase().includes(exerciseFilter.toLowerCase()) ||
          e.muscleGroup.toLowerCase().includes(exerciseFilter.toLowerCase())
      ),
    [exerciseFilter]
  );

  const addDay = () => {
    const usedNames = days.map((d) => d.dayName);
    const nextName = DAY_NAMES.find((n) => !usedNames.includes(n)) ?? `Day ${days.length + 1}`;
    const newDay: DraftDay = {
      id: generateId(),
      dayName: nextName,
      focus: "",
      exercises: [],
    };
    setDays((prev) => [...prev, newDay]);
    setExpandedDay(newDay.id);
  };

  const removeDay = (dayId: string) => {
    setDays((prev) => prev.filter((d) => d.id !== dayId));
    if (expandedDay === dayId) setExpandedDay(null);
  };

  const updateDay = (dayId: string, field: keyof Pick<DraftDay, "dayName" | "focus">, value: string) => {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, [field]: value } : d)));
  };

  const addExercise = (dayId: string, exercise: Exercise) => {
    const newEx: DraftExercise = {
      id: generateId(),
      exerciseId: exercise.id,
      exercise,
      sets: "3",
      reps: "8-12",
      restSeconds: "90",
      notes: "",
    };
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, newEx] } : d))
    );
    setShowExercisePicker(null);
    setExerciseFilter("");
    setEditingExercise({ dayId, ex: newEx });
  };

  const updateExercise = (dayId: string, ex: DraftExercise) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.map((e) => (e.id === ex.id ? ex : e)) }
          : d
      )
    );
  };

  const removeExercise = (dayId: string, exId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d
      )
    );
  };

  const handleSave = useCallback(
    async (publish: boolean) => {
      if (!planName.trim()) {
        Alert.alert("Plan name required", "Please enter a name for the plan.");
        return;
      }
      setIsSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const id = planId ?? generateId();
      const plan = draftToPlan(id, planName, selectedStudentId, days, publish);
      await savePlan(plan);
      setIsSaving(false);
      router.back();
    },
    [planName, selectedStudentId, days, planId, savePlan]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {existingPlan ? "Edit Plan" : "New Plan"}
        </Text>
        <Pressable
          onPress={() => handleSave(false)}
          disabled={isSaving}
          style={[styles.saveBtn, { backgroundColor: colors.muted }]}
        >
          <Text style={[styles.saveBtnText, { color: colors.foreground }]}>Save Draft</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Plan name */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PLAN NAME</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputText, { color: colors.foreground }]}
              placeholder="e.g. Strength Block II"
              placeholderTextColor={colors.mutedForeground}
              value={planName}
              onChangeText={setPlanName}
            />
          </View>
        </View>

        {/* Assign to student */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ASSIGN TO STUDENT</Text>
          <View style={styles.studentGrid}>
            <Pressable
              onPress={() => setSelectedStudentId("")}
              style={[
                styles.studentChip,
                {
                  backgroundColor: !selectedStudentId ? colors.primary + "25" : colors.card,
                  borderColor: !selectedStudentId ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.studentChipText,
                  { color: !selectedStudentId ? colors.primary : colors.mutedForeground },
                ]}
              >
                Unassigned
              </Text>
            </Pressable>
            {activeStudents.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSelectedStudentId(s.id)}
                style={[
                  styles.studentChip,
                  {
                    backgroundColor:
                      selectedStudentId === s.id ? colors.primary + "25" : colors.card,
                    borderColor: selectedStudentId === s.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.studentChipText,
                    {
                      color:
                        selectedStudentId === s.id ? colors.primary : colors.mutedForeground,
                    },
                  ]}
                >
                  {s.name.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Training days */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              TRAINING DAYS ({days.length})
            </Text>
          </View>

          {days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              isExpanded={expandedDay === day.id}
              colors={colors}
              onToggle={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
              onUpdateDay={updateDay}
              onRemoveDay={removeDay}
              onAddExercise={() => {
                setShowExercisePicker(day.id);
                setExpandedDay(day.id);
              }}
              onEditExercise={(ex) => setEditingExercise({ dayId: day.id, ex })}
              onRemoveExercise={(exId) => removeExercise(day.id, exId)}
            />
          ))}

          <Pressable
            onPress={addDay}
            style={[styles.addDayBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Feather name="plus" size={18} color={colors.primary} />
            <Text style={[styles.addDayText, { color: colors.primary }]}>Add Training Day</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Publish FAB */}
      <View
        style={[
          styles.fab,
          { paddingBottom: Math.max(insets.bottom, 16) + 8, backgroundColor: colors.background },
        ]}
      >
        <Pressable
          onPress={() => handleSave(true)}
          disabled={isSaving}
          style={[styles.publishBtn, { backgroundColor: colors.accent }]}
        >
          <Feather name="send" size={18} color={colors.accentForeground} />
          <Text style={[styles.publishBtnText, { color: colors.accentForeground }]}>
            {existingPlan?.isPublished ? "Update Plan" : "Publish Plan"}
          </Text>
        </Pressable>
      </View>

      {/* Exercise picker modal */}
      {showExercisePicker && (
        <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
          <View style={[styles.pickerModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Add Exercise</Text>
              <Pressable
                onPress={() => {
                  setShowExercisePicker(null);
                  setExerciseFilter("");
                }}
                hitSlop={8}
              >
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="search" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search exercises..."
                placeholderTextColor={colors.mutedForeground}
                value={exerciseFilter}
                onChangeText={setExerciseFilter}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredExercises}
              keyExtractor={(e) => e.id}
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => addExercise(showExercisePicker, item)}
                  style={[styles.exPickerRow, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.exPickerInfo}>
                    <Text style={[styles.exPickerName, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.exPickerMeta, { color: colors.mutedForeground }]}>
                      {item.muscleGroup} · {item.equipment}
                    </Text>
                  </View>
                  <Feather name="plus" size={18} color={colors.primary} />
                </Pressable>
              )}
            />
          </View>
        </View>
      )}

      {/* Exercise config modal */}
      {editingExercise && (
        <ExerciseConfigModal
          dayId={editingExercise.dayId}
          ex={editingExercise.ex}
          colors={colors}
          onSave={(ex) => {
            updateExercise(editingExercise.dayId, ex);
            setEditingExercise(null);
          }}
          onClose={() => setEditingExercise(null)}
        />
      )}
    </View>
  );
}

function DayCard({
  day,
  isExpanded,
  colors,
  onToggle,
  onUpdateDay,
  onRemoveDay,
  onAddExercise,
  onEditExercise,
  onRemoveExercise,
}: {
  day: DraftDay;
  isExpanded: boolean;
  colors: ReturnType<typeof useColors>;
  onToggle: () => void;
  onUpdateDay: (id: string, field: "dayName" | "focus", val: string) => void;
  onRemoveDay: (id: string) => void;
  onAddExercise: () => void;
  onEditExercise: (ex: DraftExercise) => void;
  onRemoveExercise: (exId: string) => void;
}) {
  const [showDayPicker, setShowDayPicker] = useState(false);
  const DAY_OPTS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <View style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={onToggle} style={styles.dayHeader}>
        <View style={styles.dayTitleRow}>
          <View style={[styles.dayDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.dayName, { color: colors.foreground }]}>{day.dayName}</Text>
          {day.focus ? (
            <Text style={[styles.dayFocus, { color: colors.mutedForeground }]}> · {day.focus}</Text>
          ) : null}
        </View>
        <View style={styles.dayHeaderRight}>
          <Text style={[styles.dayExCount, { color: colors.mutedForeground }]}>
            {day.exercises.length} ex
          </Text>
          <Feather
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </View>
      </Pressable>

      {isExpanded && (
        <View style={[styles.dayBody, { borderTopColor: colors.border }]}>
          {/* Day name picker */}
          <View style={styles.dayFieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Day</Text>
            <Pressable
              onPress={() => setShowDayPicker(!showDayPicker)}
              style={[styles.dayPicker, { backgroundColor: colors.input, borderColor: colors.border }]}
            >
              <Text style={[styles.dayPickerText, { color: colors.foreground }]}>{day.dayName}</Text>
              <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {showDayPicker && (
            <View style={[styles.dayOptions, { backgroundColor: colors.input, borderColor: colors.border }]}>
              {DAY_OPTS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => {
                    onUpdateDay(day.id, "dayName", d);
                    setShowDayPicker(false);
                  }}
                  style={[styles.dayOption, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.dayOptionText, { color: d === day.dayName ? colors.primary : colors.foreground }]}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.dayFieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Focus</Text>
            <TextInput
              style={[styles.focusInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Chest & Triceps"
              placeholderTextColor={colors.mutedForeground}
              value={day.focus}
              onChangeText={(v) => onUpdateDay(day.id, "focus", v)}
            />
          </View>

          {/* Exercises */}
          {day.exercises.map((ex) => (
            <View key={ex.id} style={[styles.exRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.exInfo}>
                <Text style={[styles.exName, { color: colors.foreground }]} numberOfLines={1}>
                  {ex.exercise.name}
                </Text>
                <Text style={[styles.exMeta, { color: colors.mutedForeground }]}>
                  {ex.sets}×{ex.reps} · {ex.restSeconds}s rest
                </Text>
              </View>
              <Pressable onPress={() => onEditExercise(ex)} hitSlop={8} style={styles.exBtn}>
                <Feather name="edit-2" size={15} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => onRemoveExercise(ex.id)} hitSlop={8} style={styles.exBtn}>
                <Feather name="trash-2" size={15} color={colors.destructive} />
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={onAddExercise}
            style={[styles.addExBtn, { borderColor: colors.primary + "60", backgroundColor: colors.primary + "15" }]}
          >
            <Feather name="plus" size={15} color={colors.primary} />
            <Text style={[styles.addExText, { color: colors.primary }]}>Add Exercise</Text>
          </Pressable>

          <Pressable
            onPress={() => onRemoveDay(day.id)}
            style={[styles.removeDayBtn, { borderColor: colors.destructive + "40" }]}
          >
            <Feather name="trash-2" size={14} color={colors.destructive} />
            <Text style={[styles.removeDayText, { color: colors.destructive }]}>Remove Day</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ExerciseConfigModal({
  ex,
  dayId,
  colors,
  onSave,
  onClose,
}: {
  ex: DraftExercise;
  dayId: string;
  colors: ReturnType<typeof useColors>;
  onSave: (ex: DraftExercise) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(ex);

  return (
    <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
      <View style={[styles.configModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.configHeader}>
          <Text style={[styles.configTitle, { color: colors.foreground }]} numberOfLines={1}>
            {ex.exercise.name}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.configRow}>
          <ConfigField
            label="Sets"
            value={local.sets}
            onChange={(v) => setLocal((p) => ({ ...p, sets: v }))}
            keyboardType="number-pad"
            colors={colors}
          />
          <ConfigField
            label="Reps"
            value={local.reps}
            onChange={(v) => setLocal((p) => ({ ...p, reps: v }))}
            keyboardType="default"
            colors={colors}
          />
          <ConfigField
            label="Rest (s)"
            value={local.restSeconds}
            onChange={(v) => setLocal((p) => ({ ...p, restSeconds: v }))}
            keyboardType="number-pad"
            colors={colors}
          />
        </View>

        <View style={[styles.notesBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <TextInput
            style={[styles.notesInput, { color: colors.foreground }]}
            placeholder="Notes for student (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={local.notes}
            onChangeText={(v) => setLocal((p) => ({ ...p, notes: v }))}
            multiline
          />
        </View>

        <View style={styles.configActions}>
          <Pressable onPress={onClose} style={[styles.configCancelBtn, { borderColor: colors.border }]}>
            <Text style={[styles.configCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => onSave(local)}
            style={[styles.configSaveBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.configSaveText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ConfigField({
  label,
  value,
  onChange,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType: "number-pad" | "default";
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.configField}>
      <Text style={[styles.configFieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.configFieldInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <TextInput
          style={[styles.configFieldText, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          selectTextOnFocus
          textAlign="center"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800" },
  saveBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  saveBtnText: { fontSize: 13, fontWeight: "600" },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 24 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  inputBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  inputText: { fontSize: 16 },
  studentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  studentChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  studentChipText: { fontSize: 13, fontWeight: "600" },
  dayCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 10 },
  dayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  dayTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayName: { fontSize: 15, fontWeight: "700" },
  dayFocus: { fontSize: 13, flex: 1 },
  dayHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  dayExCount: { fontSize: 12 },
  dayBody: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  dayFieldRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "600", width: 40 },
  dayPicker: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  dayPickerText: { fontSize: 14 },
  dayOptions: { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  dayOption: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  dayOptionText: { fontSize: 14, fontWeight: "500" },
  focusInput: { flex: 1, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  exRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  exInfo: { flex: 1, gap: 2 },
  exName: { fontSize: 14, fontWeight: "600" },
  exMeta: { fontSize: 12 },
  exBtn: { padding: 4 },
  addExBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 10 },
  addExText: { fontSize: 14, fontWeight: "600" },
  removeDayBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 8 },
  removeDayText: { fontSize: 13, fontWeight: "600" },
  addDayBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14, borderStyle: "dashed" },
  addDayText: { fontSize: 15, fontWeight: "600" },
  fab: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 0 },
  publishBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  publishBtnText: { fontSize: 16, fontWeight: "700" },
  modalOverlay: { backgroundColor: "rgba(8,8,17,0.92)", alignItems: "center", justifyContent: "center" },
  pickerModal: { width: "90%", borderRadius: 20, borderWidth: 1, overflow: "hidden", maxHeight: 480 },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  pickerTitle: { fontSize: 18, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  exPickerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  exPickerInfo: { flex: 1, gap: 2 },
  exPickerName: { fontSize: 15, fontWeight: "600" },
  exPickerMeta: { fontSize: 12 },
  configModal: { width: "88%", borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  configHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  configTitle: { fontSize: 17, fontWeight: "700", flex: 1, marginRight: 8 },
  configRow: { flexDirection: "row", gap: 10 },
  configField: { flex: 1, gap: 6 },
  configFieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, textAlign: "center" },
  configFieldInput: { borderRadius: 10, borderWidth: 1, paddingVertical: 12 },
  configFieldText: { fontSize: 18, fontWeight: "700" },
  notesBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, minHeight: 60 },
  notesInput: { fontSize: 14, lineHeight: 20 },
  configActions: { flexDirection: "row", gap: 10 },
  configCancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: "center" },
  configCancelText: { fontSize: 15, fontWeight: "600" },
  configSaveBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  configSaveText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
