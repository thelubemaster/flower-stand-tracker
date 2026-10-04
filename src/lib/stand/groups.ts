import type { PriceChange, Purchase, Removal } from "@/lib/stand/types";

export type GroupPart = {
  purchase: Purchase;
  removals: Removal[];
  prices: PriceChange[];
};

/** One day you added this item. Colors from the same buy stay together. */
export type GroupAdd = {
  id: string;
  at: string;
  parts: GroupPart[];
};

export type GroupItem = {
  name: string;
  adds: GroupAdd[];
  bought: number;
  remaining: number;
  spent: number;
};

export type ItemGroup = {
  label: string;
  items: GroupItem[];
  bought: number;
  remaining: number;
  spent: number;
  adds: number;
};

function nameKey(name: string): string {
  const trimmed = name.trim().toLowerCase();
  return trimmed || "untitled";
}

function displayName(rows: Purchase[]): string {
  const sorted = rows.slice().sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
  return sorted[0]?.name.trim() || "Untitled";
}

function sum(rows: Purchase[], pick: (purchase: Purchase) => number): number {
  return rows.reduce((total, purchase) => total + pick(purchase), 0);
}

/** Every label, then each kind of item, then every date it was added. */
export function buildItemGroups(
  purchases: Purchase[],
  removals: Removal[],
  priceChanges: PriceChange[],
): ItemGroup[] {
  const byLabel = new Map<string, Purchase[]>();
  for (const purchase of purchases) {
    const label = purchase.label.trim() || "Other";
    const rows = byLabel.get(label) ?? [];
    rows.push(purchase);
    byLabel.set(label, rows);
  }

  const removalsByPurchase = new Map<string, Removal[]>();
  for (const removal of removals) {
    const rows = removalsByPurchase.get(removal.purchaseId) ?? [];
    rows.push(removal);
    removalsByPurchase.set(removal.purchaseId, rows);
  }
  const pricesByPurchase = new Map<string, PriceChange[]>();
  for (const change of priceChanges) {
    const rows = pricesByPurchase.get(change.purchaseId) ?? [];
    rows.push(change);
    pricesByPurchase.set(change.purchaseId, rows);
  }

  return [...byLabel.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, rows]) => {
      const byName = new Map<string, Purchase[]>();
      for (const purchase of rows) {
        const key = nameKey(purchase.name);
        const named = byName.get(key) ?? [];
        named.push(purchase);
        byName.set(key, named);
      }
      const items = [...byName.values()]
        .map((named) => {
          const byAdd = new Map<string, Purchase[]>();
          for (const purchase of named) {
            const key = purchase.lotId || purchase.id;
            const added = byAdd.get(key) ?? [];
            added.push(purchase);
            byAdd.set(key, added);
          }
          const adds = [...byAdd.entries()]
            .map(([id, parts]) => {
              const ordered = parts.slice().sort((a, b) => a.partIndex - b.partIndex || a.detail.localeCompare(b.detail));
              return {
                id,
                at: ordered.slice().sort((a, b) => a.at.localeCompare(b.at))[0]?.at ?? "",
                parts: ordered.map((purchase) => ({
                  purchase,
                  removals: (removalsByPurchase.get(purchase.id) ?? [])
                    .slice()
                    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)),
                  prices: (pricesByPurchase.get(purchase.id) ?? [])
                    .slice()
                    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)),
                })),
              };
            })
            .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
          return {
            name: displayName(named),
            adds,
            bought: sum(named, (purchase) => purchase.quantity),
            remaining: sum(named, (purchase) => purchase.remaining),
            spent: sum(named, (purchase) => purchase.totalCost),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      return {
        label,
        items,
        bought: sum(rows, (purchase) => purchase.quantity),
        remaining: sum(rows, (purchase) => purchase.remaining),
        spent: sum(rows, (purchase) => purchase.totalCost),
        adds: items.reduce((total, item) => total + item.adds.length, 0),
      };
    });
}
