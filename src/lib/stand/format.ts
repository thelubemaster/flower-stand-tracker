import { format } from "date-fns";
import type { RemovalReason } from "@/lib/stand/types";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatMoney(amount: number): string {
  return moneyFormat.format(Number.isFinite(amount) ? amount : 0);
}

export function localDay(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayToIso(day: string, now = new Date()): string {
  if (day === localDay(now)) return now.toISOString();
  return new Date(`${day}T12:00:00`).toISOString();
}

export function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  const day = format(date, "MMM d, yyyy");
  if (date.getHours() === 12 && date.getMinutes() === 0 && date.getSeconds() === 0) {
    return day;
  }
  return `${day} · ${format(date, "h:mm a")}`;
}

export function itemName(row: { name: string; detail: string }): string {
  const detail = row.detail.trim();
  return detail ? `${row.name} · ${detail}` : row.name;
}

export function reasonLabel(reason: RemovalReason): string {
  if (reason === "ran-out") return "Sold out";
  if (reason === "tossed") return "Tossed";
  if (reason === "counted") return "Counted off";
  return "Dead";
}
