import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import MemoryIcon from "@mui/icons-material/Memory";
import SpeedIcon from "@mui/icons-material/Speed";
import type { FlasherStatus } from "../hooks/useFirmwareFlasher";

interface StatusPanelProps {
  status: FlasherStatus;
  chipType: string | null;
  progress: number;
  speed: string;
}

const statusConfig: Record<
  FlasherStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  idle: {
    label: "IDLE",
    color: "#94A3B8",
    bg: "rgba(148, 163, 184, 0.08)",
    dot: "#64748B",
  },
  connecting: {
    label: "CONNECTING...",
    color: "#FFC857",
    bg: "rgba(255, 200, 87, 0.1)",
    dot: "#FFC857",
  },
  connected: {
    label: "ONLINE // READY",
    color: "#19F28A",
    bg: "rgba(25, 242, 138, 0.1)",
    dot: "#19F28A",
  },
  flashing: {
    label: "WRITING FLASH...",
    color: "#00D4FF",
    bg: "rgba(0, 212, 255, 0.12)",
    dot: "#00D4FF",
  },
  done: {
    label: "FLASH COMPLETE",
    color: "#19F28A",
    bg: "rgba(25, 242, 138, 0.15)",
    dot: "#19F28A",
  },
  error: {
    label: "BUS ERROR",
    color: "#FF3B5C",
    bg: "rgba(255, 59, 92, 0.1)",
    dot: "#FF3B5C",
  },
  disconnected: {
    label: "DISCONNECTED",
    color: "#94A3B8",
    bg: "rgba(148, 163, 184, 0.08)",
    dot: "#64748B",
  },
};

export default function StatusPanel({ status, chipType, progress, speed }: StatusPanelProps) {
  const config = statusConfig[status];

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: "#080D12",
        borderColor: "#22303C",
        borderRadius: 3,
        boxShadow: "inset 0 0 35px rgba(0, 212, 255, 0.02)",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: "0.6875rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "primary.main",
            fontWeight: 600,
            display: "block",
            mb: 2,
          }}
        >
          03 // Telemetry &amp; Status
        </Typography>

        <Stack spacing={1.75}>
          {/* Status Row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.75rem" }}
            >
              STATE:
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.25,
                py: 0.35,
                borderRadius: 1,
                bgcolor: config.bg,
                border: `1px solid ${config.color}33`,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: config.dot,
                  boxShadow: `0 0 8px ${config.dot}`,
                }}
              />
              <Typography
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: config.color,
                  letterSpacing: "0.04em",
                }}
              >
                {config.label}
              </Typography>
            </Box>
          </Stack>

          {/* Chip Type Row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <MemoryIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.75rem" }}
              >
                CHIP TYPE:
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.8rem",
                fontWeight: 600,
                color: chipType ? "primary.main" : "text.secondary",
              }}
            >
              {chipType ? chipType.toUpperCase() : "NOT DETECTED"}
            </Typography>
          </Stack>

          {/* Speed Row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <SpeedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.75rem" }}
              >
                WRITE SPEED:
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.8rem",
                fontWeight: 600,
                color: speed !== "--" ? "#19F28A" : "text.secondary",
              }}
            >
              {speed}
            </Typography>
          </Stack>

          {/* Progress Bar */}
          <Box sx={{ pt: 0.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: "0.75rem",
                  letterSpacing: "0.04em",
                }}
              >
                PROGRESS:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: progress > 0 ? "primary.main" : "text.secondary",
                }}
              >
                {progress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "#030609",
                border: "1px solid #1E293B",
                "& .MuiLinearProgress-bar": {
                  background: "linear-gradient(90deg, #00D4FF 0%, #19F28A 100%)",
                  borderRadius: 3,
                  boxShadow: progress > 0 ? "0 0 12px rgba(0, 212, 255, 0.6)" : "none",
                },
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
