import { dayToIso, localDay } from "@/lib/stand/format";
import type {
  CashDraft,
  Collection,
  Kind,
  Purchase,
  PurchaseDraft,
  Removal,
  RemovalReason,
  TakeOffDraft,
} from "@/lib/stand/types";

export type FieldErrors = Partial<
  Record<"name" | "quantity" | "totalCost" | "sellPrice" | "day" | "note" | "amount" | "left" | "reason" | "form", string>
>;

const NAME_MAX = 80;
const NOTE_MAX = 200;
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

export function activePurchases(purchases: Purchase[], kind?: Kind | "all"): Purchase[] {
  return purchases
    .filter((purchase) => purchase.remaining > 0 && (kind == null || kind === "all" || purchase.kind === kind))
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
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

  if (parseQuantity(draft.quantity) == null) errors.quantity = "Enter how many, as a whole number.";
  if (parseMoney(draft.totalCost) == null) errors.totalCost = "Enter what you paid for the lot, like 24 or 24.50.";
  if (parseMoney(draft.sellPrice) == null) errors.sellPrice = "Enter the price for one, like 5 or 5.00.";
  if (parseDay(draft.day) == null) errors.day = "Pick the day you bought them.";
  else if (draft.day > localDay(now)) errors.day = "That day is still ahead.";

  const note = cleanNote(draft.note);
  if (note.error) errors.note = note.error;
  return errors;
}

export function purchaseFromDraft(
  draft: PurchaseDraft,
  id: string,
  now = new Date(),
): { ok: true; purchase: Purchase } | { ok: false; errors: FieldErrors } {
  const errors = validatePurchaseDraft(draft, now);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const quantity = parseQuantity(draft.quantity)!;
  const purchase: Purchase = {
    id,
    name: draft.name.trim(),
    kind: draft.kind,
    quantity,
    remaining: quantity,
    totalCost: parseMoney(draft.totalCost)!,
    sellPrice: parseMoney(draft.sellPrice)!,
    at: dayToIso(draft.day, now),
    note: draft.note.trim(),
  };
  return { ok: true, purchase };
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
      kind: draft.kind,
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
    kind: purchase.kind,
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
    kind: purchase.kind,
    quantity: String(purchase.quantity),
    totalCost: purchase.totalCost.toFixed(2),
    sellPrice: purchase.sellPrice.toFixed(2),
    day: localDay(new Date(purchase.at)),
    note: purchase.note,
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
  const header = ["when", "type", "name", "kind", "quantity", "money", "reason", "note", "id"];
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
          purchase.kind,
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
        [removal.at, "removed", removal.name, removal.kind, removal.quantity, "", removal.reason, removal.note, removal.id]
          .map(csvCell)
          .join(","),
      );
    } else {
      const collection = row.collection;
      lines.push(
        [collection.at, "cash", "", "", "", collection.amount.toFixed(2), "", collection.note, collection.id]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return lines.join("\n");
}
