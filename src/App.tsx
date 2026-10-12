import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Container,
  CssBaseline,
  Grid,
  Link,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { getAppTheme } from "./theme/theme";
import Header, { type NavTab } from "./components/Header";
import DeviceSelectionCard, { type DeviceOption } from "./components/DeviceSelectionCard";
import FlasherControls from "./components/FlasherControls";
import StatusPanel from "./components/StatusPanel";
import TerminalPanel from "./components/TerminalPanel";
import CalibrationSection from "./components/CalibrationSection";
import { useFirmwareFlasher, type FlashTarget } from "./hooks/useFirmwareFlasher";

const RF_HUNTER_FIRMWARE_NAME = "RF-HUNTER-4M2M.bin";

const THEME_STORAGE_KEY = "rdh-flasher-theme-mode";

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return "dark"; // Default to hacker dark mode
  });

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== "undefined" && window.location.hash === "#calibrate") {
      return "calibrate";
    }
    return "flasher";
  });

  const [device, setDevice] = useState<DeviceOption>("rf-hunter");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [baudRate, setBaudRate] = useState(115200);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#calibrate") {
        setActiveTab("calibrate");
      } else if (window.location.hash === "#flasher") {
        setActiveTab("flasher");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    window.location.hash = tab === "calibrate" ? "#calibrate" : "#flasher";
  };

  const {
    status,
    logs,
    chipType,
    progress,
    speed,
    isBusy,
    isWebSerialSupported,
    connect,
    disconnect,
    flash,
    clearLogs,
    appendLog,
  } = useFirmwareFlasher();

  const isConnected = status === "connected" || status === "flashing" || status === "done";
  const canFlash = device === "rf-hunter" || (device === "custom" && !!customFile);

  const handleConnect = async () => {
    await connect(baudRate);
  };

  const handleFlash = async () => {
    let target: FlashTarget | null = null;

    if (device === "rf-hunter") {
      try {
        appendLog(`[INIT] Accessing bundled firmware: /firmware/${RF_HUNTER_FIRMWARE_NAME}`, "info");

        const tryUrls = [
          `${import.meta.env.BASE_URL}firmware/${RF_HUNTER_FIRMWARE_NAME}`,
          `/firmware/${RF_HUNTER_FIRMWARE_NAME}`,
          `./firmware/${RF_HUNTER_FIRMWARE_NAME}`,
          `${import.meta.env.BASE_URL}${RF_HUNTER_FIRMWARE_NAME}`,
          `./${RF_HUNTER_FIRMWARE_NAME}`,
        ];

        let response: Response | null = null;
        let successfulUrl = "";

        for (const url of tryUrls) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              response = res;
              successfulUrl = url;
              break;
            }
          } catch {
            // continue fallback
          }
        }

        if (!response || !response.ok) {
          throw new Error(
            `Unable to locate /firmware/${RF_HUNTER_FIRMWARE_NAME} in static assets.`
          );
        }

        const data = await response.arrayBuffer();
        appendLog(`[OK] Binary loaded: ${successfulUrl} (${data.byteLength.toLocaleString()} bytes)`, "success");
        appendLog(`[OK] Flash base address: 0x00000000 (Merged flash)`, "info");

        target = {
          data,
          address: 0x0,
          name: RF_HUNTER_FIRMWARE_NAME,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        appendLog(`[ERR] Failed to load firmware: ${message}`, "error");
        appendLog(
          "Ensure /firmware/RF-HUNTER-4M2M.bin exists, or select Custom Firmware to upload directly.",
          "warn"
        );
        return;
      }
    } else if (device === "custom" && customFile) {
      appendLog(`[INIT] Reading custom image: ${customFile.name} (${customFile.size.toLocaleString()} bytes)`, "info");
      const data = await customFile.arrayBuffer();
      target = {
        data,
        address: 0x0,
        name: customFile.name,
      };
    }

    if (!target) {
      appendLog("[ERR] No valid firmware target configured.", "error");
      return;
    }

    await flash(target);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        <Header
          mode={mode}
          onToggleMode={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 }, flexGrow: 1, px: { xs: 2, sm: 3, md: 5 } }}>
          {/* Cyber Hero / Eyebrow Header */}
          <Box sx={{ mb: 3.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: "#19F28A",
                  boxShadow: "0 0 12px #19F28A",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: "0.72rem",
                  color: "#94A3B8",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {activeTab === "flasher"
                  ? "Engineering secure systems // India"
                  : "Hardware Calibration & Config // Pin A0"}
              </Typography>
            </Stack>

            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: "text.primary",
                letterSpacing: "-0.03em",
                fontSize: { xs: "1.75rem", sm: "2.25rem" },
              }}
            >
              {activeTab === "flasher" ? (
                <>
                  Cyber Tools{" "}
                  <Box
                    component="span"
                    sx={{
                      background: "linear-gradient(90deg, #00D4FF 0%, #19F28A 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Firmware Flasher
                  </Box>
                </>
              ) : (
                <>
                  RF Hunter{" "}
                  <Box
                    component="span"
                    sx={{
                      background: "linear-gradient(90deg, #00D4FF 0%, #19F28A 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Button Calibration & Config
                  </Box>
                </>
              )}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.75,
                maxWidth: 780,
                fontSize: "0.875rem",
                lineHeight: 1.6,
              }}
            >
              {activeTab === "flasher"
                ? "Purpose-built browser flasher for RF Hunter and ESP8266/ESP32 security research platforms. Transmits binary images directly over the Web Serial API without host drivers."
                : "Calibrate the 6-button analog resistor ladder (pin A0), adjust voltage tolerance windows, customize button names, and personalize your device boot splash name permanently stored in EEPROM."}
            </Typography>
          </Box>

          {!isWebSerialSupported && (
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                bgcolor: "#080D12",
                border: "1px solid #FFC857",
                color: "#FFC857",
                borderRadius: 2,
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.8rem",
              }}
            >
              Web Serial API is not supported in this browser. Please open this tool in Google Chrome, Microsoft Edge,
              or another Chromium-based desktop browser.
            </Alert>
          )}

          {/* Conditional View: Flasher vs Calibration Section */}
          {activeTab === "flasher" ? (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={4.5}>
                <Stack spacing={2.5}>
                  <DeviceSelectionCard
                    device={device}
                    onDeviceChange={setDevice}
                    customFile={customFile}
                    onCustomFileChange={setCustomFile}
                    disabled={isConnected || isBusy}
                  />
                  <FlasherControls
                    status={status}
                    isBusy={isBusy}
                    canFlash={canFlash}
                    baudRate={baudRate}
                    onBaudRateChange={setBaudRate}
                    onConnect={handleConnect}
                    onFlash={handleFlash}
                    onDisconnect={handleDisconnect}
                  />
                  <StatusPanel
                    status={status}
                    chipType={chipType}
                    progress={progress}
                    speed={speed}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} lg={7.5}>
                <TerminalPanel logs={logs} onClear={clearLogs} />
              </Grid>
            </Grid>
          ) : (
            <CalibrationSection />
          )}
        </Container>

        {/* Minimal Hacker Footer matching rdhrobotics.in */}
        <Box
          component="footer"
          sx={{
            borderTop: "1px solid #22303C",
            bgcolor: "#060A0E",
            py: 3,
            mt: "auto",
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 5 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  color: "#64748B",
                  fontSize: "0.75rem",
                }}
              >
                <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
                  RDH ROBOTICS /{" "}
                </Box>
                Copyright {new Date().getFullYear()}. All rights reserved.
              </Typography>

              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Link
                  href="https://rdhrobotics.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Website
                </Link>
                <Link
                  href="https://docs.rdhrobotics.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Documentation
                </Link>
                <Link
                  href="https://github.com/rdhrobotics"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  GitHub
                </Link>
                <Link
                  href="mailto:rdhrobotics@hotmail.com"
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Email
                </Link>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
