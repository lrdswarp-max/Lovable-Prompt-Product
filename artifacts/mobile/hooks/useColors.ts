import colors from "@/constants/colors";

export function useColors() {
  const palette = colors.dark;
  return { ...palette, radius: colors.radius };
}
