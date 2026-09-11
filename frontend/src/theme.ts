// AASTHI theme — values pulled directly from the mockup's :root CSS variables
// and per-component rules. Do not eyeball/approximate.

export const colors = {
  bg: "#ffffff",
  screen: "#ffffff",
  soft: "#f5f5f3",
  soft2: "#eeeeea",
  warm: "#f7f4ef", // editorial band background
  ink: "#101010",
  muted: "#737373",
  faint: "#a1a1a1",
  line: "rgba(16,16,16,0.09)",
  black: "#111111",
  ink2: "#0d0d0d",
  red: "#b41218",
  gold: "#b58a51",
  green: "#087448",
  white: "#ffffff",
  fieldBg: "#f6f6f4",
  glass: "rgba(255,255,255,0.82)",
  darkBg: "#060606",
};

// Inter weights available: 400,500,600,700,800,900
export const font = {
  regular: "Inter-400",
  medium: "Inter-500",
  semibold: "Inter-600",
  bold: "Inter-700",
  extrabold: "Inter-800",
  black: "Inter-900",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  pill: 999,
  field: 16,
  result: 20,
  // Was 22, and 26 on the browse card. One card radius now: tokens.radius.lg.
  card: 16,
  feature: 24,
  block: 20,
  sheet: 22,
  facts: 16,
  chip: 999,
};

export const shadow = {
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.045,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  strong: {
    shadowColor: "#000",
    shadowOpacity: 0.075,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
};

export const NAV_HEIGHT = 78;
