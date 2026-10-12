import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from "@mui/material";
import UsbIcon from "@mui/icons-material/Usb";
import UsbOffIcon from "@mui/icons-material/UsbOff";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TerminalIcon from "@mui/icons-material/Terminal";
import TuneIcon from "@mui/icons-material/Tune";
import BadgeIcon from "@mui/icons-material/Badge";
import SensorsIcon from "@mui/icons-material/Sensors";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";

import DeviceFrontView from "./DeviceFrontView";
import {
  useDeviceSerial,
  CALIBRATION_STEPS,
  type ButtonKey,
} from "../hooks/useDeviceSerial";

export default function CalibrationSection() {
  const {
    isConnected,
    isConnecting,
    baudRate,
    setBaudRate,
    logs,
    clearLogs,
    buttons,
    setButtonName,
    setButtonAdc,
    tolerance,
    setTolerance,
    bootName,
    setBootName,
    saveBootName,
    liveAdc,
    readLiveAdc,
    connect,
    disconnect,
    sendRaw,
    saveCalibrationToDevice,
    resetToDefaults,
    calibrateSingleButton,
    isWizardActive,
    activeStepIndex,
    activeButtonKey,
    wizardPrompt,
    wizardSubPrompt,
    wizardError,
    wizardPhase,
    startWizard,
    advanceWizardStep,
    cancelWizard,
  } = useDeviceSerial();

  // Local UI states
  const [editingNameKey, setEditingNameKey] = useState<ButtonKey | null>(null);
  const [tempButtonName, setTempButtonName] = useState("");
  const [customCommand, setCustomCommand] = useState("");
  const [editingBootName, setEditingBootName] = useState(bootName);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; severity: "success" | "info" | "warning" | "error" } | null>(null);
  const [autoScroll, setAutoScroll] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEditingBootName(bootName);
  }, [bootName]);

  useEffect(() => {
    if (autoScroll) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const handleStartEditName = (key: ButtonKey) => {
    setEditingNameKey(key);
    setTempButtonName(buttons[key].name);
  };

  const handleSaveEditName = (key: ButtonKey) => {
    if (tempButtonName.trim()) {
      setButtonName(key, tempButtonName.trim());
    }
    setEditingNameKey(null);
  };

  const handleSaveBootNameClick = async () => {
    if (!editingBootName.trim()) return;
    const ok = await saveBootName(editingBootName.trim());
    if (ok) {
      setFeedbackMsg({ text: `Boot name "${editingBootName.trim()}" saved to EEPROM!`, severity: "success" });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleSaveCalibrationClick = async () => {
    const ok = await saveCalibrationToDevice();
    if (ok) {
      setFeedbackMsg({ text: "All button thresholds and tolerance permanently saved to EEPROM!", severity: "success" });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleResetDefaultsClick = async () => {
    const ok = await resetToDefaults();
    if (ok) {
      setFeedbackMsg({ text: "Factory button thresholds restored (UP:188, DOWN:240, LEFT:96, RIGHT:331, ENTER:426, BACK:375, TOL:15).", severity: "info" });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleSendCustomCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim()) return;
    await sendRaw(customCommand.trim());
    setCustomCommand("");
  };

  // Check for any potential overlap in tolerance ranges
  const checkOverlap = () => {
    const sorted = Object.values(buttons)
      .map((b) => ({
        key: b.key,
        name: b.name,
        min: b.calibratedAdc - tolerance,
        max: b.calibratedAdc + tolerance,
      }))
      .sort((a, b) => a.min - b.min);

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].max >= sorted[i + 1].min) {
        return `Warning: ${sorted[i].name} (${sorted[i].min}-${sorted[i].max}) overlaps with ${sorted[i + 1].name} (${sorted[i + 1].min}-${sorted[i + 1].max}). Lower tolerance slider.`;
      }
    }
    return null;
  };

  const overlapWarning = checkOverlap();

  return (
    <Box sx={{ width: "100%" }}>
      {/* Feedback Banner */}
      {feedbackMsg && (
        <Alert
          severity={feedbackMsg.severity}
          sx={{
            mb: 3,
            bgcolor: "#080D12",
            border: `1px solid ${
              feedbackMsg.severity === "success"
                ? "#19F28A"
                : feedbackMsg.severity === "error"
                ? "#FF3B5C"
                : "#00D4FF"
            }`,
            color: "text.primary",
            fontFamily: '"IBM Plex Mono", monospace',
          }}
          onClose={() => setFeedbackMsg(null)}
        >
          {feedbackMsg.text}
        </Alert>
      )}

      {/* Top Controls & Connection Bar */}
      <Card
        sx={{
          mb: 3.5,
          bgcolor: "#080D12",
          border: "1px solid #22303C",
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            {/* Connection Status & Baud Rate */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  bgcolor: isConnected ? "rgba(25, 242, 138, 0.08)" : "rgba(100, 116, 139, 0.1)",
                  border: `1px solid ${isConnected ? "rgba(25, 242, 138, 0.3)" : "#22303C"}`,
                }}
              >
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    bgcolor: isConnected ? "#19F28A" : "#64748B",
                    boxShadow: isConnected ? "0 0 10px #19F28A" : "none",
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: isConnected ? "#19F28A" : "#94A3B8",
                  }}
                >
                  {isConnected ? "SERIAL ONLINE" : "DISCONNECTED"}
                </Typography>
              </Box>

              {/* Baud Rate selector */}
              <TextField
                select
                size="small"
                label="Baud Rate"
                value={baudRate}
                onChange={(e) => setBaudRate(Number(e.target.value))}
                disabled={isConnected}
                SelectProps={{ native: true }}
                sx={{
                  minWidth: 120,
                  "& .MuiInputBase-input": {
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: "0.82rem",
                  },
                }}
              >
                <option value={115200}>115200 (Default)</option>
                <option value={9600}>9600</option>
                <option value={57600}>57600</option>
              </TextField>

              {/* Live ADC Display */}
              {isConnected && (
                <Chip
                  icon={<SensorsIcon sx={{ fontSize: 16 }} />}
                  label={`Live ADC: ${liveAdc !== null ? liveAdc : "---"}`}
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    bgcolor: "rgba(0, 212, 255, 0.1)",
                    color: "#00D4FF",
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                    fontWeight: 600,
                  }}
                  onClick={() => readLiveAdc()}
                />
              )}
            </Stack>

            {/* Action Connect / Disconnect Buttons */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {!isConnected ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<UsbIcon />}
                  onClick={() => connect()}
                  disabled={isConnecting}
                  sx={{
                    px: 3,
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 700,
                  }}
                >
                  {isConnecting ? "Connecting..." : "Connect RF Hunter"}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<UsbOffIcon />}
                  onClick={() => disconnect()}
                  sx={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 600,
                  }}
                >
                  Disconnect Port
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Main Grid: Left = Hardware Graphic, Right = Calibration Suite */}
      <Grid container spacing={3}>
        {/* Left Column: Device Front View Graphic */}
        <Grid item xs={12} lg={4.8}>
          <DeviceFrontView
            activeButtonKey={activeButtonKey}
            buttons={buttons}
            isWizardActive={isWizardActive}
            liveAdc={liveAdc}
            bootName={bootName}
            tolerance={tolerance}
            onButtonClick={(key) => {
              if (isConnected) {
                calibrateSingleButton(key);
              }
            }}
          />

          {/* Quick Hardware Guide card */}
          <Card
            sx={{
              mt: 2.5,
              bgcolor: "#080D12",
              border: "1px solid #22303C",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#00D4FF",
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: "0.78rem",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <TuneIcon sx={{ fontSize: 16 }} />
                ADC Resistor Ladder Architecture
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontSize: "0.8rem", lineHeight: 1.5 }}
              >
                All 6 buttons share analog input pin <strong>A0</strong> using distinct voltage divider resistor
                steps. Tolerance window allows exact recognition even under varying USB power levels.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Calibration Controls & Configuration */}
        <Grid item xs={12} lg={7.2}>
          <Stack spacing={3}>
            {/* Card 1: Step-by-Step Calibration Wizard */}
            <Card
              sx={{
                bgcolor: "#080D12",
                border: isWizardActive ? "2px solid #00D4FF" : "1px solid #22303C",
                borderRadius: 3,
                boxShadow: isWizardActive ? "0 0 25px rgba(0, 212, 255, 0.2)" : "none",
                transition: "all 0.3s ease",
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: '"Space Grotesk", sans-serif',
                        fontWeight: 700,
                        color: "text.primary",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                      }}
                    >
                      <TuneIcon sx={{ color: "#00D4FF" }} />
                      ADC Button Calibration Wizard
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.82rem", mt: 0.5 }}>
                      Guides you step-by-step through calibrating UP, DOWN, LEFT, RIGHT, ENTER, and BACK buttons.
                    </Typography>
                  </Box>

                  {!isWizardActive ? (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      onClick={startWizard}
                      disabled={!isConnected}
                      sx={{
                        fontFamily: '"Space Grotesk", sans-serif',
                        fontWeight: 700,
                        px: 2.5,
                      }}
                    >
                      Start Calibration
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CloseIcon />}
                      onClick={cancelWizard}
                      size="small"
                    >
                      Cancel
                    </Button>
                  )}
                </Stack>

                {/* Wizard Active Banner */}
                {isWizardActive && (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      bgcolor: "rgba(0, 212, 255, 0.08)",
                      border: "1px solid rgba(0, 212, 255, 0.4)",
                      mb: 2.5,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Chip
                        label={`STEP ${activeStepIndex + 1} OF 6`}
                        size="small"
                        sx={{
                          bgcolor: "#00D4FF",
                          color: "#031217",
                          fontWeight: 700,
                          fontFamily: '"IBM Plex Mono", monospace',
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          color: "#19F28A",
                          fontWeight: 600,
                        }}
                      >
                        Target: {activeButtonKey?.toUpperCase()}
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={((activeStepIndex + 1) / 6) * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        mb: 2,
                        bgcolor: "rgba(0, 212, 255, 0.2)",
                        "& .MuiLinearProgress-bar": { bgcolor: "#00D4FF" },
                      }}
                    />

                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: '"Space Grotesk", sans-serif',
                        fontWeight: 700,
                        color: "#FFFFFF",
                        mb: 0.5,
                      }}
                    >
                      {wizardPrompt}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: liveAdc !== null && liveAdc < 980 ? "#19F28A" : "#94A3B8",
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: "0.82rem",
                        mb: 1.5,
                        fontWeight: 600,
                      }}
                    >
                      {wizardSubPrompt || "If ADC is 1024 (idle), do nothing. Press the button to capture."}
                    </Typography>

                    {wizardError && (
                      <Alert
                        severity="warning"
                        sx={{
                          mb: 2,
                          bgcolor: "rgba(255, 200, 87, 0.12)",
                          border: "1px solid #FFC857",
                          color: "#FFC857",
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: "0.8rem",
                        }}
                      >
                        {wizardError}
                      </Alert>
                    )}

                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: "#060A0E",
                          border: `1px solid ${
                            liveAdc !== null && liveAdc < 980
                              ? "#19F28A"
                              : "#1E293B"
                          }`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            color: "text.secondary",
                            display: "block",
                          }}
                        >
                          LIVE ADC ({liveAdc !== null && liveAdc < 980 ? "PRESSED" : "IDLE / 1024"})
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontWeight: 700,
                            color: liveAdc !== null && liveAdc < 980 ? "#19F28A" : "#94A3B8",
                          }}
                        >
                          {liveAdc !== null ? liveAdc : "1024"}
                        </Typography>
                      </Box>

                      {wizardPhase === "waiting_release" ? (
                        <Box
                          sx={{
                            flexGrow: 1,
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: "rgba(25, 242, 138, 0.1)",
                            border: "1px solid rgba(25, 242, 138, 0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          <CheckCircleIcon sx={{ color: "#19F28A", fontSize: 20 }} />
                          <Typography
                            sx={{
                              fontFamily: '"Space Grotesk", sans-serif',
                              fontWeight: 700,
                              color: "#19F28A",
                              fontSize: "0.9rem",
                            }}
                          >
                            Captured! Release button to auto-advance...
                          </Typography>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          color="secondary"
                          size="large"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => advanceWizardStep(liveAdc ?? undefined)}
                          disabled={liveAdc === null || liveAdc >= 980}
                          sx={{
                            flexGrow: 1,
                            fontFamily: '"Space Grotesk", sans-serif',
                            fontWeight: 700,
                            py: 1.2,
                          }}
                        >
                          {liveAdc !== null && liveAdc < 980
                            ? `Capture Reading (${liveAdc})`
                            : "Waiting for Button Press (ADC 1024)..."}
                        </Button>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Step indicators */}
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2.5 }}>
                  {CALIBRATION_STEPS.map((stepKey, idx) => {
                    const btn = buttons[stepKey];
                    const isStepActive = isWizardActive && activeStepIndex === idx;
                    return (
                      <Chip
                        key={stepKey}
                        label={`${btn.name}: ${btn.calibratedAdc}`}
                        icon={btn.isCalibrated ? <CheckCircleIcon sx={{ fontSize: 15 }} /> : undefined}
                        onClick={() => {
                          if (isConnected) calibrateSingleButton(stepKey);
                        }}
                        sx={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: "0.72rem",
                          bgcolor: isStepActive
                            ? "rgba(0, 212, 255, 0.25)"
                            : btn.isCalibrated
                            ? "rgba(25, 242, 138, 0.1)"
                            : "rgba(100, 116, 139, 0.1)",
                          color: isStepActive ? "#00D4FF" : btn.isCalibrated ? "#19F28A" : "#94A3B8",
                          border: `1px solid ${
                            isStepActive ? "#00D4FF" : btn.isCalibrated ? "rgba(25, 242, 138, 0.4)" : "#22303C"
                          }`,
                          cursor: isConnected ? "pointer" : "default",
                        }}
                      />
                    );
                  })}
                </Stack>

                {/* Button Values & Names Table */}
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    bgcolor: "#060A0E",
                    border: "1px solid #1E293B",
                    borderRadius: 2,
                    mb: 2.5,
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ "& th": { borderColor: "#1E293B", py: 1.2 } }}>
                        <TableCell sx={{ color: "#94A3B8", fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.72rem" }}>
                          BUTTON NAME
                        </TableCell>
                        <TableCell sx={{ color: "#94A3B8", fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.72rem" }}>
                          KEY
                        </TableCell>
                        <TableCell sx={{ color: "#94A3B8", fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.72rem" }}>
                          FACTORY ADC
                        </TableCell>
                        <TableCell sx={{ color: "#94A3B8", fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.72rem" }}>
                          CALIBRATED ADC
                        </TableCell>
                        <TableCell sx={{ color: "#94A3B8", fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.72rem" }}>
                          WINDOW (±{tolerance})
                        </TableCell>
                        <TableCell sx={{ color: "#94A3B8", fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.72rem" }} align="right">
                          ACTIONS
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CALIBRATION_STEPS.map((stepKey) => {
                        const btn = buttons[stepKey];
                        const isEditingName = editingNameKey === stepKey;
                        const windowMin = Math.max(0, btn.calibratedAdc - tolerance);
                        const windowMax = btn.calibratedAdc + tolerance;

                        return (
                          <TableRow
                            key={stepKey}
                            sx={{
                              "& td": { borderColor: "#1E293B", py: 1 },
                              bgcolor: activeButtonKey === stepKey ? "rgba(0, 212, 255, 0.06)" : "transparent",
                            }}
                          >
                            {/* Editable Name Cell */}
                            <TableCell>
                              {isEditingName ? (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <TextField
                                    size="small"
                                    value={tempButtonName}
                                    onChange={(e) => setTempButtonName(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEditName(stepKey);
                                      if (e.key === "Escape") setEditingNameKey(null);
                                    }}
                                    sx={{
                                      "& .MuiInputBase-input": {
                                        py: 0.5,
                                        px: 1,
                                        fontSize: "0.78rem",
                                        fontFamily: '"Space Grotesk", sans-serif',
                                      },
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleSaveEditName(stepKey)}
                                  >
                                    <CheckIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Stack>
                              ) : (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography
                                    sx={{
                                      fontFamily: '"Space Grotesk", sans-serif',
                                      fontWeight: 600,
                                      fontSize: "0.82rem",
                                      color: "text.primary",
                                    }}
                                  >
                                    {btn.name}
                                  </Typography>
                                  <Tooltip title="Edit Button Name">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleStartEditName(stepKey)}
                                      sx={{ p: 0.3, color: "#64748B", "&:hover": { color: "#00D4FF" } }}
                                    >
                                      <EditIcon sx={{ fontSize: 13 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              )}
                            </TableCell>

                            {/* Button Identifier */}
                            <TableCell>
                              <Chip
                                label={stepKey.toUpperCase()}
                                size="small"
                                sx={{
                                  fontFamily: '"IBM Plex Mono", monospace',
                                  fontSize: "0.68rem",
                                  height: 20,
                                  bgcolor: "#1E293B",
                                  color: "#94A3B8",
                                }}
                              />
                            </TableCell>

                            {/* Factory ADC */}
                            <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.8rem", color: "#64748B" }}>
                              {btn.defaultAdc}
                            </TableCell>

                            {/* Calibrated ADC (editable number) */}
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={btn.calibratedAdc}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val)) setButtonAdc(stepKey, val);
                                }}
                                sx={{
                                  width: 85,
                                  "& .MuiInputBase-input": {
                                    py: 0.4,
                                    px: 0.8,
                                    fontFamily: '"IBM Plex Mono", monospace',
                                    fontSize: "0.8rem",
                                    color: btn.isCalibrated ? "#19F28A" : "#FFFFFF",
                                    fontWeight: 600,
                                  },
                                }}
                              />
                            </TableCell>

                            {/* Window Range */}
                            <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.75rem", color: "#94A3B8" }}>
                              [{windowMin} - {windowMax}]
                            </TableCell>

                            {/* Actions */}
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => calibrateSingleButton(stepKey)}
                                disabled={!isConnected}
                                sx={{
                                  fontSize: "0.72rem",
                                  py: 0.3,
                                  px: 1,
                                  fontFamily: '"IBM Plex Mono", monospace',
                                }}
                              >
                                Test
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Overlap alert if tolerance is set too wide */}
                {overlapWarning && (
                  <Alert
                    severity="warning"
                    sx={{
                      mb: 2,
                      bgcolor: "rgba(255, 200, 87, 0.1)",
                      border: "1px solid #FFC857",
                      color: "#FFC857",
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: "0.75rem",
                    }}
                  >
                    {overlapWarning}
                  </Alert>
                )}

                {/* Tolerance Slider & Persistence Buttons */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#060A0E",
                    border: "1px solid #1E293B",
                    mb: 2.5,
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
                    <Box sx={{ flexGrow: 1, width: "100%" }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: '"IBM Plex Mono", monospace', color: "#94A3B8" }}
                        >
                          ADC DETECTION TOLERANCE (± RANGE)
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            color: "#00D4FF",
                            fontWeight: 700,
                          }}
                        >
                          ±{tolerance} (Range: 5 - 40)
                        </Typography>
                      </Stack>
                      <Slider
                        value={tolerance}
                        min={5}
                        max={40}
                        step={1}
                        onChange={(_, v) => setTolerance(v as number)}
                        sx={{
                          color: "#00D4FF",
                          "& .MuiSlider-thumb": {
                            bgcolor: "#00D4FF",
                            boxShadow: "0 0 10px #00D4FF",
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>

                {/* Save & Reset Actions */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<RestartAltIcon />}
                    onClick={handleResetDefaultsClick}
                    disabled={!isConnected}
                    sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}
                  >
                    Restore Factory Defaults
                  </Button>

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveCalibrationClick}
                    disabled={!isConnected}
                    sx={{
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 700,
                      px: 3,
                    }}
                  >
                    Save All to EEPROM (Permanent)
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Card 2: Device Boot Splash Name Editor */}
            <Card
              sx={{
                bgcolor: "#080D12",
                border: "1px solid #22303C",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 700,
                    color: "text.primary",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    mb: 1,
                  }}
                >
                  <BadgeIcon sx={{ color: "#00D4FF" }} />
                  Device Boot Splash Customization
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontSize: "0.82rem", mb: 2.5 }}
                >
                  Customize the name displayed on the OLED display when your RF Hunter powers on. Stored permanently in EEPROM at address 350.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    label="Boot Splash Name"
                    value={editingBootName}
                    onChange={(e) => setEditingBootName(e.target.value.slice(0, 20))}
                    placeholder="e.g. Krish'skhushi"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: '"IBM Plex Mono", monospace', color: "#64748B" }}
                          >
                            {editingBootName.length}/20
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiInputBase-input": {
                        fontFamily: '"Space Grotesk", sans-serif',
                        fontSize: "0.95rem",
                      },
                    }}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveBootNameClick}
                    disabled={!isConnected || !editingBootName.trim()}
                    sx={{
                      minWidth: 160,
                      py: 1.2,
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 700,
                    }}
                  >
                    Save Name
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Card 3: Interactive Serial Terminal & Commands */}
            <Card
              sx={{
                bgcolor: "#080D12",
                border: "1px solid #22303C",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      color: "#94A3B8",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    <TerminalIcon sx={{ fontSize: 16, color: "#00D4FF" }} />
                    DEVICE SERIAL MONITOR & TERMINAL
                  </Typography>

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF (Click to enable)"}>
                      <IconButton
                        size="small"
                        onClick={() => setAutoScroll((v) => !v)}
                        sx={{
                          color: autoScroll ? "#00D4FF" : "#64748B",
                          bgcolor: autoScroll ? "rgba(0, 212, 255, 0.1)" : "transparent",
                          border: "1px solid",
                          borderColor: autoScroll ? "rgba(0, 212, 255, 0.4)" : "transparent",
                          "&:hover": { color: "#00D4FF" },
                        }}
                      >
                        <VerticalAlignBottomIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Clear console">
                      <IconButton size="small" onClick={clearLogs} sx={{ color: "#64748B", "&:hover": { color: "#FF3B5C" } }}>
                        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {/* Quick Command Chips */}
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                  {[
                    { label: "cal-get", cmd: "cal-get" },
                    { label: "cal-read", cmd: "cal-read" },
                    { label: "cal-mode on", cmd: "cal-mode on" },
                    { label: "cal-mode off", cmd: "cal-mode off" },
                    { label: "name", cmd: "name" },
                    { label: "help", cmd: "help" },
                  ].map((item) => (
                    <Chip
                      key={item.label}
                      label={item.label}
                      size="small"
                      disabled={!isConnected}
                      onClick={() => sendRaw(item.cmd)}
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: "0.7rem",
                        bgcolor: "#060A0E",
                        color: "#00D4FF",
                        border: "1px solid #1E293B",
                        cursor: isConnected ? "pointer" : "default",
                        "&:hover": { borderColor: "#00D4FF" },
                      }}
                    />
                  ))}
                </Stack>

                {/* Terminal Log Output Window */}
                <Box
                  sx={{
                    height: 180,
                    overflowY: "auto",
                    bgcolor: "#04070A",
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid #1E293B",
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.3,
                  }}
                >
                  {logs.length === 0 ? (
                    <Typography
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        color: "#475569",
                        fontSize: "0.75rem",
                        fontStyle: "italic",
                      }}
                    >
                      Terminal output will appear here once connected...
                    </Typography>
                  ) : (
                    logs.map((log) => (
                      <Box
                        key={log.id}
                        sx={{
                          display: "flex",
                          gap: 1,
                          color:
                            log.type === "error"
                              ? "#FF3B5C"
                              : log.type === "success"
                              ? "#19F28A"
                              : log.type === "out"
                              ? "#00D4FF"
                              : log.type === "warn"
                              ? "#FFC857"
                              : "#94A3B8",
                        }}
                      >
                        <span style={{ color: "#475569" }}>[{log.time}]</span>
                        <span>{log.text}</span>
                      </Box>
                    ))
                  )}
                  <div ref={terminalEndRef} />
                </Box>

                {/* Send Command Input Form */}
                <Box
                  component="form"
                  onSubmit={handleSendCustomCommand}
                  sx={{ mt: 1.5, display: "flex", gap: 1 }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter serial command (e.g. cal-read, name, help)..."
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    disabled={!isConnected}
                    sx={{
                      "& .MuiInputBase-input": {
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: "0.8rem",
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="outlined"
                    color="primary"
                    disabled={!isConnected || !customCommand.trim()}
                    sx={{ minWidth: 80 }}
                  >
                    <SendIcon sx={{ fontSize: 16 }} />
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
