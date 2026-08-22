import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase()
}

export function safeFileName(value: unknown, fallback = "dokumen"): string {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalized || fallback
}

export function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan") : string {
  if (error instanceof Error && error.message) return error.message

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message) return message
  }

  return fallback
}
