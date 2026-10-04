import { format } from "date-fns";
import type { Kind, RemovalReason } from "@/lib/stand/types";

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

export function kindLabel(kind: Kind, count = 2): string {
  const labels: Record<Kind, [string, string]> = {
    flower: ["flower", "flowers"],
    plant: ["plant", "plants"],
    pumpkin: ["pumpkin", "pumpkins"],
  };
  return count === 1 ? labels[kind][0] : labels[kind][1];
}

export function kindTitle(kind: Kind): string {
  if (kind === "flower") return "Flowers";
  if (kind === "plant") return "Plants";
  return "Pumpkins";
}

export function reasonLabel(reason: RemovalReason): string {
  if (reason === "ran-out") return "Sold out";
  if (reason === "tossed") return "Tossed";
  return "Dead";
}
