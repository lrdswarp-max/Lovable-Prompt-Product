import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);

  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await login("student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#1A0A3E", "#080811"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Hero image area */}
      <View style={[styles.hero, { height: height * 0.42 }]}>
        <Image
          source={require("@/assets/images/workout-hero.png")}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", colors.background]}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.heroOverlay, { paddingTop: insets.top + 16 }]}>
          <View style={styles.logoRow}>
            <View style={[styles.logoBolt, { backgroundColor: colors.accent }]} />
            <Text style={styles.logoText}>TrainFlow</Text>
          </View>
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.headingBlock}>
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Welcome back.
          </Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
            Sign in to track your workouts and connect with your trainer.
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleLogin}
            disabled={loading}
            style={[
              styles.ctaButton,
              {
                backgroundColor: colors.accent,
                opacity: loading ? 0.8 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.accentForeground} />
            ) : (
              <Text style={[styles.ctaText, { color: colors.accentForeground }]}>
                Log In
              </Text>
            )}
          </Pressable>
        </Animated.View>

        <View style={[styles.trainerRow, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable onPress={() => router.push("/trainer-login")}>
            <Text style={[styles.trainerLink, { color: colors.mutedForeground }]}>
              I'm a personal trainer
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 28,
    justifyContent: "flex-start",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBolt: {
    width: 10,
    height: 24,
    borderRadius: 2,
    transform: [{ skewX: "-10deg" }],
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  form: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    gap: 20,
  },
  headingBlock: {
    gap: 8,
  },
  heading: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  trainerRow: {
    alignItems: "center",
    marginTop: 8,
  },
  trainerLink: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
