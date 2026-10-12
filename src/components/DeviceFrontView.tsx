import React, { useState } from "react";
import { Box, Typography, Tooltip, Paper } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { type ButtonKey, type ButtonInfo } from "../hooks/useDeviceSerial";

interface DeviceFrontViewProps {
  activeButtonKey: ButtonKey | null;
  buttons: Record<ButtonKey, ButtonInfo>;
  isWizardActive: boolean;
  liveAdc: number | null;
  bootName: string;
  tolerance: number;
  onButtonClick?: (key: ButtonKey) => void;
}

export default function DeviceFrontView({
  activeButtonKey,
  buttons,
  isWizardActive,
  liveAdc,
  bootName,
  tolerance,
  onButtonClick,
}: DeviceFrontViewProps) {
  const [hoveredButton, setHoveredButton] = useState<ButtonKey | null>(null);

  const getButtonColor = (key: ButtonKey) => {
    if (activeButtonKey === key) return "#00D4FF"; // Active cyan
    if (buttons[key]?.isCalibrated) return "#19F28A"; // Neon green calibrated
    return "#64748B"; // Default slate
  };

  const getButtonFill = (key: ButtonKey) => {
    if (activeButtonKey === key) return "rgba(0, 212, 255, 0.4)";
    if (buttons[key]?.isCalibrated) return "rgba(25, 242, 138, 0.2)";
    return "rgba(100, 116, 139, 0.15)";
  };

  const activeBtnInfo = activeButtonKey ? buttons[activeButtonKey] : null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "#080D12",
        border: "1px solid #22303C",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Header Badge */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
          px: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: isWizardActive ? "#00D4FF" : "#19F28A",
              boxShadow: isWizardActive ? "0 0 10px #00D4FF" : "0 0 10px #19F28A",
              animation: isWizardActive ? "pulse 1.2s infinite" : "none",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: 600,
              color: isWizardActive ? "#00D4FF" : "text.secondary",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontSize: "0.75rem",
            }}
          >
            {isWizardActive ? "Calibration Mode Active" : "Interactive Device Map"}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            color: "#64748B",
            fontSize: "0.7rem",
          }}
        >
          ViewBox: 1024 x 1536
        </Typography>
      </Box>

      {/* Main SVG Container */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          position: "relative",
          userSelect: "none",
          "& svg": {
            display: "block",
            width: "100%",
            height: "auto",
            filter: "drop-shadow(0 12px 30px rgba(0, 0, 0, 0.7))",
          },
        }}
      >
        <svg
          viewBox="0 0 1024 1536"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "auto" }}
        >
          <defs>
            {/* Radar Pulsing Animations */}
            <style>{`
              @keyframes pingWave1 {
                0% { r: 34px; opacity: 0.9; stroke-width: 3.5px; }
                100% { r: 68px; opacity: 0; stroke-width: 1px; }
              }
              @keyframes pingWave2 {
                0% { r: 34px; opacity: 0.6; stroke-width: 2.5px; }
                50% { opacity: 0.8; }
                100% { r: 92px; opacity: 0; stroke-width: 0.5px; }
              }
              @keyframes oledPulse {
                0%, 100% { opacity: 0.95; }
                50% { opacity: 1; }
              }
              .ping-ring-1 {
                animation: pingWave1 1.6s cubic-bezier(0.1, 0.7, 0.2, 1) infinite;
                transform-origin: center;
              }
              .ping-ring-2 {
                animation: pingWave2 1.6s cubic-bezier(0.1, 0.7, 0.2, 1) infinite;
                animation-delay: 0.4s;
                transform-origin: center;
              }
              .btn-hit-target {
                cursor: pointer;
                transition: transform 0.15s ease, filter 0.2s ease;
              }
              .btn-hit-target:hover {
                filter: drop-shadow(0 0 12px #00D4FF);
              }
            `}</style>

            <linearGradient id="oledGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#001824" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#000910" stopOpacity="0.98" />
            </linearGradient>

            <filter id="neonBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Authentic RF Hunter Hardware Graphic Background */}
          <image
            href="./RF-Hunter.svg"
            x="0"
            y="0"
            width="1024"
            height="1536"
            preserveAspectRatio="xMidYMid meet"
          />

          {/* ============================================================== */}
          {/* OLED DISPLAY SIMULATION (Glass Window: x=376, y=904, w=272, h=156) */}
          {/* ============================================================== */}
          <g id="oled-display-overlay">
            {/* Screen Glass Bezel */}
            <rect
              x="376"
              y="904"
              width="272"
              height="156"
              rx="8"
              fill="url(#oledGlow)"
              stroke={isWizardActive ? "#00D4FF" : "#1E3A5F"}
              strokeWidth="2.5"
            />

            {/* OLED Header Bar */}
            <rect
              x="376"
              y="904"
              width="272"
              height="28"
              rx="6"
              fill={isWizardActive ? "rgba(0, 212, 255, 0.2)" : "rgba(30, 58, 95, 0.4)"}
            />
            <line
              x1="376"
              y1="932"
              x2="648"
              y2="932"
              stroke={isWizardActive ? "#00D4FF" : "#1E3A5F"}
              strokeWidth="1.5"
            />

            {/* Title Text */}
            <text
              x="512"
              y="923"
              textAnchor="middle"
              fill={isWizardActive ? "#00D4FF" : "#94A3B8"}
              fontFamily="'IBM Plex Mono', monospace"
              fontSize="13"
              fontWeight="bold"
              letterSpacing="1.5"
            >
              {isWizardActive ? "BUTTON CALIBRATION" : "RF HUNTER // v1.0"}
            </text>

            {/* Body Content */}
            {isWizardActive ? (
              <>
                {/* Active Button Prompt */}
                <text
                  x="512"
                  y="957"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily="'Space Grotesk', sans-serif"
                  fontSize="15"
                  fontWeight="bold"
                >
                  PRESS: {activeBtnInfo?.name.toUpperCase() || "..."}
                </text>

                {/* Live ADC Meter */}
                <rect
                  x="406"
                  y="974"
                  width="212"
                  height="34"
                  rx="6"
                  fill="#001420"
                  stroke="#00D4FF"
                  strokeWidth="1"
                />

                <text
                  x="512"
                  y="996"
                  textAnchor="middle"
                  fill={liveAdc !== null && liveAdc < 980 ? "#19F28A" : "#94A3B8"}
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="15"
                  fontWeight="bold"
                >
                  ADC: {liveAdc !== null ? liveAdc : "1024"} {liveAdc !== null && liveAdc < 980 ? "[PRESSED]" : "[IDLE]"}
                </text>

                {/* Subtext info */}
                <text
                  x="512"
                  y="1025"
                  textAnchor="middle"
                  fill={liveAdc !== null && liveAdc < 980 ? "#19F28A" : "#94A3B8"}
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="11"
                >
                  {liveAdc !== null && liveAdc < 980 ? "RELEASE BUTTON TO ADVANCE" : `TOL: ±${tolerance} | WAITING FOR PRESS`}
                </text>

                <text
                  x="512"
                  y="1046"
                  textAnchor="middle"
                  fill="#00D4FF"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="11"
                  fontWeight="bold"
                >
                  ● SERIAL CONNECTED
                </text>
              </>
            ) : (
              <>
                {/* Boot Splash Display Matching RFHunter.ino Centered Design */}
                <line
                  x1="410"
                  y1="966"
                  x2="445"
                  y2="966"
                  stroke="#00D4FF"
                  strokeWidth="1.5"
                />
                <text
                  x="512"
                  y="972"
                  textAnchor="middle"
                  fill="#00D4FF"
                  fontFamily="'Space Grotesk', sans-serif"
                  fontSize={bootName.length > 10 ? "15" : "18"}
                  fontWeight="bold"
                  letterSpacing="0.8"
                >
                  {bootName}
                </text>
                <line
                  x1="579"
                  y1="966"
                  x2="614"
                  y2="966"
                  stroke="#00D4FF"
                  strokeWidth="1.5"
                />

                <text
                  x="512"
                  y="1005"
                  textAnchor="middle"
                  fill="#19F28A"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="12"
                  fontWeight="600"
                >
                  [ SYSTEM READY ]
                </text>

                <text
                  x="512"
                  y="1028"
                  textAnchor="middle"
                  fill="#64748B"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="10.5"
                >
                  SH1106 128x64 OLED
                </text>

                <text
                  x="512"
                  y="1047"
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="10"
                >
                  RDH ROBOTICS
                </text>
              </>
            )}
          </g>

          {/* ============================================================== */}
          {/* INTERACTIVE BUTTON OVERLAYS (6 ADC Resistor Ladder Buttons)    */}
          {/* ============================================================== */}
          {(Object.keys(buttons) as ButtonKey[]).map((key) => {
            const btn = buttons[key];
            const isActive = activeButtonKey === key;
            const isHovered = hoveredButton === key;
            const color = getButtonColor(key);
            const fill = getButtonFill(key);

            return (
              <g
                key={key}
                id={`btn-${key}`}
                className="btn-hit-target"
                onClick={() => onButtonClick?.(key)}
                onMouseEnter={() => setHoveredButton(key)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                {/* Active Radar Ripple Rings */}
                {isActive && (
                  <>
                    <circle
                      cx={btn.cx}
                      cy={btn.cy}
                      r={btn.radius}
                      fill="none"
                      stroke="#00D4FF"
                      className="ping-ring-1"
                    />
                    <circle
                      cx={btn.cx}
                      cy={btn.cy}
                      r={btn.radius}
                      fill="none"
                      stroke="#00D4FF"
                      className="ping-ring-2"
                    />
                  </>
                )}

                {/* Calibrated or Hover Ring */}
                {(btn.isCalibrated || isHovered) && !isActive && (
                  <circle
                    cx={btn.cx}
                    cy={btn.cy}
                    r={btn.radius + 6}
                    fill="none"
                    stroke={btn.isCalibrated ? "#19F28A" : "#00D4FF"}
                    strokeWidth="2"
                    strokeDasharray={btn.isCalibrated ? "none" : "4 3"}
                    opacity="0.8"
                  />
                )}

                {/* Main Interactive Circle */}
                <circle
                  cx={btn.cx}
                  cy={btn.cy}
                  r={btn.radius}
                  fill={fill}
                  stroke={color}
                  strokeWidth={isActive ? "4" : isHovered ? "3" : "2"}
                  filter={isActive ? "url(#neonBlur)" : "none"}
                />

                {/* Button Icon / Key Label */}
                <text
                  x={btn.cx}
                  y={btn.cy + 5}
                  textAnchor="middle"
                  fill={isActive ? "#FFFFFF" : isHovered ? "#00D4FF" : "#F1F5F9"}
                  fontFamily="'Space Grotesk', sans-serif"
                  fontSize="13"
                  fontWeight="bold"
                  style={{ pointerEvents: "none" }}
                >
                  {key === "up" && "▲"}
                  {key === "down" && "▼"}
                  {key === "left" && "◀"}
                  {key === "right" && "▶"}
                  {key === "enter" && "OK"}
                  {key === "back" && "ESC"}
                </text>

                {/* Floating Tooltip Label when Active or Hovered */}
                {(isActive || isHovered) && (
                  <g style={{ pointerEvents: "none" }}>
                    {/* Badge Container */}
                    <rect
                      x={btn.cx - 60}
                      y={key === "up" ? btn.cy - 68 : btn.cy + 42}
                      width="120"
                      height="30"
                      rx="6"
                      fill="#060A0E"
                      stroke={isActive ? "#00D4FF" : "#19F28A"}
                      strokeWidth="1.5"
                      filter="drop-shadow(0 4px 10px rgba(0,0,0,0.8))"
                    />
                    <text
                      x={btn.cx}
                      y={key === "up" ? btn.cy - 48 : btn.cy + 62}
                      textAnchor="middle"
                      fill={isActive ? "#00D4FF" : "#19F28A"}
                      fontFamily="'IBM Plex Mono', monospace"
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {btn.name.toUpperCase()}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </Box>

      {/* Button Legend & Quick Stats */}
      <Box
        sx={{
          mt: 2,
          width: "100%",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          pt: 1.5,
          borderTop: "1px solid #1E293B",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "2px solid #00D4FF",
              bgcolor: "rgba(0, 212, 255, 0.4)",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              color: "text.secondary",
              fontSize: "0.72rem",
            }}
          >
            Active Target
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <CheckCircleIcon sx={{ fontSize: 13, color: "#19F28A" }} />
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              color: "text.secondary",
              fontSize: "0.72rem",
            }}
          >
            Calibrated (EEPROM)
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "1.5px solid #64748B",
              bgcolor: "transparent",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              color: "text.secondary",
              fontSize: "0.72rem",
            }}
          >
            Click button to test
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

