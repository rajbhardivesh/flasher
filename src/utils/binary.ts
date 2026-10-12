/**
 * Converts an ArrayBuffer into a "binary string" - a string where each
 * character code corresponds to one byte of the buffer. This is the
 * format expected by esptool-js's writeFlash `fileArray` data field.
 *
 * The conversion is chunked to avoid blowing the call stack on large
 * firmware images (String.fromCharCode.apply has an argument limit).
 */
export function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks
  let result = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    result += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return result;
}

/** Formats a byte count into a human readable string (KB / MB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Formats a transfer rate in bytes/sec into a human readable string. */
export function formatSpeed(bytesPerSecond: number): string {
  if (!isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "--";
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
  return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
}
