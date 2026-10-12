import { createTheme, type ThemeOptions } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

// RDH Robotics hacker theme palette matching rdhrobotics.in
const cyanAccent = "#00D4FF";
const cyanDark = "#0284C7";
const neonGreen = "#19F28A";
const warningAmber = "#FFC857";
const dangerPink = "#FF3B5C";

const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: [
      '"Space Grotesk"',
      '"Inter"',
      '"Segoe UI"',
      "system-ui",
      "-apple-system",
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 700, letterSpacing: "-0.04em" },
    h2: { fontWeight: 700, letterSpacing: "-0.03em" },
    h3: { fontWeight: 600, letterSpacing: "-0.02em" },
    h4: { fontWeight: 600, letterSpacing: "-0.02em" },
    h5: { fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle2: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500 },
    body1: { letterSpacing: "-0.01em" },
    body2: { letterSpacing: "-0.01em" },
    caption: { fontFamily: '"IBM Plex Mono", monospace' },
    button: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingTop: 9,
          paddingBottom: 9,
          fontWeight: 600,
          transition: "all 0.2s ease-in-out",
        },
        containedPrimary: {
          backgroundColor: cyanAccent,
          color: "#031217",
          "&:hover": {
            backgroundColor: "#38BDF8",
            boxShadow: "0 0 24px rgba(0, 212, 255, 0.4)",
          },
        },
        outlinedPrimary: {
          borderColor: "rgba(0, 212, 255, 0.4)",
          color: cyanAccent,
          "&:hover": {
            borderColor: cyanAccent,
            backgroundColor: "rgba(0, 212, 255, 0.08)",
            boxShadow: "0 0 16px rgba(0, 212, 255, 0.2)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"IBM Plex Mono", monospace',
          borderRadius: 6,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
};

export function getAppTheme(mode: PaletteMode) {
  return createTheme({
    ...baseTheme,
    palette: {
      mode,
      primary: {
        main: cyanAccent,
        dark: cyanDark,
        contrastText: "#031217",
      },
      secondary: {
        main: neonGreen,
        contrastText: "#04140D",
      },
      ...(mode === "dark"
        ? {
            background: {
              default: "#05070A",
              paper: "#080D12",
            },
            text: {
              primary: "#F1F5F9",
              secondary: "#94A3B8",
            },
            divider: "#22303C",
          }
        : {
            background: {
              default: "#0B1220",
              paper: "#121A2B",
            },
            text: {
              primary: "#F8FAFC",
              secondary: "#94A3B8",
            },
            divider: "rgba(255, 255, 255, 0.1)",
          }),
      success: { main: neonGreen },
      warning: { main: warningAmber },
      error: { main: dangerPink },
      info: { main: cyanAccent },
    },
  });
}
