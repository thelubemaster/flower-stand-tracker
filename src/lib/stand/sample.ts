import type { StandBackup } from "@/lib/stand/backup";
import type { Collection, PriceChange, Purchase, Removal } from "@/lib/stand/types";

/** Example stand, already inside the app. Nothing to download. */
export const SAMPLE_BACKUP: StandBackup = {
  "kind": "flower-stand-backup",
  "version": 1,
  "savedAt": "2026-10-04T01:30:00.000Z",
  "appVersion": "1.9.1",
  "purchases": [
    {
      "id": "p-yellow",
      "lotId": "lot-mums",
      "partIndex": 0,
      "name": "Mums",
      "label": "Flowers",
      "detail": "Yellow",
      "quantity": 12,
      "remaining": 5,
      "totalCost": 48,
      "sellPrice": 4,
      "at": "2026-09-19T18:00:00.000Z",
      "note": "One mum buy, split by color."
    },
    {
      "id": "p-purple",
      "lotId": "lot-mums",
      "partIndex": 1,
      "name": "Mums",
      "label": "Flowers",
      "detail": "Purple",
      "quantity": 8,
      "remaining": 0,
      "totalCost": 32,
      "sellPrice": 8,
      "at": "2026-09-19T18:00:00.000Z",
      "note": ""
    },
    {
      "id": "p-white",
      "lotId": "lot-mums",
      "partIndex": 2,
      "name": "Mums",
      "label": "Flowers",
      "detail": "White",
      "quantity": 6,
      "remaining": 0,
      "totalCost": 24,
      "sellPrice": 7,
      "at": "2026-09-19T18:00:00.000Z",
      "note": ""
    },
    {
      "id": "p-pumpkins",
      "lotId": "lot-pumpkins",
      "partIndex": 0,
      "name": "Sugar pumpkins",
      "label": "Pumpkins",
      "detail": "",
      "quantity": 20,
      "remaining": 11,
      "totalCost": 60,
      "sellPrice": 5,
      "at": "2026-09-26T16:00:00.000Z",
      "note": "From the patch. No colors on this one."
    },
    {
      "id": "p-gourds",
      "lotId": "lot-gourds",
      "partIndex": 0,
      "name": "Gourds",
      "label": "Pumpkins",
      "detail": "Mixed",
      "quantity": 15,
      "remaining": 15,
      "totalCost": 30,
      "sellPrice": 2,
      "at": "2026-09-26T16:10:00.000Z",
      "note": ""
    },
    {
      "id": "p-asters",
      "lotId": "lot-asters",
      "partIndex": 0,
      "name": "Asters",
      "label": "Flowers",
      "detail": "Pink",
      "quantity": 4,
      "remaining": 4,
      "totalCost": 16,
      "sellPrice": 9,
      "at": "2026-09-21T15:00:00.000Z",
      "note": "Small try. Raised the sign after the first day."
    },
    {
      "id": "p-kale",
      "lotId": "lot-kale",
      "partIndex": 0,
      "name": "Kale",
      "label": "Plants",
      "detail": "Bunches",
      "quantity": 10,
      "remaining": 0,
      "totalCost": 25,
      "sellPrice": 4,
      "at": "2026-09-28T15:00:00.000Z",
      "note": ""
    },
    {
      "id": "p-corn",
      "lotId": "lot-corn",
      "partIndex": 0,
      "name": "Corn stalks",
      "label": "Plants",
      "detail": "",
      "quantity": 8,
      "remaining": 0,
      "totalCost": 24,
      "sellPrice": 6,
      "at": "2026-09-20T17:00:00.000Z",
      "note": "Bundles of three."
    }
  ],
  "removals": [
    {
      "id": "r-corn-out",
      "purchaseId": "p-corn",
      "name": "Corn stalks",
      "label": "Plants",
      "detail": "",
      "quantity": 8,
      "reason": "ran-out",
      "at": "2026-09-22T22:00:00.000Z",
      "note": "Gone by Monday."
    },
    {
      "id": "r-purple-out",
      "purchaseId": "p-purple",
      "name": "Mums",
      "label": "Flowers",
      "detail": "Purple",
      "quantity": 8,
      "reason": "ran-out",
      "at": "2026-09-25T21:00:00.000Z",
      "note": ""
    },
    {
      "id": "r-white-sold",
      "purchaseId": "p-white",
      "name": "Mums",
      "label": "Flowers",
      "detail": "White",
      "quantity": 4,
      "reason": "ran-out",
      "at": "2026-10-01T21:00:00.000Z",
      "note": "Two were left."
    },
    {
      "id": "r-white-dead",
      "purchaseId": "p-white",
      "name": "Mums",
      "label": "Flowers",
      "detail": "White",
      "quantity": 2,
      "reason": "dead",
      "at": "2026-10-01T21:00:00.000Z",
      "note": "Two were left."
    },
    {
      "id": "r-pump-count",
      "purchaseId": "p-pumpkins",
      "name": "Sugar pumpkins",
      "label": "Pumpkins",
      "detail": "",
      "quantity": 9,
      "reason": "counted",
      "at": "2026-10-02T22:30:00.000Z",
      "note": "Counted 11 still out."
    },
    {
      "id": "r-yellow-count",
      "purchaseId": "p-yellow",
      "name": "Mums",
      "label": "Flowers",
      "detail": "Yellow",
      "quantity": 7,
      "reason": "counted",
      "at": "2026-10-04T00:10:00.000Z",
      "note": "Counted 5 still out."
    },
    {
      "id": "r-kale-sold",
      "purchaseId": "p-kale",
      "name": "Kale",
      "label": "Plants",
      "detail": "Bunches",
      "quantity": 7,
      "reason": "ran-out",
      "at": "2026-10-04T00:40:00.000Z",
      "note": "Pulled the lot. Three were wilted."
    },
    {
      "id": "r-kale-tossed",
      "purchaseId": "p-kale",
      "name": "Kale",
      "label": "Plants",
      "detail": "Bunches",
      "quantity": 3,
      "reason": "tossed",
      "at": "2026-10-04T00:40:00.000Z",
      "note": "Pulled the lot. Three were wilted."
    }
  ],
  "collections": [
    {
      "id": "c-sep20",
      "amount": 42,
      "at": "2026-09-20T22:00:00.000Z",
      "note": "Saturday jar"
    },
    {
      "id": "c-sep21",
      "amount": 18,
      "at": "2026-09-21T21:00:00.000Z",
      "note": ""
    },
    {
      "id": "c-sep26",
      "amount": 63,
      "at": "2026-09-26T22:15:00.000Z",
      "note": "Busy afternoon"
    },
    {
      "id": "c-sep27",
      "amount": 27,
      "at": "2026-09-27T21:40:00.000Z",
      "note": ""
    },
    {
      "id": "c-oct1",
      "amount": 35,
      "at": "2026-10-01T22:00:00.000Z",
      "note": ""
    },
    {
      "id": "c-oct2",
      "amount": 48,
      "at": "2026-10-02T22:10:00.000Z",
      "note": "Friday"
    },
    {
      "id": "c-oct3",
      "amount": 22,
      "at": "2026-10-04T01:20:00.000Z",
      "note": "Evening jar"
    }
  ],
  "priceChanges": [
    {
      "id": "pc-asters",
      "purchaseId": "p-asters",
      "name": "Asters",
      "label": "Flowers",
      "detail": "Pink",
      "fromPrice": 8,
      "toPrice": 9,
      "reason": "",
      "at": "2026-09-21T20:00:00.000Z"
    },
    {
      "id": "pc-yellow-high",
      "purchaseId": "p-yellow",
      "name": "Mums",
      "label": "Flowers",
      "detail": "Yellow",
      "fromPrice": 8,
      "toPrice": 6,
      "reason": "too-high",
      "at": "2026-09-26T19:00:00.000Z"
    },
    {
      "id": "pc-gourds",
      "purchaseId": "p-gourds",
      "name": "Gourds",
      "label": "Pumpkins",
      "detail": "Mixed",
      "fromPrice": 3,
      "toPrice": 2,
      "reason": "season",
      "at": "2026-09-30T21:00:00.000Z"
    },
    {
      "id": "pc-yellow-season",
      "purchaseId": "p-yellow",
      "name": "Mums",
      "label": "Flowers",
      "detail": "Yellow",
      "fromPrice": 6,
      "toPrice": 4,
      "reason": "season",
      "at": "2026-10-04T01:05:00.000Z"
    }
  ]
};

function sameIds(rows: { id: string }[], sample: { id: string }[]): boolean {
  if (rows.length !== sample.length) return false;
  const ids = new Set(sample.map((row) => row.id));
  return rows.every((row) => ids.has(row.id));
}

/** True when this phone is still showing the built-in example, even if a count or price was tapped. */
export function isSampleStand(
  purchases: Purchase[],
  removals: Removal[],
  collections: Collection[],
  priceChanges: PriceChange[],
): boolean {
  return (
    sameIds(purchases, SAMPLE_BACKUP.purchases) &&
    sameIds(removals, SAMPLE_BACKUP.removals) &&
    sameIds(collections, SAMPLE_BACKUP.collections) &&
    sameIds(priceChanges, SAMPLE_BACKUP.priceChanges)
  );
}
