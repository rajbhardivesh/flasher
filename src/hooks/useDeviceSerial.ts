import { useCallback, useRef, useState, useEffect } from "react";

export type ButtonKey = "up" | "down" | "left" | "right" | "enter" | "back";

export type WizardPhase = "waiting_press" | "sampling" | "waiting_release" | "completed";

export interface ButtonInfo {
  key: ButtonKey;
  name: string;
  defaultAdc: number;
  calibratedAdc: number;
  cx: number;
  cy: number;
  radius: number;
  isCalibrated: boolean;
}

export interface SerialLog {
  id: number;
  text: string;
  type: "in" | "out" | "info" | "success" | "error" | "warn";
  time: string;
}

const DEFAULT_BUTTONS: Record<ButtonKey, { name: string; defaultAdc: number; cx: number; cy: number; radius: number }> = {
  up:    { name: "UP Button",    defaultAdc: 188, cx: 439, cy: 1201, radius: 32 },
  down:  { name: "DOWN Button",  defaultAdc: 240, cx: 440, cy: 1352, radius: 32 },
  left:  { name: "LEFT Button",  defaultAdc: 96,  cx: 364, cy: 1277, radius: 32 },
  right: { name: "RIGHT Button", defaultAdc: 331, cx: 518, cy: 1278, radius: 32 },
  enter: { name: "ENTER Button", defaultAdc: 426, cx: 600, cy: 1350, radius: 34 },
  back:  { name: "BACK Button",  defaultAdc: 375, cx: 656, cy: 1238, radius: 34 },
};

export const CALIBRATION_STEPS: ButtonKey[] = ["up", "down", "left", "right", "enter", "back"];

let serialLogId = 0;

export function useDeviceSerial() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [baudRate, setBaudRate] = useState(115200);
  const [logs, setLogs] = useState<SerialLog[]>([]);

  // Device calibration state
  const [buttons, setButtons] = useState<Record<ButtonKey, ButtonInfo>>(() => {
    const init: Partial<Record<ButtonKey, ButtonInfo>> = {};
    for (const key of CALIBRATION_STEPS) {
      init[key] = {
        key,
        name: DEFAULT_BUTTONS[key].name,
        defaultAdc: DEFAULT_BUTTONS[key].defaultAdc,
        calibratedAdc: DEFAULT_BUTTONS[key].defaultAdc,
        cx: DEFAULT_BUTTONS[key].cx,
        cy: DEFAULT_BUTTONS[key].cy,
        radius: DEFAULT_BUTTONS[key].radius,
        isCalibrated: false,
      };
    }
    return init as Record<ButtonKey, ButtonInfo>;
  });

  const [tolerance, setTolerance] = useState<number>(15);
  const [bootName, setBootName] = useState<string>("Alien");
  const [liveAdc, setLiveAdc] = useState<number | null>(null);

  // Wizard state
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [wizardPrompt, setWizardPrompt] = useState<string>("");
  const [wizardSubPrompt, setWizardSubPrompt] = useState<string>("");
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardPhase, setWizardPhase] = useState<WizardPhase>("waiting_press");

  // Serial port references
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const keepReadingRef = useRef<boolean>(false);
  const activeStepRef = useRef<number>(-1);
  const buttonsRef = useRef(buttons);
  const toleranceRef = useRef(tolerance);
  const isWizardActiveRef = useRef(isWizardActive);
  const wizardPhaseRef = useRef(wizardPhase);
  const sampleBufferRef = useRef<number[]>([]);

  useEffect(() => {
    buttonsRef.current = buttons;
  }, [buttons]);

  useEffect(() => {
    toleranceRef.current = tolerance;
  }, [tolerance]);

  useEffect(() => {
    activeStepRef.current = activeStepIndex;
  }, [activeStepIndex]);

  useEffect(() => {
    isWizardActiveRef.current = isWizardActive;
  }, [isWizardActive]);

  useEffect(() => {
    wizardPhaseRef.current = wizardPhase;
  }, [wizardPhase]);

  const appendLog = useCallback((text: string, type: SerialLog["type"] = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-300), { id: serialLogId++, text, type, time }]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const sendRaw = useCallback(async (command: string) => {
    if (!writerRef.current) {
      appendLog("Not connected to serial port", "error");
      return false;
    }
    try {
      appendLog(`> ${command}`, "out");
      await writerRef.current.write(`${command}\n`);
      return true;
    } catch (err) {
      appendLog(`Write error: ${err instanceof Error ? err.message : String(err)}`, "error");
      return false;
    }
  }, [appendLog]);

  // Save full calibration to EEPROM via serial
  const saveCalibrationToDevice = useCallback(async (customTol?: number) => {
    const cur = buttonsRef.current;
    const tol = customTol ?? toleranceRef.current;
    const cmd = `cal-save ${cur.up.calibratedAdc} ${cur.down.calibratedAdc} ${cur.left.calibratedAdc} ${cur.right.calibratedAdc} ${cur.enter.calibratedAdc} ${cur.back.calibratedAdc} ${tol}`;
    appendLog(`Sending calibration save to EEPROM...`, "info");
    return await sendRaw(cmd);
  }, [sendRaw, appendLog]);

  // Handle incoming ADC reading inside wizard state machine
  const processWizardAdc = useCallback((val: number) => {
    if (!isWizardActiveRef.current) return;
    const currentIdx = activeStepRef.current;
    if (currentIdx < 0 || currentIdx >= CALIBRATION_STEPS.length) return;

    const currentKey = CALIBRATION_STEPS[currentIdx];
    const currentBtn = buttonsRef.current[currentKey];

    if (wizardPhaseRef.current === "waiting_press" || wizardPhaseRef.current === "sampling") {
      if (val >= 980) {
        // Idle (1024) - No button is currently pressed!
        // "If ADC 1024 Do nothing until Value Change"
        setWizardPrompt(`Press & Hold the ${currentBtn.name} (${currentKey.toUpperCase()})`);
        setWizardSubPrompt("ADC: 1024 (Idle) — Waiting for button press...");
        sampleBufferRef.current = [];
        return;
      }

      // Value changed from 1024! (val < 980, e.g. 188)
      setWizardPhase("sampling");
      wizardPhaseRef.current = "sampling";
      setWizardSubPrompt(`Sampling press: ADC ${val}... Hold button steady`);
      sampleBufferRef.current.push(val);

      // Collect 3 consecutive samples
      if (sampleBufferRef.current.length >= 3) {
        const sum = sampleBufferRef.current.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / sampleBufferRef.current.length);
        sampleBufferRef.current = [];

        // "And Check Same Value Should not Be"
        // Check if value is duplicate of any ALREADY calibrated button in this session!
        let duplicateName: string | null = null;
        for (let i = 0; i < currentIdx; i++) {
          const prevKey = CALIBRATION_STEPS[i];
          const prevVal = buttonsRef.current[prevKey].calibratedAdc;
          if (Math.abs(avg - prevVal) < 35) {
            duplicateName = buttonsRef.current[prevKey].name;
            break;
          }
        }

        if (duplicateName) {
          // Reject duplicate press!
          setWizardError(`Duplicate ADC (${avg}) matches ${duplicateName}! Please press the correct ${currentBtn.name}.`);
          setWizardPrompt(`⚠️ DUPLICATE BUTTON DETECTED!`);
          setWizardSubPrompt(`Release button and press ${currentBtn.name}...`);
          return;
        }

        // Value is valid & distinct!
        setWizardError(null);
        setButtons((prev) => ({
          ...prev,
          [currentKey]: {
            ...prev[currentKey],
            calibratedAdc: avg,
            isCalibrated: true,
          },
        }));

        appendLog(`[CAL] Captured ${currentBtn.name}: ADC ${avg}`, "success");
        setWizardPrompt(`✅ Captured ${currentBtn.name}: ADC ${avg}`);
        setWizardSubPrompt("Please release the button now to proceed...");
        setWizardPhase("waiting_release");
        wizardPhaseRef.current = "waiting_release";
      }
    } else if (wizardPhaseRef.current === "waiting_release") {
      // User is releasing button: wait until ADC goes back to idle (>= 980 / 1024)
      if (val >= 980) {
        // Button released! Advance to next button
        sampleBufferRef.current = [];
        const nextIdx = currentIdx + 1;

        if (nextIdx < CALIBRATION_STEPS.length) {
          activeStepRef.current = nextIdx;
          setActiveStepIndex(nextIdx);
          setWizardPhase("waiting_press");
          wizardPhaseRef.current = "waiting_press";
          const nextKey = CALIBRATION_STEPS[nextIdx];
          const nextBtn = buttonsRef.current[nextKey];
          setWizardPrompt(`Press & Hold the ${nextBtn.name} (${nextKey.toUpperCase()})`);
          setWizardSubPrompt("ADC: 1024 (Idle) — Waiting for button press...");
          appendLog(`Moving to step ${nextIdx + 1}/6: ${nextBtn.name}`, "info");
        } else {
          // Completed all 6 buttons!
          activeStepRef.current = CALIBRATION_STEPS.length;
          setActiveStepIndex(CALIBRATION_STEPS.length);
          setWizardPhase("completed");
          wizardPhaseRef.current = "completed";
          setWizardPrompt("🎉 Calibration Complete! All 6 buttons verified.");
          setWizardSubPrompt("Saving permanently to EEPROM...");
          appendLog("All 6 buttons calibrated successfully! Saving to EEPROM...", "success");

          setTimeout(async () => {
            await saveCalibrationToDevice();
            await sendRaw("cal-mode off");
            setWizardSubPrompt("Saved permanently! Your RF Hunter is now ready.");
            setTimeout(() => {
              setIsWizardActive(false);
              setActiveStepIndex(-1);
              setWizardPhase("waiting_press");
              wizardPhaseRef.current = "waiting_press";
            }, 3000);
          }, 600);
        }
      }
    }
  }, [appendLog, saveCalibrationToDevice, sendRaw]);

  // Handle incoming lines from RF Hunter
  const handleIncomingLine = useCallback((line: string) => {
    appendLog(line, "in");

    // Check for ADC live readings e.g. [CAL] ADC:1024
    const adcMatch = line.match(/\[CAL\] ADC:(\d+)/i) || line.match(/ADC:\s*(\d+)/i);
    if (adcMatch) {
      const val = parseInt(adcMatch[1], 10);
      setLiveAdc(val);
      processWizardAdc(val);
    }

    // Check for STEP reading response e.g. [CAL] STEP:UP ADC:188
    const stepMatch = line.match(/\[CAL\] STEP:(\w+)\s+ADC:(\d+)/i);
    if (stepMatch) {
      const btnKey = stepMatch[1].toLowerCase() as ButtonKey;
      const adcVal = parseInt(stepMatch[2], 10);
      if (btnKey in DEFAULT_BUTTONS) {
        setButtons((prev) => ({
          ...prev,
          [btnKey]: {
            ...prev[btnKey],
            calibratedAdc: adcVal,
            isCalibrated: true,
          },
        }));
        setLiveAdc(adcVal);
      }
    }

    // Check for calibration data JSON e.g. [CAL] {"up":188,"down":240,...}
    if (line.includes("[CAL] {") || line.startsWith("{")) {
      try {
        const jsonStr = line.substring(line.indexOf("{"));
        const data = JSON.parse(jsonStr);
        setButtons((prev) => {
          const next = { ...prev };
          if (typeof data.up === "number") next.up = { ...next.up, calibratedAdc: data.up, isCalibrated: true };
          if (typeof data.down === "number") next.down = { ...next.down, calibratedAdc: data.down, isCalibrated: true };
          if (typeof data.left === "number") next.left = { ...next.left, calibratedAdc: data.left, isCalibrated: true };
          if (typeof data.right === "number") next.right = { ...next.right, calibratedAdc: data.right, isCalibrated: true };
          if (typeof data.enter === "number") next.enter = { ...next.enter, calibratedAdc: data.enter, isCalibrated: true };
          if (typeof data.back === "number") next.back = { ...next.back, calibratedAdc: data.back, isCalibrated: true };
          return next;
        });
        if (typeof data.tolerance === "number") {
          setTolerance(data.tolerance);
        }
        appendLog("[CAL] Calibration loaded from device EEPROM", "success");
      } catch {
        // ignore parse errors
      }
    }

    // Check for boot name e.g. [NAME] Alien or [NAME] SAVED: ...
    const nameMatch = line.match(/\[NAME\]\s+(?:SAVED:\s*)?(.+)/i);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (name.length > 0) {
        setBootName(name);
        appendLog(`[NAME] Device Boot Name: "${name}"`, "success");
      }
    }

    // Check for calibration save confirmation
    if (line.includes("[CAL] SAVED OK")) {
      appendLog("[OK] All button calibrations & tolerance permanently saved to EEPROM!", "success");
    }
  }, [appendLog, processWizardAdc]);

  // Connect Web Serial port
  const connect = useCallback(async (customBaud?: number) => {
    if (typeof navigator === "undefined" || !("serial" in navigator)) {
      appendLog("Web Serial is not supported in this browser. Please use Chrome or Edge.", "error");
      return false;
    }

    try {
      setIsConnecting(true);
      appendLog("Requesting serial port...", "info");
      const port = await navigator.serial.requestPort();
      portRef.current = port;

      const targetBaud = customBaud || baudRate;
      appendLog(`Opening port at ${targetBaud} baud...`, "info");
      await port.open({ baudRate: targetBaud });

      // Setup TextEncoder / Decoder streams
      const textDecoder = new TextDecoderStream();
      (port.readable as ReadableStream<Uint8Array>)?.pipeTo(textDecoder.writable as unknown as WritableStream<Uint8Array>);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      const textEncoder = new TextEncoderStream();
      (textEncoder.readable as any).pipeTo(port.writable);
      const writer = textEncoder.writable.getWriter();
      writerRef.current = writer;

      setIsConnected(true);
      setIsConnecting(false);
      keepReadingRef.current = true;
      appendLog("[CONNECTED] Serial communication active at 115200 baud.", "success");

      // Start background read loop
      (async () => {
        let buffer = "";
        try {
          while (keepReadingRef.current) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() || "";
              for (const l of lines) {
                if (l.trim().length > 0) {
                  handleIncomingLine(l.trim());
                }
              }
            }
          }
        } catch (readErr) {
          if (keepReadingRef.current) {
            appendLog(`Serial read stream closed: ${readErr}`, "warn");
          }
        }
      })();

      // Query initial state
      setTimeout(() => {
        sendRaw("cal-get");
        sendRaw("name");
      }, 300);

      return true;
    } catch (err) {
      setIsConnecting(false);
      setIsConnected(false);
      appendLog(`Connection cancelled or failed: ${err instanceof Error ? err.message : String(err)}`, "error");
      return false;
    }
  }, [baudRate, appendLog, handleIncomingLine, sendRaw]);

  // Background polling for live ADC while connected
  useEffect(() => {
    if (!isConnected) return;
    const pollTimer = setInterval(() => {
      if (writerRef.current) {
        writerRef.current.write("cal-read\n").catch(() => {});
      }
    }, 120);

    return () => clearInterval(pollTimer);
  }, [isConnected]);

  // Disconnect
  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
      if (writerRef.current) {
        await writerRef.current.close();
        writerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
      setIsConnected(false);
      setIsWizardActive(false);
      setActiveStepIndex(-1);
      appendLog("Serial port disconnected.", "info");
    } catch (err) {
      appendLog(`Disconnect error: ${err instanceof Error ? err.message : String(err)}`, "error");
      setIsConnected(false);
    }
  }, [appendLog]);

  // Read current raw ADC from device
  const readLiveAdc = useCallback(async () => {
    return await sendRaw("cal-read");
  }, [sendRaw]);

  // Set individual button name (editable in Web UI)
  const setButtonName = useCallback((key: ButtonKey, newName: string) => {
    setButtons((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        name: newName,
      },
    }));
  }, []);

  // Set individual button calibrated value
  const setButtonAdc = useCallback((key: ButtonKey, value: number) => {
    setButtons((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        calibratedAdc: value,
        isCalibrated: true,
      },
    }));
  }, []);

  // Reset to factory defaults
  const resetToDefaults = useCallback(async () => {
    setButtons((prev) => {
      const next = { ...prev };
      for (const k of CALIBRATION_STEPS) {
        next[k] = {
          ...next[k],
          calibratedAdc: DEFAULT_BUTTONS[k].defaultAdc,
          isCalibrated: false,
        };
      }
      return next;
    });
    setTolerance(15);
    appendLog("Restoring factory button thresholds (UP=188, DOWN=240, LEFT=96, RIGHT=331, ENTER=426, BACK=375, TOL=15)...", "info");
    return await sendRaw("cal-reset");
  }, [sendRaw, appendLog]);

  // Save boot name
  const saveBootName = useCallback(async (newName: string) => {
    const clean = newName.trim();
    if (!clean) return false;
    setBootName(clean);
    appendLog(`Setting boot name to "${clean}"...`, "info");
    return await sendRaw(`name-set ${clean}`);
  }, [sendRaw, appendLog]);

  // Calibrate single button manually
  const calibrateSingleButton = useCallback(async (key: ButtonKey) => {
    appendLog(`Calibrating ${buttons[key].name} (${key.toUpperCase()})... Press and hold button on RF Hunter`, "info");
    await sendRaw(`cal-step ${key.toUpperCase()}`);
  }, [buttons, sendRaw, appendLog]);

  // Start Automated Step-by-Step Wizard Flow
  const startWizard = useCallback(async () => {
    if (!isConnected) {
      appendLog("Please connect to Serial port first to begin calibration.", "error");
      return;
    }

    sampleBufferRef.current = [];
    setIsWizardActive(true);
    setActiveStepIndex(0);
    setWizardPhase("waiting_press");
    setWizardError(null);

    const firstKey = CALIBRATION_STEPS[0];
    const firstBtn = buttons[firstKey];
    setWizardPrompt(`Press & Hold the ${firstBtn.name} (${firstKey.toUpperCase()})`);
    setWizardSubPrompt("ADC: 1024 (Idle) — Waiting for button press...");

    // Put device in Calibration Mode
    await sendRaw("cal-mode on");
    appendLog(`Started button calibration wizard. Target: ${firstBtn.name}`, "info");
  }, [isConnected, buttons, sendRaw, appendLog]);

  // Manual fallback advance step
  const advanceWizardStep = useCallback(async (manualVal?: number) => {
    if (typeof manualVal === "number" && manualVal < 980) {
      processWizardAdc(manualVal);
    }
  }, [processWizardAdc]);

  const cancelWizard = useCallback(async () => {
    setIsWizardActive(false);
    setActiveStepIndex(-1);
    setWizardPhase("waiting_press");
    setWizardPrompt("");
    setWizardSubPrompt("");
    setWizardError(null);
    sampleBufferRef.current = [];
    await sendRaw("cal-mode off");
    appendLog("Calibration wizard cancelled.", "info");
  }, [sendRaw, appendLog]);

  return {
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
    // Wizard
    isWizardActive,
    activeStepIndex,
    activeButtonKey: activeStepIndex >= 0 && activeStepIndex < CALIBRATION_STEPS.length ? CALIBRATION_STEPS[activeStepIndex] : null,
    wizardPrompt,
    wizardSubPrompt,
    wizardError,
    wizardPhase,
    startWizard,
    advanceWizardStep,
    cancelWizard,
  };
}
