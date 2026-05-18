import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useColors } from "@/hooks/useColors";

export default function TrainerLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { loginAsTrainer } = useAuth();

  const [email, setEmail] = useState("jordan@trainflow.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    await loginAsTrainer(email, password);
    setLoading(false);
    router.replace("/trainer");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text style={[styles.backText, { color: colors.mutedForeground }]}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Trainer Login</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Access your coaching dashboard
          </Text>
        </View>

        <View style={styles.fields}>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <View
              style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}
            >
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="trainer@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
            <View
              style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}
            >
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Enter password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.8 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Use any password to demo the trainer experience.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 28 },
  backBtn: { marginBottom: 32 },
  backText: { fontSize: 15 },
  header: { gap: 6, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 15 },
  fields: { gap: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrapper: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 15 },
  input: { fontSize: 16 },
  errorText: { fontSize: 14 },
  button: { borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  hint: { fontSize: 12, textAlign: "center", marginTop: 4 },
});
