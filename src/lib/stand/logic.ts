import { dayToIso, localDay } from "@/lib/stand/format";
import type {
  CashDraft,
  Collection,
  Purchase,
  PurchaseDraft,
  Removal,
  RemovalReason,
  TakeOffDraft,
} from "@/lib/stand/types";

export type FieldErrors = Partial<
  Record<"name" | "label" | "detail" | "quantity" | "totalCost" | "sellPrice" | "day" | "note" | "amount" | "left" | "reason" | "parts" | "form", string>
>;

const NAME_MAX = 80;
const LABEL_MAX = 40;
const DETAIL_MAX = 40;
const NOTE_MAX = 200;
const PART_MAX = 12;
const QTY_MAX = 100000;
const MONEY_MAX = 999999.99;

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function unitCost(purchase: Purchase): number {
  if (purchase.quantity <= 0) return 0;
  return purchase.totalCost / purchase.quantity;
}

export function piecesOnStand(purchases: Purchase[]): number {
  return purchases.reduce((sum, purchase) => sum + purchase.remaining, 0);
}

export function askingValue(purchases: Purchase[]): number {
  return purchases.reduce((sum, purchase) => sum + purchase.remaining * purchase.sellPrice, 0);
}

export function costStillOut(purchases: Purchase[]): number {
  return purchases.reduce((sum, purchase) => sum + purchase.remaining * unitCost(purchase), 0);
}

export function totalSpent(purchases: Purchase[]): number {
  return purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
}

export function totalCollected(collections: Collection[]): number {
  return collections.reduce((sum, collection) => sum + collection.amount, 0);
}

export function collectedOnDay(collections: Collection[], day = localDay()): number {
  return collections.reduce((sum, collection) => {
    const when = new Date(collection.at);
    if (Number.isNaN(when.getTime())) return sum;
    return localDay(when) === day ? sum + collection.amount : sum;
  }, 0);
}

export function activePurchases(purchases: Purchase[], label?: string | "all"): Purchase[] {
  return purchases
    .filter((purchase) => purchase.remaining > 0 && (label == null || label === "all" || purchase.label === label))
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at) || a.partIndex - b.partIndex || a.id.localeCompare(b.id));
}

export function clearedCount(purchases: Purchase[]): number {
  return purchases.filter((purchase) => purchase.remaining <= 0).length;
}

function parseQuantity(raw: string): number | null {
  const cleaned = raw.trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const quantity = Number(cleaned);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > QTY_MAX) return null;
  return quantity;
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0 || amount > MONEY_MAX) return null;
  return roundMoney(amount);
}

function parseDay(raw: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const parsed = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (localDay(parsed) !== raw) return null;
  return raw;
}

function cleanNote(raw: string): { note: string; error?: string } {
  const note = raw.trim();
  if (note.length > NOTE_MAX) return { note, error: `Keep the note under ${NOTE_MAX} characters.` };
  return { note };
}

export function validatePurchaseDraft(draft: PurchaseDraft, now = new Date()): FieldErrors {
  const errors: FieldErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Name what you bought.";
  else if (name.length > NAME_MAX) errors.name = `Keep the name under ${NAME_MAX} characters.`;

  const label = draft.label.trim();
  if (!label) errors.label = "Give it a label, like Flowers or Produce.";
  else if (label.length > LABEL_MAX) errors.label = `Keep the label under ${LABEL_MAX} characters.`;

  const detail = draft.detail.trim();
  if (detail.length > DETAIL_MAX) errors.detail = `Keep that under ${DETAIL_MAX} characters.`;

  const quantity = parseQuantity(draft.quantity);
  if (quantity == null) errors.quantity = "Enter how many, as a whole number.";
  if (parseMoney(draft.totalCost) == null) errors.totalCost = "Enter what you paid for the lot, like 24 or 24.50.";
  if (parseMoney(draft.sellPrice) == null) errors.sellPrice = "Enter the price for one, like 5 or 5.00.";
  if (parseDay(draft.day) == null) errors.day = "Pick the day you bought them.";
  else if (draft.day > localDay(now)) errors.day = "That day is still ahead.";

  const note = cleanNote(draft.note);
  if (note.error) errors.note = note.error;

  const parts = draft.parts.filter((part) => part.detail.trim() || part.quantity.trim());
  if (parts.length > PART_MAX) errors.parts = `Break it into ${PART_MAX} or fewer.`;
  if (parts.length > 0 && quantity != null && !errors.parts) {
    const seen = new Set<string>();
    let assigned = 0;
    for (const part of parts) {
      const partName = part.detail.trim();
      const partQty = parseQuantity(part.quantity);
      if (!partName || partName.length > DETAIL_MAX) {
        errors.parts = "Name each color or kind.";
        break;
      }
      const key = partName.toLowerCase();
      if (seen.has(key)) {
        errors.parts = `${partName} is listed twice.`;
        break;
      }
      seen.add(key);
      if (partQty == null) {
        errors.parts = `Enter how many ${partName}.`;
        break;
      }
      assigned += partQty;
    }
    if (!errors.parts && assigned !== quantity) {
      errors.parts = `Those add up to ${assigned}, not ${quantity}.`;
    }
  }
  return errors;
}

function splitCost(total: number, quantities: number[]): number[] {
  const sum = quantities.reduce((count, quantity) => count + quantity, 0);
  if (sum <= 0) return quantities.map(() => 0);
  const costs = quantities.map((quantity) => roundMoney((total * quantity) / sum));
  const drift = roundMoney(total - costs.reduce((count, cost) => count + cost, 0));
  costs[costs.length - 1] = roundMoney(costs[costs.length - 1] + drift);
  return costs;
}

export function purchasesFromDraft(
  draft: PurchaseDraft,
  makeId: () => string,
  now = new Date(),
): { ok: true; purchases: Purchase[] } | { ok: false; errors: FieldErrors } {
  const errors = validatePurchaseDraft(draft, now);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const parts = draft.parts.filter((part) => part.detail.trim() || part.quantity.trim());
  const totalCost = parseMoney(draft.totalCost)!;
  const sellPrice = parseMoney(draft.sellPrice)!;
  const at = dayToIso(draft.day, now);
  const note = draft.note.trim();
  const lotId = makeId();
  const shared = {
    lotId,
    name: draft.name.trim(),
    label: draft.label.trim(),
    sellPrice,
    at,
    note,
  };
  if (parts.length === 0) {
    const quantity = parseQuantity(draft.quantity)!;
    return {
      ok: true,
      purchases: [
        {
          ...shared,
          id: makeId(),
          partIndex: 0,
          detail: draft.detail.trim(),
          quantity,
          remaining: quantity,
          totalCost,
        },
      ],
    };
  }
  const quantities = parts.map((part) => parseQuantity(part.quantity)!);
  const costs = splitCost(totalCost, quantities);
  return {
    ok: true,
    purchases: parts.map((part, index) => ({
      ...shared,
      id: makeId(),
      partIndex: index,
      detail: part.detail.trim(),
      quantity: quantities[index],
      remaining: quantities[index],
      totalCost: costs[index],
    })),
  };
}

export function purchaseFromDraft(
  draft: PurchaseDraft,
  id: string,
  now = new Date(),
): { ok: true; purchase: Purchase } | { ok: false; errors: FieldErrors } {
  const built = purchasesFromDraft({ ...draft, parts: [] }, () => id, now);
  if (!built.ok) return built;
  return { ok: true, purchase: { ...built.purchases[0], id } };
}

export function revisePurchase(
  current: Purchase,
  draft: PurchaseDraft,
  now = new Date(),
): { ok: true; purchase: Purchase } | { ok: false; errors: FieldErrors } {
  const errors = validatePurchaseDraft(draft, now);
  const quantity = parseQuantity(draft.quantity);
  const alreadyOff = current.quantity - current.remaining;
  if (quantity != null && quantity < alreadyOff) {
    errors.quantity = `You already took ${alreadyOff} off. The lot can't be smaller than that.`;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const nextQuantity = quantity!;
  return {
    ok: true,
    purchase: {
      ...current,
      name: draft.name.trim(),
      label: draft.label.trim(),
      detail: draft.detail.trim(),
      quantity: nextQuantity,
      remaining: nextQuantity - alreadyOff,
      totalCost: parseMoney(draft.totalCost)!,
      sellPrice: parseMoney(draft.sellPrice)!,
      at: dayToIso(draft.day, now),
      note: draft.note.trim(),
    },
  };
}

export function validateCashDraft(draft: CashDraft, now = new Date()): FieldErrors {
  const errors: FieldErrors = {};
  const amount = parseMoney(draft.amount);
  if (amount == null || amount <= 0) errors.amount = "Enter how much you collected, more than zero.";
  if (parseDay(draft.day) == null) errors.day = "Pick the day you collected it.";
  else if (draft.day > localDay(now)) errors.day = "That day is still ahead.";
  const note = cleanNote(draft.note);
  if (note.error) errors.note = note.error;
  return errors;
}

export function collectionFromDraft(
  draft: CashDraft,
  id: string,
  now = new Date(),
): { ok: true; collection: Collection } | { ok: false; errors: FieldErrors } {
  const errors = validateCashDraft(draft, now);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    collection: {
      id,
      amount: parseMoney(draft.amount)!,
      at: dayToIso(draft.day, now),
      note: draft.note.trim(),
    },
  };
}

export function validateTakeOff(
  purchase: Purchase,
  draft: TakeOffDraft,
  now = new Date(),
): FieldErrors {
  const errors: FieldErrors = {};
  if (draft.outcome !== "sold-out" && draft.outcome !== "left") {
    errors.form = "Say if it sold out, or how many were left.";
  }
  if (draft.outcome === "left") {
    const left = parseQuantity(draft.left);
    if (left == null) errors.left = "Enter how many were left.";
    else if (left > purchase.remaining) {
      errors.left = `Only ${purchase.remaining} are still out. You bought ${purchase.quantity}.`;
    }
    if (draft.leftoverReason !== "tossed" && draft.leftoverReason !== "dead") {
      errors.reason = "Say if those left were tossed or dead.";
    }
  }
  if (parseDay(draft.day) == null) errors.day = "Pick the day they left the stand.";
  else if (draft.day > localDay(now)) errors.day = "That day is still ahead.";
  const note = cleanNote(draft.note);
  if (note.error) errors.note = note.error;
  return errors;
}

export function closeLotFromDraft(
  purchase: Purchase,
  draft: TakeOffDraft,
  ids: { soldOutId: string; leftoverId: string },
  now = new Date(),
):
  | { ok: true; purchase: Purchase; removals: Removal[] }
  | { ok: false; errors: FieldErrors } {
  const errors = validateTakeOff(purchase, draft, now);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const note = draft.note.trim();
  const at = dayToIso(draft.day, now);
  const base = {
    purchaseId: purchase.id,
    name: purchase.name,
    label: purchase.label,
    detail: purchase.detail,
    at,
    note,
  };
  const removals: Removal[] = [];
  if (draft.outcome === "sold-out") {
    removals.push({ ...base, id: ids.soldOutId, quantity: purchase.remaining, reason: "ran-out" });
  } else {
    const left = parseQuantity(draft.left)!;
    const sold = purchase.remaining - left;
    if (sold > 0) {
      removals.push({ ...base, id: ids.soldOutId, quantity: sold, reason: "ran-out" });
    }
    removals.push({ ...base, id: ids.leftoverId, quantity: left, reason: draft.leftoverReason });
  }
  return { ok: true, purchase: { ...purchase, remaining: 0 }, removals };
}

export function lotOutcome(purchase: Purchase, removals: Removal[]): string {
  if (purchase.remaining > 0) {
    return `${purchase.remaining} still on the stand of ${purchase.quantity} bought`;
  }
  const mine = removals.filter((removal) => removal.purchaseId === purchase.id);
  const sold = mine.filter((removal) => removal.reason === "ran-out").reduce((sum, removal) => sum + removal.quantity, 0);
  const tossed = mine.filter((removal) => removal.reason === "tossed").reduce((sum, removal) => sum + removal.quantity, 0);
  const dead = mine.filter((removal) => removal.reason === "dead").reduce((sum, removal) => sum + removal.quantity, 0);
  if (sold === purchase.quantity && tossed === 0 && dead === 0) {
    return `Sold out · bought ${purchase.quantity}`;
  }
  const parts: string[] = [];
  if (sold > 0) parts.push(`${sold} sold out`);
  if (tossed > 0) parts.push(`${tossed} tossed`);
  if (dead > 0) parts.push(`${dead} dead`);
  if (parts.length === 0) return `Off the stand · bought ${purchase.quantity}`;
  return `Bought ${purchase.quantity} · ${parts.join(" · ")}`;
}

export function restoreRemoval(
  purchase: Purchase,
  removal: Removal,
): { ok: true; purchase: Purchase } | { ok: false; error: string } {
  if (removal.purchaseId !== purchase.id) {
    return { ok: false, error: "That removal doesn't belong to this lot." };
  }
  const remaining = purchase.remaining + removal.quantity;
  if (remaining > purchase.quantity) {
    return { ok: false, error: "That would put more on the stand than you bought." };
  }
  return { ok: true, purchase: { ...purchase, remaining } };
}

export function draftFromPurchase(purchase: Purchase): PurchaseDraft {
  return {
    name: purchase.name,
    label: purchase.label,
    detail: purchase.detail,
    quantity: String(purchase.quantity),
    totalCost: purchase.totalCost.toFixed(2),
    sellPrice: purchase.sellPrice.toFixed(2),
    day: localDay(new Date(purchase.at)),
    note: purchase.note,
    parts: [],
  };
}

export const REMOVAL_REASONS: RemovalReason[] = ["ran-out", "tossed", "dead"];

export type LedgerFilter = "all" | "bought" | "removed" | "cash";

export type LedgerEntry =
  | { type: "bought"; at: string; id: string; purchase: Purchase }
  | { type: "removed"; at: string; id: string; removal: Removal }
  | { type: "cash"; at: string; id: string; collection: Collection };

export function buildLedger(
  purchases: Purchase[],
  removals: Removal[],
  collections: Collection[],
  filter: LedgerFilter,
): LedgerEntry[] {
  const rows: LedgerEntry[] = [];
  if (filter === "all" || filter === "bought") {
    for (const purchase of purchases) {
      rows.push({ type: "bought", at: purchase.at, id: `bought-${purchase.id}`, purchase });
    }
  }
  if (filter === "all" || filter === "removed") {
    for (const removal of removals) {
      rows.push({ type: "removed", at: removal.at, id: `removed-${removal.id}`, removal });
    }
  }
  if (filter === "all" || filter === "cash") {
    for (const collection of collections) {
      rows.push({ type: "cash", at: collection.at, id: `cash-${collection.id}`, collection });
    }
  }
  rows.sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
  return rows;
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function ledgerCsv(
  purchases: Purchase[],
  removals: Removal[],
  collections: Collection[],
): string {
  const header = ["when", "type", "name", "label", "detail", "quantity", "money", "reason", "note", "id"];
  const lines = [header.join(",")];
  const rows = buildLedger(purchases, removals, collections, "all");
  for (const row of rows) {
    if (row.type === "bought") {
      const purchase = row.purchase;
      lines.push(
        [
          purchase.at,
          "bought",
          purchase.name,
          purchase.label,
          purchase.detail,
          purchase.quantity,
          purchase.totalCost.toFixed(2),
          `sell ${purchase.sellPrice.toFixed(2)} each`,
          purchase.note,
          purchase.id,
        ]
          .map(csvCell)
          .join(","),
      );
    } else if (row.type === "removed") {
      const removal = row.removal;
      lines.push(
        [removal.at, "removed", removal.name, removal.label, removal.detail, removal.quantity, "", removal.reason, removal.note, removal.id]
          .map(csvCell)
          .join(","),
      );
    } else {
      const collection = row.collection;
      lines.push(
        [collection.at, "cash", "", "", "", "", collection.amount.toFixed(2), "", collection.note, collection.id]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return lines.join("\n");
}

const LEGACY_LABELS: Record<string, string> = {
  flower: "Flowers",
  plant: "Plants",
  pumpkin: "Pumpkins",
};

function asRecord(raw: unknown): Record<string, unknown> {
  return raw != null && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function upgradePurchase(raw: unknown): Purchase {
  const row = asRecord(raw);
  const legacy = asString(row.kind);
  const id = asString(row.id, "missing");
  return {
    id,
    lotId: asString(row.lotId, id),
    partIndex: asNumber(row.partIndex, 0),
    name: asString(row.name, "Untitled"),
    label: asString(row.label, LEGACY_LABELS[legacy] ?? (legacy || "Other")),
    detail: asString(row.detail),
    quantity: asNumber(row.quantity),
    remaining: asNumber(row.remaining),
    totalCost: asNumber(row.totalCost),
    sellPrice: asNumber(row.sellPrice),
    at: asString(row.at),
    note: asString(row.note),
  };
}

export function upgradeRemoval(raw: unknown): Removal {
  const row = asRecord(raw);
  const legacy = asString(row.kind);
  const reason = asString(row.reason, "ran-out");
  return {
    id: asString(row.id, "missing"),
    purchaseId: asString(row.purchaseId),
    name: asString(row.name, "Untitled"),
    label: asString(row.label, LEGACY_LABELS[legacy] ?? (legacy || "Other")),
    detail: asString(row.detail),
    quantity: asNumber(row.quantity),
    reason: reason === "tossed" || reason === "dead" ? reason : "ran-out",
    at: asString(row.at),
    note: asString(row.note),
  };
}
