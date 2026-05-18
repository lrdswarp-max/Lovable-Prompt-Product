import React from "react";
import { Platform } from "react-native";

let Svg: React.ComponentType<{ width: number; height: number; style?: object }>;
let Circle: React.ComponentType<{
  cx: number;
  cy: number;
  r: number;
  strokeWidth: number;
  stroke: string;
  fill: string;
  strokeDasharray?: number;
  strokeDashoffset?: number;
  strokeLinecap?: "round" | "butt" | "square";
}>;

if (Platform.OS !== "web") {
  const svg = require("react-native-svg");
  Svg = svg.Svg;
  Circle = svg.Circle;
} else {
  const svg = require("react-native-svg");
  Svg = svg.Svg;
  Circle = svg.Circle;
}

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}

export function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  trackColor,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <Svg
      width={size}
      height={size}
      style={{ transform: [{ rotate: "-90deg" }] } as object}
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        stroke={trackColor}
        fill="transparent"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        stroke={color}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}
