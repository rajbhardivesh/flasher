import {
  AppBar,
  Box,
  Button,
  IconButton,
  Link,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import TuneIcon from "@mui/icons-material/Tune";

export type NavTab = "flasher" | "calibrate";

interface HeaderProps {
  mode: "light" | "dark";
  onToggleMode: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function Header({
  mode,
  onToggleMode,
  activeTab,
  onTabChange,
}: HeaderProps) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        backdropFilter: "blur(12px)",
        bgcolor: "rgba(5, 7, 10, 0.85)",
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: { xs: 64, md: 70 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Link
            href="https://rdhrobotics.in"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              transition: "opacity 0.2s ease",
              "&:hover": { opacity: 0.85 },
            }}
          >
            <Box
              component="img"
              src="./logo_title_white.svg"
              alt="RDH Robotics"
              sx={{
                height: { xs: 26, sm: 30 },
                width: "auto",
                display: "block",
              }}
            />
          </Link>

          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              width: "1px",
              height: 20,
              bgcolor: "divider",
            }}
          />

          {/* Navigation Section Tabs */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              startIcon={<FlashOnIcon sx={{ fontSize: 16 }} />}
              onClick={() => onTabChange("flasher")}
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                fontSize: "0.82rem",
                px: 1.5,
                py: 0.6,
                borderRadius: 1.5,
                color: activeTab === "flasher" ? "#00D4FF" : "text.secondary",
                bgcolor: activeTab === "flasher" ? "rgba(0, 212, 255, 0.1)" : "transparent",
                border: "1px solid",
                borderColor: activeTab === "flasher" ? "rgba(0, 212, 255, 0.4)" : "transparent",
                "&:hover": {
                  bgcolor: "rgba(0, 212, 255, 0.15)",
                  borderColor: "#00D4FF",
                  color: "#00D4FF",
                },
              }}
            >
              Flasher
            </Button>

            <Button
              size="small"
              startIcon={<TuneIcon sx={{ fontSize: 16 }} />}
              onClick={() => onTabChange("calibrate")}
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                fontSize: "0.82rem",
                px: 1.5,
                py: 0.6,
                borderRadius: 1.5,
                color: activeTab === "calibrate" ? "#00D4FF" : "text.secondary",
                bgcolor: activeTab === "calibrate" ? "rgba(0, 212, 255, 0.1)" : "transparent",
                border: "1px solid",
                borderColor: activeTab === "calibrate" ? "rgba(0, 212, 255, 0.4)" : "transparent",
                "&:hover": {
                  bgcolor: "rgba(0, 212, 255, 0.15)",
                  borderColor: "#00D4FF",
                  color: "#00D4FF",
                },
              }}
            >
              Calibration & Tools
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={{ xs: 1.5, sm: 2.5 }} alignItems="center">
          {/* Status Indicator Pill */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
              px: 1.75,
              py: 0.5,
              borderRadius: "9999px",
              border: "1px solid rgba(25, 242, 138, 0.25)",
              bgcolor: "rgba(25, 242, 138, 0.05)",
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "#19F28A",
                boxShadow: "0 0 10px #19F28A",
              }}
            />
            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.6875rem",
                letterSpacing: "0.08em",
                fontWeight: 600,
                color: "#19F28A",
                textTransform: "uppercase",
              }}
            >
              Systems Online
            </Typography>
          </Box>

          <Link
            href="https://rdhrobotics.in/products/rf-hunter"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: "0.75rem",
              textDecoration: "none",
              transition: "color 0.2s ease",
              "&:hover": { color: "primary.main" },
            }}
          >
            RF Hunter
            <OpenInNewIcon sx={{ fontSize: 13 }} />
          </Link>

          <Link
            href="https://docs.rdhrobotics.in"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: "0.75rem",
              textDecoration: "none",
              transition: "color 0.2s ease",
              "&:hover": { color: "primary.main" },
            }}
          >
            Docs
            <OpenInNewIcon sx={{ fontSize: 13 }} />
          </Link>

          <Tooltip title={mode === "dark" ? "Light theme" : "Hacker dark theme"}>
            <IconButton
              onClick={onToggleMode}
              color="inherit"
              size="small"
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                p: 0.75,
                color: "text.secondary",
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
            >
              {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
