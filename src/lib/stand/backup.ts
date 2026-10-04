import { upgradePurchase, upgradeRemoval } from "@/lib/stand/logic";
import type { Collection, PriceChange, Purchase, Removal } from "@/lib/stand/types";

export const BACKUP_KIND = "flower-stand-backup";
const BACKUP_VERSION = 1;
const MAX_CHARS = 2_000_000;

export type StandBackup = {
  kind: typeof BACKUP_KIND;
  version: 1;
  savedAt: string;
  appVersion: string;
  purchases: Purchase[];
  removals: Removal[];
  collections: Collection[];
  priceChanges: PriceChange[];
};

function asRecord(raw: unknown): Record<string, unknown> | null {
  return raw != null && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function money(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 999999.99) return null;
  return Math.round(value * 100) / 100;
}

function whole(value: unknown, min: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > 100000) return null;
  return value;
}

function stamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return value;
}

function uniqueIds(ids: string[]): boolean {
  return new Set(ids).size === ids.length;
}

export function buildBackup(
  purchases: Purchase[],
  removals: Removal[],
  collections: Collection[],
  priceChanges: PriceChange[],
  appVersion: string,
  now = new Date(),
): StandBackup {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    savedAt: now.toISOString(),
    appVersion,
    purchases,
    removals,
    collections,
    priceChanges,
  };
}

export function backupFileName(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `flower-stand-backup-${y}-${m}-${d}.json`;
}

export function parseBackup(text: string): { ok: true; backup: StandBackup } | { ok: false; error: string } {
  if (text.length > MAX_CHARS) return { ok: false, error: "That file is too big to be a stand backup." };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't a Flower Stand backup." };
  }
  const row = asRecord(raw);
  if (!row || row.kind !== BACKUP_KIND) {
    return { ok: false, error: "This isn't a Flower Stand backup. Use the file this app saved." };
  }
  if (row.version !== BACKUP_VERSION) {
    return { ok: false, error: "This backup is from a copy of the app this phone can't read." };
  }
  const savedAt = stamp(row.savedAt);
  if (!savedAt) return { ok: false, error: "This backup is missing the day it was saved." };

  if (!Array.isArray(row.purchases) || !Array.isArray(row.removals) || !Array.isArray(row.collections)) {
    return { ok: false, error: "This backup is missing the book." };
  }
  const priceRows = row.priceChanges == null ? [] : row.priceChanges;
  if (!Array.isArray(priceRows)) return { ok: false, error: "This backup's price list is unreadable." };

  const purchases = row.purchases.map(upgradePurchase);
  const removals = row.removals.map(upgradeRemoval);
  const collections: Collection[] = [];
  const priceChanges: PriceChange[] = [];

  for (const purchase of purchases) {
    const quantity = whole(purchase.quantity, 1);
    const remaining = whole(purchase.remaining, 0);
    const totalCost = money(purchase.totalCost);
    const sellPrice = money(purchase.sellPrice);
    if (
      !asString(purchase.id) ||
      !asString(purchase.name) ||
      !asString(purchase.label) ||
      quantity == null ||
      remaining == null ||
      remaining > quantity ||
      totalCost == null ||
      sellPrice == null ||
      !stamp(purchase.at)
    ) {
      return { ok: false, error: "A buy in this backup doesn't look right." };
    }
  }
  if (!uniqueIds(purchases.map((purchase) => purchase.id))) {
    return { ok: false, error: "Two buys in this backup share an id." };
  }

  const byId = new Map(purchases.map((purchase) => [purchase.id, purchase]));
  const removed = new Map<string, number>();
  for (const removal of removals) {
    const quantity = whole(removal.quantity, 1);
    const purchase = byId.get(removal.purchaseId);
    if (!asString(removal.id) || !purchase || quantity == null || !stamp(removal.at)) {
      return { ok: false, error: "A removal in this backup doesn't match a buy." };
    }
    if (removal.reason !== "ran-out" && removal.reason !== "tossed" && removal.reason !== "dead" && removal.reason !== "counted") {
      return { ok: false, error: "A removal in this backup has a reason this app doesn't know." };
    }
    removed.set(removal.purchaseId, (removed.get(removal.purchaseId) ?? 0) + quantity);
  }
  if (!uniqueIds(removals.map((removal) => removal.id))) {
    return { ok: false, error: "Two removals in this backup share an id." };
  }
  for (const purchase of purchases) {
    const gone = removed.get(purchase.id) ?? 0;
    if (gone > purchase.quantity || purchase.remaining !== purchase.quantity - gone) {
      return { ok: false, error: "The counts in this backup don't add up." };
    }
  }

  for (const item of row.collections) {
    const collection = asRecord(item);
    const id = collection ? asString(collection.id) : null;
    const at = collection ? stamp(collection.at) : null;
    const amount = collection ? money(collection.amount) : null;
    const note = collection && typeof collection.note === "string" ? collection.note : null;
    if (!id || !at || amount == null || amount <= 0 || note == null || note.length > 200) {
      return { ok: false, error: "A cash line in this backup doesn't look right." };
    }
    collections.push({ id, amount, at, note });
  }
  if (!uniqueIds(collections.map((collection) => collection.id))) {
    return { ok: false, error: "Two cash lines in this backup share an id." };
  }

  for (const item of priceRows) {
    const change = asRecord(item);
    const id = change ? asString(change.id) : null;
    const purchaseId = change ? asString(change.purchaseId) : null;
    const name = change ? asString(change.name) : null;
    const label = change && typeof change.label === "string" ? change.label : null;
    const detail = change && typeof change.detail === "string" ? change.detail : null;
    const fromPrice = change ? money(change.fromPrice) : null;
    const toPrice = change ? money(change.toPrice) : null;
    const at = change ? stamp(change.at) : null;
    if (!id || !purchaseId || !name || label == null || detail == null || fromPrice == null || toPrice == null || fromPrice === toPrice || !at) {
      return { ok: false, error: "A price change in this backup doesn't look right." };
    }
    if (!byId.has(purchaseId)) return { ok: false, error: "A price change in this backup doesn't match a buy." };
    priceChanges.push({ id, purchaseId, name, label, detail, fromPrice, toPrice, at });
  }
  if (!uniqueIds(priceChanges.map((change) => change.id))) {
    return { ok: false, error: "Two price changes in this backup share an id." };
  }

  return {
    ok: true,
    backup: {
      kind: BACKUP_KIND,
      version: 1,
      savedAt,
      appVersion: typeof row.appVersion === "string" ? row.appVersion : "",
      purchases,
      removals,
      collections,
      priceChanges,
    },
  };
}
