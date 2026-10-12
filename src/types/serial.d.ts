// Minimal Web Serial API type declarations.
// TypeScript's DOM lib does not yet ship complete Web Serial typings,
// so we declare the small subset used by this application.

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  getInfo(): SerialPortInfo;
  setSignals(signals: {
    dataTerminalReady?: boolean;
    requestToSend?: boolean;
    break?: boolean;
  }): Promise<void>;
  getSignals(): Promise<{
    dataCarrierDetect: boolean;
    clearToSend: boolean;
    ringIndicator: boolean;
    dataSetReady: boolean;
  }>;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: "none" | "even" | "odd";
  bufferSize?: number;
  flowControl?: "none" | "hardware";
}

interface SerialPortRequestOptions {
  filters?: { usbVendorId?: number; usbProductId?: number }[];
}

interface Serial extends EventTarget {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
  readonly serial: Serial;
}
