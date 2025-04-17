import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { bytesToHex } from "@noble/hashes/utils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function jsonHex(obj: unknown, byteLimit = 0) {
  const tooLarge = "<data too large>";
  return JSON.stringify(
    obj,
    (_, value) => {
      if (value instanceof Uint8Array) {
        if (byteLimit && value.length > byteLimit) return tooLarge;
        return bytesToHex(value);
      }
      // JSON.stringify converts Buffer to { type: "Buffer", data: [] } so convert back to Buffer then to hex
      if (value?.type === "Buffer") {
        const buf = Buffer.from(value);
        if (byteLimit && buf.length > byteLimit) return tooLarge;
        return bytesToHex(buf);
      }
      if (typeof value === "string") {
        if (byteLimit && value.length / 2 > byteLimit) return tooLarge;
      }

      return value;
    },
    2
  );
}

export function arrayChunks<T = unknown>(arr: T[], chunkSize: number) {
  const chunks = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    chunks.push(chunk);
  }

  return chunks;
}

export function shuffle(array: unknown[]) {
  let currentIndex = array.length;

  while (currentIndex != 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}
