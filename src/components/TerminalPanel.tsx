import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import type { LogEntry } from "../hooks/useFirmwareFlasher";

interface TerminalPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

const levelColors: Record<LogEntry["level"], string> = {
  info: "#94A3B8",
  success: "#19F28A",
  error: "#FF3B5C",
  warn: "#FFC857",
};

export default function TerminalPanel({ logs, onClear }: TerminalPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (autoScroll && !isAtBottom) {
      setAutoScroll(false);
    }
  };

  const handleCopyLogs = async () => {
    if (logs.length === 0) return;
    const text = logs.map((l) => l.text).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: { xs: 400, md: 540 },
        bgcolor: "#060B10",
        borderColor: "#22303C",
        borderRadius: 3,
        boxShadow: "inset 0 0 50px rgba(0, 212, 255, 0.03)",
        overflow: "hidden",
      }}
    >
      {/* Hacker Terminal Header - styled like rdhrobotics.in */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: "1px solid #1B2631",
          bgcolor: "rgba(8, 13, 18, 0.95)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* 3 Status indicator dots */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#FF3B5C" }} />
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#FFC857" }} />
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#19F28A" }} />
          </Stack>

          <Typography
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: "0.75rem",
              color: "#94A3B8",
              letterSpacing: "0.04em",
            }}
          >
            rdh@core:~ $ serial-monitor
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title={copied ? "Copied to clipboard!" : "Copy console log"}>
            <IconButton
              size="small"
              onClick={handleCopyLogs}
              disabled={logs.length === 0}
              sx={{
                color: copied ? "#19F28A" : "#64748B",
                "&:hover": { color: "primary.main" },
              }}
            >
              {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}>
            <IconButton
              size="small"
              onClick={() => setAutoScroll((v) => !v)}
              sx={{
                color: autoScroll ? "primary.main" : "#64748B",
                bgcolor: autoScroll ? "rgba(0, 212, 255, 0.08)" : "transparent",
                "&:hover": { color: "primary.main" },
              }}
            >
              <VerticalAlignBottomIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clear console">
            <IconButton
              size="small"
              onClick={onClear}
              sx={{
                color: "#64748B",
                "&:hover": { color: "#FF3B5C" },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Terminal Output Area */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2.5,
          py: 2,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: "0.8125rem",
          lineHeight: 1.7,
          color: "#CBD5E1",
          bgcolor: "#060B10",
        }}
      >
        {logs.length === 0 ? (
          <Box sx={{ py: 2, color: "#64748B" }}>
            <Typography sx={{ fontFamily: "inherit", fontSize: "inherit", color: "#38BDF8", mb: 1 }}>
              &gt; RDH Robotics Secure Flasher Terminal v1.0
            </Typography>
            <Typography sx={{ fontFamily: "inherit", fontSize: "inherit", color: "#94A3B8", mb: 0.5 }}>
              [<span style={{ color: "#19F28A" }}>READY</span>] Web Serial interface waiting for connection
            </Typography>
            <Typography sx={{ fontFamily: "inherit", fontSize: "inherit", color: "#94A3B8", mb: 0.5 }}>
              [<span style={{ color: "#19F28A" }}>READY</span>] Local binary /firmware/RF-HUNTER-4M2M.bin mapped
            </Typography>
            <Typography sx={{ fontFamily: "inherit", fontSize: "inherit", color: "#64748B" }}>
              Connect device and press Flash Firmware to start transmission
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: "7px",
                  height: "14px",
                  bgcolor: "primary.main",
                  verticalAlign: "middle",
                  ml: 1,
                  animation: "blink 1s step-start infinite",
                  "@keyframes blink": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0 },
                  },
                }}
              />
            </Typography>
          </Box>
        ) : (
          <>
            {logs.map((log) => {
              const color = levelColors[log.level] || "#CBD5E1";
              const isOk = log.level === "success" || log.text.includes("Complete") || log.text.includes("Connected");
              return (
                <Box
                  key={log.id}
                  sx={{
                    color,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    mb: 0.25,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      color: isOk ? "#19F28A" : log.level === "error" ? "#FF3B5C" : "primary.main",
                      userSelect: "none",
                      flexShrink: 0,
                    }}
                  >
                    &gt;
                  </Typography>
                  <Box component="span" sx={{ flex: 1, color }}>
                    {log.text}
                  </Box>
                </Box>
              );
            })}
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: "7px",
                height: "14px",
                bgcolor: "primary.main",
                verticalAlign: "middle",
                mt: 0.5,
                animation: "blink 1s step-start infinite",
                "@keyframes blink": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0 },
                },
              }}
            />
          </>
        )}
      </Box>
    </Paper>
  );
}
