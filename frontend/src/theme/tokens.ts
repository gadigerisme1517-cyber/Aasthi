// The design scale. ONE file, four groups, nothing else.
//
// src/theme.ts is the older palette and is still imported by most screens.
// This is not a second parallel system: tokens is the scale the rebuilt
// surfaces read from, and a screen is expected to move onto it wholesale when
// it is touched, not to mix the two. Where both are imported in one file
// during a partial refactor, that file is named in the report.
//
// WEIGHTS. Inter ships six static weights: 400 500 600 700 800 900. 550 and
// 650 are not among them and silently resolve to 600, so they are never used
// here. 800 is banned by design — it reads as a heavier 700 with no purpose.

export const radius = {
  sm: 5,
  md: 11,
  lg: 16,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 11,
  lg: 14,
  xl: 16,
} as const;

export const colour = {
  ink: "#14110E",
  ink2: "#5E5750",
  ink3: "#938C84",
  line: "#E6E2DC",
  paper: "#FFFFFF",
  shell: "#F4F2EF",
  green: "#12A05E",
  accent: "#B4472A",
  // For anything sitting on a photo.
  scrim: "rgba(12,10,8,0.62)",
} as const;

// 400 body · 500 labels · 600 titles and section heads · 700 price only.
export const weight = {
  body: 400,
  label: 500,
  title: 600,
  price: 700,
} as const;
