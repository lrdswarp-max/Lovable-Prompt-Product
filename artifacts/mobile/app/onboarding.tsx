import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
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

import { useColors } from "@/hooks/useColors";

const STEPS = [
  { key: "name", label: "What's your name?", placeholder: "Full name", hint: "Your trainer will use this to personalize your plan." },
  { key: "goal", label: "What's your main goal?", placeholder: "e.g. Build muscle, lose fat, improve endurance...", hint: "This helps us tailor your experience." },
  { key: "weight", label: "What's your current weight?", placeholder: "Weight in kg", hint: "Used to track your progress over time.", keyboardType: "decimal-pad" as const },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ name: "", goal: "", weight: "" });

  const current = STEPS[step];
  const value = values[current.key as keyof typeof values];

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      router.replace("/(tabs)");
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={["#0D0A28", colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 40, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i <= step ? colors.accent : colors.muted,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
          Step {step + 1} of {STEPS.length}
        </Text>
        <Text style={[styles.question, { color: colors.foreground }]}>
          {current.label}
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          {current.hint}
        </Text>

        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.input, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder={current.placeholder}
            placeholderTextColor={colors.mutedForeground}
            value={value}
            onChangeText={(t) => setValues((v) => ({ ...v, [current.key]: t }))}
            keyboardType={current.keyboardType ?? "default"}
            autoFocus
            returnKeyType={step < STEPS.length - 1 ? "next" : "done"}
            onSubmitEditing={handleNext}
          />
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.nextBtnText, { color: colors.accentForeground }]}>
            {step < STEPS.length - 1 ? "Continue" : "Let's Go"}
          </Text>
          <Feather name={step < STEPS.length - 1 ? "arrow-right" : "check"} size={18} color={colors.accentForeground} />
        </Pressable>

        {step > 0 && (
          <Pressable onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.mutedForeground }]}>← Back</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 28, gap: 16 },
  dotsRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  dot: { height: 8, borderRadius: 4 },
  stepLabel: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  question: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, lineHeight: 36 },
  hint: { fontSize: 14, lineHeight: 20 },
  inputWrapper: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 18, marginTop: 8 },
  input: { fontSize: 18 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 18, marginTop: 8 },
  nextBtnText: { fontSize: 16, fontWeight: "700" },
  backBtn: { alignItems: "center", paddingVertical: 8 },
  backText: { fontSize: 14 },
});
