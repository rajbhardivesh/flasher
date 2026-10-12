import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import UsbIcon from "@mui/icons-material/Usb";
import BoltIcon from "@mui/icons-material/Bolt";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import type { FlasherStatus } from "../hooks/useFirmwareFlasher";

interface FlasherControlsProps {
  status: FlasherStatus;
  isBusy: boolean;
  canFlash: boolean;
  baudRate: number;
  onBaudRateChange: (value: number) => void;
  onConnect: () => void;
  onFlash: () => void;
  onDisconnect: () => void;
}

const BAUD_RATES = [115200, 230400, 460800, 921600];

export default function FlasherControls({
  status,
  isBusy,
  canFlash,
  baudRate,
  onBaudRateChange,
  onConnect,
  onFlash,
  onDisconnect,
}: FlasherControlsProps) {
  const isConnected = status === "connected" || status === "flashing" || status === "done";
  const isFlashing = status === "flashing";

  const handleBaudChange = (e: SelectChangeEvent<number>) => {
    onBaudRateChange(Number(e.target.value));
  };

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
          02 // Serial Interface
        </Typography>

        <Stack spacing={2}>
          <FormControl
            size="small"
            fullWidth
            disabled={isConnected || isBusy}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#030609",
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.85rem",
                "& fieldset": { borderColor: "#22303C" },
                "&:hover fieldset": { borderColor: "primary.main" },
                "&.Mui-focused fieldset": { borderColor: "primary.main" },
              },
              "& .MuiInputLabel-root": {
                color: "text.secondary",
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.85rem",
                "&.Mui-focused": { color: "primary.main" },
              },
            }}
          >
            <InputLabel id="baud-rate-label">Baud Rate</InputLabel>
            <Select
              labelId="baud-rate-label"
              label="Baud Rate"
              value={baudRate}
              onChange={handleBaudChange}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: "#080D12",
                    border: "1px solid #22303C",
                    "& .MuiMenuItem-root": {
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: "0.85rem",
                      "&.Mui-selected": {
                        bgcolor: "rgba(0, 212, 255, 0.15)",
                        color: "primary.main",
                      },
                      "&:hover": {
                        bgcolor: "rgba(0, 212, 255, 0.08)",
                      },
                    },
                  },
                },
              }}
            >
              {BAUD_RATES.map((rate) => (
                <MenuItem key={rate} value={rate}>
                  {rate.toLocaleString()} bps {rate === 115200 ? "(Standard)" : rate === 921600 ? "(Fast)" : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {!isConnected ? (
            <Button
              variant="contained"
              size="large"
              startIcon={
                isBusy ? <CircularProgress size={18} color="inherit" /> : <UsbIcon />
              }
              onClick={onConnect}
              disabled={isBusy}
              fullWidth
              sx={{
                bgcolor: "primary.main",
                color: "#031217",
                py: 1.25,
                fontWeight: 700,
                letterSpacing: "0.04em",
                boxShadow: "0 0 20px rgba(0, 212, 255, 0.25)",
                "&:hover": {
                  bgcolor: "#38BDF8",
                  boxShadow: "0 0 28px rgba(0, 212, 255, 0.45)",
                },
              }}
            >
              {isBusy ? "Connecting..." : "Connect Device"}
            </Button>
          ) : (
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                size="large"
                startIcon={
                  isFlashing ? <CircularProgress size={18} sx={{ color: "#04140D" }} /> : <BoltIcon />
                }
                onClick={onFlash}
                disabled={!canFlash || isBusy}
                fullWidth
                sx={{
                  bgcolor: "#19F28A",
                  color: "#04140D",
                  py: 1.25,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  boxShadow: "0 0 20px rgba(25, 242, 138, 0.25)",
                  "&:hover": {
                    bgcolor: "#2FF79A",
                    boxShadow: "0 0 28px rgba(25, 242, 138, 0.45)",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                    color: "rgba(255, 255, 255, 0.3)",
                  },
                }}
              >
                {isFlashing ? "Flashing Firmware..." : "Flash Firmware"}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<LinkOffIcon />}
                onClick={onDisconnect}
                disabled={isFlashing}
                fullWidth
                sx={{
                  borderColor: "rgba(255, 59, 92, 0.4)",
                  color: "#FF3B5C",
                  py: 1.1,
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "#FF3B5C",
                    bgcolor: "rgba(255, 59, 92, 0.08)",
                    boxShadow: "0 0 16px rgba(255, 59, 92, 0.2)",
                  },
                }}
              >
                Disconnect Port
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
