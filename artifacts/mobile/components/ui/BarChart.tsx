import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, G } from "react-native-svg";

interface BarData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  barColor: string;
  trackColor: string;
  labelColor: string;
  valueColor: string;
  unit?: string;
}

export function BarChart({
  data,
  height = 120,
  barColor,
  trackColor,
  labelColor,
  valueColor,
  unit = "",
}: BarChartProps) {
  if (!data.length) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barAreaHeight = height - 24;

  return (
    <View style={styles.wrapper}>
      <Svg width="100%" height={height} viewBox={`0 0 ${data.length * 40} ${height}`} preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const barH = Math.max((d.value / maxValue) * barAreaHeight, d.value > 0 ? 4 : 0);
          const x = i * 40 + 8;
          const barWidth = 24;
          const y = barAreaHeight - barH;

          return (
            <G key={i}>
              <Rect
                x={x}
                y={0}
                width={barWidth}
                height={barAreaHeight}
                rx={6}
                fill={trackColor}
              />
              {d.value > 0 && (
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={6}
                  fill={barColor}
                />
              )}
            </G>
          );
        })}
      </Svg>

      <View style={styles.labels}>
        {data.map((d, i) => (
          <View key={i} style={styles.labelItem}>
            <Text style={[styles.labelValue, { color: d.value > 0 ? valueColor : labelColor }]} numberOfLines={1}>
              {d.value > 0 ? `${d.value}${unit}` : "—"}
            </Text>
            <Text style={[styles.labelText, { color: labelColor }]} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  labels: { flexDirection: "row", justifyContent: "space-around" },
  labelItem: { flex: 1, alignItems: "center", gap: 1 },
  labelValue: { fontSize: 10, fontWeight: "700" },
  labelText: { fontSize: 9, fontWeight: "500" },
});
