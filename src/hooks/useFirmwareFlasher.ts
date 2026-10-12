import { useCallback, useRef, useState } from "react";
import { ESPLoader, Transport } from "esptool-js";
import CryptoJS from "crypto-js";
import { arrayBufferToBinaryString, formatSpeed } from "../utils/binary";

export type FlasherStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "flashing"
  | "done"
  | "error"
  | "disconnected";

export interface FlashTarget {
  /** Raw firmware binary data. */
  data: ArrayBuffer;
  /** Flash offset address, e.g. 0x0 for a merged/combined firmware image. */
  address: number;
  /** Display name, used for logging only. */
  name: string;
}

export interface LogEntry {
  id: number;
  text: string;
  level: "info" | "success" | "error" | "warn";
}

let logIdCounter = 0;

export function useFirmwareFlasher() {
  const [status, setStatus] = useState<FlasherStatus>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chipType, setChipType] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [speed, setSpeed] = useState<string>("--");
  const [isBusy, setIsBusy] = useState(false);

  const transportRef = useRef<Transport | null>(null);
  const espLoaderRef = useRef<ESPLoader | null>(null);
  const deviceRef = useRef<SerialPort | null>(null);

  const appendLog = useCallback((text: string, level: LogEntry["level"] = "info") => {
    if (!text) return;
    // esptool-js sometimes sends multi-line chunks; split them so the
    // terminal renders each line separately.
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length === 0) return;
    setLogs((prev) => [
      ...prev,
      ...lines.map((line) => ({ id: logIdCounter++, text: line, level })),
    ]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  // The "terminal" object passed to ESPLoader. esptool-js calls these
  // methods to surface progress / debug information.
  const terminal = {
    clean: () => setLogs([]),
    writeLine: (data: string) => appendLog(data, "info"),
    write: (data: string) => appendLog(data, "info"),
  };

  const isWebSerialSupported = useCallback(() => {
    return typeof navigator !== "undefined" && "serial" in navigator;
  }, []);

  const connect = useCallback(
    async (baudRate: number) => {
      if (!isWebSerialSupported()) {
        appendLog(
          "Web Serial API is not supported in this browser. Please use a Chromium-based browser such as Chrome or Edge.",
          "error"
        );
        setStatus("error");
        return false;
      }

      try {
        setStatus("connecting");
        setIsBusy(true);
        appendLog("Requesting serial port...", "info");

        const device = await navigator.serial.requestPort();
        deviceRef.current = device;

        const transport = new Transport(device, true);
        transportRef.current = transport;

        const loader = new ESPLoader({
          transport,
          baudrate: baudRate,
          terminal,
          romBaudrate: 115200,
        });
        espLoaderRef.current = loader;

        appendLog("Connecting to device... (hold BOOT if needed)", "info");
        const chip = await loader.main();

        setChipType(chip || "Unknown");
        appendLog(`Connected. Detected chip: ${chip}`, "success");
        setStatus("connected");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        appendLog(`Connection failed: ${message}`, "error");
        setStatus("error");
        transportRef.current = null;
        espLoaderRef.current = null;
        deviceRef.current = null;
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [appendLog, isWebSerialSupported, terminal]
  );

  const disconnect = useCallback(async () => {
    try {
      setIsBusy(true);
      const transport = transportRef.current;
      if (transport) {
        try {
          await transport.disconnect();
        } catch {
          // ignore - port may already be closed
        }
      }
      appendLog("Disconnected from device.", "info");
    } finally {
      transportRef.current = null;
      espLoaderRef.current = null;
      deviceRef.current = null;
      setChipType(null);
      setProgress(0);
      setSpeed("--");
      setStatus("disconnected");
      setIsBusy(false);
    }
  }, [appendLog]);

  const flash = useCallback(
    async (target: FlashTarget, options?: { eraseAll?: boolean }) => {
      const loader = espLoaderRef.current;
      if (!loader) {
        appendLog("No device connected. Connect a device before flashing.", "error");
        return false;
      }

      try {
        setIsBusy(true);
        setStatus("flashing");
        setProgress(0);
        setSpeed("--");

        appendLog(`Preparing firmware: ${target.name} (${target.data.byteLength} bytes)`, "info");

        const binaryString = arrayBufferToBinaryString(target.data);
        const totalSize = target.data.byteLength;

        let startTime = Date.now();
        let lastBytes = 0;
        let lastTime = startTime;

        await loader.writeFlash({
          fileArray: [
            {
              data: binaryString,
              address: target.address,
            },
          ],
          flashSize: "keep",
          flashMode: "keep",
          flashFreq: "keep",
          eraseAll: options?.eraseAll ?? false,
          compress: true,
          reportProgress: (_fileIndex: number, written: number, total: number) => {
            const pct = total > 0 ? Math.round((written / total) * 100) : 0;
            setProgress(pct);

            const now = Date.now();
            const elapsed = (now - lastTime) / 1000;
            if (elapsed > 0.25) {
              const bytesDelta = written - lastBytes;
              const instSpeed = bytesDelta / elapsed;
              setSpeed(formatSpeed(instSpeed));
              lastBytes = written;
              lastTime = now;
            }

            if (written >= total) {
              const totalElapsed = (Date.now() - startTime) / 1000;
              const avgSpeed = totalElapsed > 0 ? total / totalElapsed : 0;
              setSpeed(formatSpeed(avgSpeed));
            }
          },
          calculateMD5Hash: (image: string) =>
            CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString(),
        });

        appendLog(`Flash complete: ${target.name} (${totalSize} bytes written).`, "success");

        try {
          appendLog("Resetting device...", "info");
          await loader.hardReset();
        } catch {
          // Hard reset is best-effort; some boards require a manual reset.
          appendLog("Automatic reset not supported - please reset the board manually.", "warn");
        }

        setStatus("done");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        appendLog(`Flashing failed: ${message}`, "error");
        setStatus("error");
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [appendLog]
  );

  return {
    status,
    logs,
    chipType,
    progress,
    speed,
    isBusy,
    isWebSerialSupported: isWebSerialSupported(),
    connect,
    disconnect,
    flash,
    clearLogs,
    appendLog,
  };
}
