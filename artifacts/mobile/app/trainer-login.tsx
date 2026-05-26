import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !pin.trim()) {
      setError("Please enter your email and PIN.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await loginAsTrainer(email, pin);
      router.replace("/trainer");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.mutedForeground }]}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Trainer Login
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Sign in to access your coaching dashboard.
          </Text>
        </View>

        <View style={styles.fields}>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
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
            <Text style={[styles.label, { color: colors.mutedForeground }]}>PIN</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Enter PIN (demo: 1234)"
                placeholderTextColor={colors.mutedForeground}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
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
          </Animated.View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Demo PIN: 1234
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 28 },
  backBtn: { marginBottom: 40 },
  backText: { fontSize: 15 },
  header: { gap: 8, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  fields: { gap: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputWrapper: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 16 },
  input: { fontSize: 16 },
  errorText: { fontSize: 13, textAlign: "center" },
  button: { borderRadius: 14, paddingVertical: 18, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  hint: { fontSize: 13, textAlign: "center" },
});
