import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats bytes into a human-readable string (KB, MB, GB, etc.).
 * @param bytes - The number of bytes.
 * @param decimals - The number of decimal places (default is 2).
 * @returns A formatted string representation of the bytes.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Ensure index is within bounds
  const unitIndex = i < sizes.length ? i : sizes.length - 1;

  return (
    parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(dm)) +
    " " +
    sizes[unitIndex]
  );
}
