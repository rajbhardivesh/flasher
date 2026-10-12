import { useCallback, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import MemoryIcon from "@mui/icons-material/Memory";
import TuneIcon from "@mui/icons-material/Tune";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export type DeviceOption = "rf-hunter" | "custom";

interface DeviceSelectionCardProps {
  device: DeviceOption;
  onDeviceChange: (device: DeviceOption) => void;
  customFile: File | null;
  onCustomFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export const RF_HUNTER_FIRMWARE_PATH = "/firmware/RF-HUNTER-4M2M.bin";

export default function DeviceSelectionCard({
  device,
  onDeviceChange,
  customFile,
  onCustomFileChange,
  disabled,
}: DeviceSelectionCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        if (!file.name.toLowerCase().endsWith(".bin")) {
          return;
        }
        onCustomFileChange(file);
      }
    },
    [disabled, onCustomFileChange]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCustomFileChange(file);
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: "0.6875rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "primary.main",
              fontWeight: 600,
            }}
          >
            01 // Target Platform
          </Typography>
          <Chip
            size="small"
            label="ESP8266EX"
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: "0.65rem",
              height: 20,
              border: "1px solid #22303C",
              bgcolor: "#0D131A",
              color: "text.secondary",
            }}
          />
        </Stack>

        <RadioGroup
          value={device}
          onChange={(e) => onDeviceChange(e.target.value as DeviceOption)}
        >
          {/* RF-HUNTER OPTION */}
          <Box
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: device === "rf-hunter" ? "rgba(0, 212, 255, 0.4)" : "#1B2631",
              bgcolor: device === "rf-hunter" ? "rgba(0, 212, 255, 0.04)" : "#060A0E",
              transition: "all 0.2s ease",
            }}
          >
            <FormControlLabel
              value="rf-hunter"
              disabled={disabled}
              control={
                <Radio
                  size="small"
                  sx={{
                    color: "#334155",
                    "&.Mui-checked": { color: "primary.main" },
                    p: 0.5,
                    mr: 0.5,
                  }}
                />
              }
              label={
                <Box sx={{ width: "100%" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MemoryIcon fontSize="small" sx={{ color: "primary.main" }} />
                      <Typography variant="body2" fontWeight={700} sx={{ color: "text.primary" }}>
                        RF Hunter
                      </Typography>
                    </Stack>
                    <Box
                      component="span"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: "0.625rem",
                        color: "primary.main",
                        border: "1px solid rgba(0, 212, 255, 0.3)",
                        bgcolor: "rgba(0, 212, 255, 0.08)",
                        px: 1,
                        py: 0.2,
                        borderRadius: "9999px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      RDH / 01
                    </Box>
                  </Stack>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                    Standalone wireless security research firmware
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
            />

            {device === "rf-hunter" && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #1E293B" }}>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.75, mb: 1.5 }}>
                  {["WiFi", "BLE", "RF", "ESP8266", "4M2M Flash"].map((tag) => (
                    <Box
                      key={tag}
                      component="span"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: "0.625rem",
                        color: "#94A3B8",
                        border: "1px solid #334155",
                        bgcolor: "rgba(15, 23, 42, 0.6)",
                        px: 0.8,
                        py: 0.25,
                        borderRadius: 1,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {tag}
                    </Box>
                  ))}
                </Stack>

                <Box
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: "#030609",
                    border: "1px solid rgba(0, 212, 255, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#19F28A" }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: "0.72rem",
                        color: "#38BDF8",
                        letterSpacing: "0.02em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {RF_HUNTER_FIRMWARE_PATH}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: "0.625rem",
                      color: "#19F28A",
                      bgcolor: "rgba(25, 242, 138, 0.1)",
                      px: 0.75,
                      py: 0.2,
                      borderRadius: 0.75,
                      flexShrink: 0,
                    }}
                  >
                    LOCAL BIN
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* CUSTOM FIRMWARE OPTION */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: device === "custom" ? "rgba(0, 212, 255, 0.4)" : "#1B2631",
              bgcolor: device === "custom" ? "rgba(0, 212, 255, 0.04)" : "#060A0E",
              transition: "all 0.2s ease",
            }}
          >
            <FormControlLabel
              value="custom"
              disabled={disabled}
              control={
                <Radio
                  size="small"
                  sx={{
                    color: "#334155",
                    "&.Mui-checked": { color: "primary.main" },
                    p: 0.5,
                    mr: 0.5,
                  }}
                />
              }
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <TuneIcon fontSize="small" sx={{ color: "primary.main" }} />
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: "text.primary" }}>
                      Custom Firmware
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Upload custom .bin binary file
                    </Typography>
                  </Box>
                </Stack>
              }
              sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
            />

            {device === "custom" && (
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !disabled && fileInputRef.current?.click()}
                sx={{
                  mt: 1.5,
                  p: 2.5,
                  borderRadius: 2,
                  border: "2px dashed",
                  borderColor: isDragging ? "primary.main" : "rgba(34, 48, 60, 0.9)",
                  bgcolor: isDragging ? "rgba(0, 212, 255, 0.06)" : "#030609",
                  textAlign: "center",
                  cursor: disabled ? "default" : "pointer",
                  opacity: disabled ? 0.6 : 1,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: disabled ? "rgba(34, 48, 60, 0.9)" : "primary.main",
                  },
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".bin"
                  hidden
                  onChange={handleFileInputChange}
                  disabled={disabled}
                />
                {customFile ? (
                  <Stack spacing={1} alignItems="center">
                    <InsertDriveFileIcon sx={{ color: "primary.main", fontSize: 28 }} />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ fontFamily: '"IBM Plex Mono", monospace', wordBreak: "break-all" }}
                    >
                      {customFile.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${(customFile.size / 1024).toFixed(1)} KB`}
                      variant="outlined"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: "0.7rem",
                        borderColor: "#22303C",
                        color: "#38BDF8",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6875rem" }}>
                      Click or drop another .bin file to replace
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={1} alignItems="center">
                    <UploadFileIcon sx={{ color: "primary.main", fontSize: 32 }} />
                    <Typography variant="body2" fontWeight={600}>
                      Drop .bin firmware here
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      or click to browse local storage
                    </Typography>
                  </Stack>
                )}
              </Box>
            )}
          </Box>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
