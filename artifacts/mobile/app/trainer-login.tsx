import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function TrainerLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isAuthReady } = useAuth();

  const [loading, setLoading] = useState(false);

  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login("trainer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.mutedForeground }]}>
            ← Back
          </Text>
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
          <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleLogin}
              disabled={loading || !isAuthReady}
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: loading || !isAuthReady ? 0.6 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In as Trainer</Text>
              )}
            </Pressable>
          </Animated.View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            You'll be redirected to sign in securely.
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
  button: { borderRadius: 14, paddingVertical: 18, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  hint: { fontSize: 13, textAlign: "center" },
});
