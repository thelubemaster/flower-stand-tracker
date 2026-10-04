import type { StandBackup } from "@/lib/stand/backup";
import type { Collection, PriceChange, Purchase, Removal } from "@/lib/stand/types";

/** Example stand, already inside the app. Nothing to download. */
export const SAMPLE_BACKUP: StandBackup = {
  "kind": "flower-stand-backup",
  "version": 1,
  "savedAt": "2026-10-04T01:40:00.000Z",
  "appVersion": "1.9.3",
  "purchases": [
    {
      "detail": "Yellow",
      "partIndex": 0,
      "note": "First mum buy, split by color.",
      "id": "p-mum-yellow",
      "lotId": "lot-mums-sep",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 36,
      "remaining": 10,
      "totalCost": 126,
      "sellPrice": 4,
      "at": "2026-09-08T15:20:00.000Z"
    },
    {
      "detail": "Burgundy",
      "partIndex": 1,
      "note": "",
      "id": "p-mum-burgundy",
      "lotId": "lot-mums-sep",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 24,
      "remaining": 10,
      "totalCost": 84,
      "sellPrice": 6,
      "at": "2026-09-08T15:20:00.000Z"
    },
    {
      "detail": "Orange",
      "partIndex": 2,
      "note": "",
      "id": "p-mum-orange",
      "lotId": "lot-mums-sep",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 20,
      "remaining": 14,
      "totalCost": 70,
      "sellPrice": 6,
      "at": "2026-09-08T15:20:00.000Z"
    },
    {
      "detail": "White",
      "partIndex": 3,
      "note": "",
      "id": "p-mum-white",
      "lotId": "lot-mums-sep",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 16,
      "remaining": 7,
      "totalCost": 56,
      "sellPrice": 5,
      "at": "2026-09-08T15:20:00.000Z"
    },
    {
      "detail": "Purple",
      "partIndex": 4,
      "note": "",
      "id": "p-mum-purple",
      "lotId": "lot-mums-sep",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 22,
      "remaining": 0,
      "totalCost": 77,
      "sellPrice": 8,
      "at": "2026-09-08T15:20:00.000Z"
    },
    {
      "detail": "Pink",
      "partIndex": 0,
      "note": "Early bunch. A few died in the heat.",
      "id": "p-mum-pink",
      "lotId": "lot-mums-early",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 12,
      "remaining": 0,
      "totalCost": 48,
      "sellPrice": 7,
      "at": "2026-09-06T14:15:00.000Z"
    },
    {
      "detail": "Bronze",
      "partIndex": 0,
      "note": "Second mum buy.",
      "id": "p-mum-bronze",
      "lotId": "lot-mums-oct",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 18,
      "remaining": 18,
      "totalCost": 72,
      "sellPrice": 7,
      "at": "2026-10-01T13:40:00.000Z"
    },
    {
      "detail": "Red",
      "partIndex": 1,
      "note": "",
      "id": "p-mum-red",
      "lotId": "lot-mums-oct",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 12,
      "remaining": 8,
      "totalCost": 48,
      "sellPrice": 7,
      "at": "2026-10-01T13:40:00.000Z"
    },
    {
      "detail": "Mixed",
      "partIndex": 0,
      "note": "",
      "id": "p-zinnia",
      "lotId": "lot-zinnia",
      "name": "Zinnias",
      "label": "Flowers",
      "quantity": 15,
      "remaining": 0,
      "totalCost": 30,
      "sellPrice": 4,
      "at": "2026-09-06T14:30:00.000Z"
    },
    {
      "detail": "Red",
      "partIndex": 0,
      "note": "",
      "id": "p-celosia",
      "lotId": "lot-celosia",
      "name": "Celosia",
      "label": "Flowers",
      "quantity": 10,
      "remaining": 0,
      "totalCost": 25,
      "sellPrice": 5,
      "at": "2026-09-07T15:00:00.000Z"
    },
    {
      "detail": "Pink",
      "partIndex": 0,
      "note": "Raised the sign after the first weekend.",
      "id": "p-asters",
      "lotId": "lot-asters",
      "name": "Asters",
      "label": "Flowers",
      "quantity": 14,
      "remaining": 8,
      "totalCost": 42,
      "sellPrice": 9,
      "at": "2026-09-13T16:00:00.000Z"
    },
    {
      "detail": "",
      "partIndex": 0,
      "note": "",
      "id": "p-sun",
      "lotId": "lot-sun",
      "name": "Sunflowers",
      "label": "Flowers",
      "quantity": 18,
      "remaining": 6,
      "totalCost": 36,
      "sellPrice": 5,
      "at": "2026-09-14T19:00:00.000Z"
    },
    {
      "detail": "",
      "partIndex": 0,
      "note": "From the patch.",
      "id": "p-sugar",
      "lotId": "lot-sugar",
      "name": "Sugar pumpkins",
      "label": "Pumpkins",
      "quantity": 48,
      "remaining": 20,
      "totalCost": 96,
      "sellPrice": 5,
      "at": "2026-09-19T12:50:00.000Z"
    },
    {
      "detail": "",
      "partIndex": 0,
      "note": "",
      "id": "p-pie",
      "lotId": "lot-pie",
      "name": "Pie pumpkins",
      "label": "Pumpkins",
      "quantity": 36,
      "remaining": 25,
      "totalCost": 54,
      "sellPrice": 3,
      "at": "2026-09-19T13:00:00.000Z"
    },
    {
      "detail": "Mixed",
      "partIndex": 0,
      "note": "",
      "id": "p-gourds",
      "lotId": "lot-gourds",
      "name": "Gourds",
      "label": "Pumpkins",
      "quantity": 30,
      "remaining": 20,
      "totalCost": 45,
      "sellPrice": 2,
      "at": "2026-09-19T13:10:00.000Z"
    },
    {
      "detail": "White",
      "partIndex": 0,
      "note": "",
      "id": "p-boo",
      "lotId": "lot-boo",
      "name": "Baby Boo",
      "label": "Pumpkins",
      "quantity": 24,
      "remaining": 15,
      "totalCost": 48,
      "sellPrice": 4,
      "at": "2026-09-20T14:00:00.000Z"
    },
    {
      "detail": "",
      "partIndex": 0,
      "note": "Priced too high at first.",
      "id": "p-cinderella",
      "lotId": "lot-cinderella",
      "name": "Cinderella pumpkins",
      "label": "Pumpkins",
      "quantity": 10,
      "remaining": 0,
      "totalCost": 40,
      "sellPrice": 9,
      "at": "2026-09-19T13:30:00.000Z"
    },
    {
      "detail": "Orange",
      "partIndex": 0,
      "note": "",
      "id": "p-mini",
      "lotId": "lot-mini",
      "name": "Mini pumpkins",
      "label": "Pumpkins",
      "quantity": 28,
      "remaining": 0,
      "totalCost": 42,
      "sellPrice": 2,
      "at": "2026-09-22T18:00:00.000Z"
    },
    {
      "detail": "Bunches",
      "partIndex": 0,
      "note": "",
      "id": "p-kale",
      "lotId": "lot-kale",
      "name": "Kale",
      "label": "Plants",
      "quantity": 20,
      "remaining": 8,
      "totalCost": 40,
      "sellPrice": 4,
      "at": "2026-09-10T15:00:00.000Z"
    },
    {
      "detail": "",
      "partIndex": 0,
      "note": "Bundles of three.",
      "id": "p-corn",
      "lotId": "lot-corn",
      "name": "Corn stalks",
      "label": "Plants",
      "quantity": 24,
      "remaining": 8,
      "totalCost": 72,
      "sellPrice": 6,
      "at": "2026-09-09T20:00:00.000Z"
    },
    {
      "detail": "",
      "partIndex": 0,
      "note": "",
      "id": "p-indian",
      "lotId": "lot-indian",
      "name": "Indian corn",
      "label": "Plants",
      "quantity": 18,
      "remaining": 0,
      "totalCost": 36,
      "sellPrice": 4,
      "at": "2026-09-18T17:00:00.000Z"
    },
    {
      "detail": "Purple",
      "partIndex": 0,
      "note": "",
      "id": "p-okale",
      "lotId": "lot-okale",
      "name": "Ornamental kale",
      "label": "Plants",
      "quantity": 8,
      "remaining": 0,
      "totalCost": 24,
      "sellPrice": 6,
      "at": "2026-09-11T16:00:00.000Z"
    },
    {
      "detail": "",
      "partIndex": 0,
      "note": "",
      "id": "p-straw",
      "lotId": "lot-straw",
      "name": "Straw bales",
      "label": "Decor",
      "quantity": 16,
      "remaining": 9,
      "totalCost": 64,
      "sellPrice": 8,
      "at": "2026-09-12T19:00:00.000Z"
    },
    {
      "detail": "",
      "partIndex": 0,
      "note": "",
      "id": "p-hay",
      "lotId": "lot-hay",
      "name": "Hay bundles",
      "label": "Decor",
      "quantity": 14,
      "remaining": 0,
      "totalCost": 28,
      "sellPrice": 5,
      "at": "2026-09-06T19:00:00.000Z"
    },
    {
      "detail": "Bundles",
      "partIndex": 0,
      "note": "New this week. None counted off yet.",
      "id": "p-broom",
      "lotId": "lot-broom",
      "name": "Broom corn",
      "label": "Decor",
      "quantity": 10,
      "remaining": 10,
      "totalCost": 30,
      "sellPrice": 6,
      "at": "2026-09-27T15:00:00.000Z"
    }
  ],
  "removals": [
    {
      "detail": "Pink",
      "note": "Four were left.",
      "id": "r-pink-sold",
      "purchaseId": "p-mum-pink",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 8,
      "reason": "ran-out",
      "at": "2026-09-18T23:00:00.000Z"
    },
    {
      "detail": "Pink",
      "note": "Four were left.",
      "id": "r-pink-dead",
      "purchaseId": "p-mum-pink",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 4,
      "reason": "dead",
      "at": "2026-09-18T23:00:00.000Z"
    },
    {
      "detail": "Mixed",
      "note": "Gone by the second weekend.",
      "id": "r-zinnia",
      "purchaseId": "p-zinnia",
      "name": "Zinnias",
      "label": "Flowers",
      "quantity": 15,
      "reason": "ran-out",
      "at": "2026-09-12T22:00:00.000Z"
    },
    {
      "detail": "",
      "note": "Two got wet.",
      "id": "r-hay-sold",
      "purchaseId": "p-hay",
      "name": "Hay bundles",
      "label": "Decor",
      "quantity": 12,
      "reason": "ran-out",
      "at": "2026-09-15T22:30:00.000Z"
    },
    {
      "detail": "",
      "note": "Two got wet.",
      "id": "r-hay-tossed",
      "purchaseId": "p-hay",
      "name": "Hay bundles",
      "label": "Decor",
      "quantity": 2,
      "reason": "tossed",
      "at": "2026-09-15T22:30:00.000Z"
    },
    {
      "detail": "Red",
      "note": "Three were mush.",
      "id": "r-celosia-sold",
      "purchaseId": "p-celosia",
      "name": "Celosia",
      "label": "Flowers",
      "quantity": 7,
      "reason": "ran-out",
      "at": "2026-09-16T21:00:00.000Z"
    },
    {
      "detail": "Red",
      "note": "Three were mush.",
      "id": "r-celosia-dead",
      "purchaseId": "p-celosia",
      "name": "Celosia",
      "label": "Flowers",
      "quantity": 3,
      "reason": "dead",
      "at": "2026-09-16T21:00:00.000Z"
    },
    {
      "detail": "",
      "note": "Counted 8 still out.",
      "id": "r-corn-count",
      "purchaseId": "p-corn",
      "name": "Corn stalks",
      "label": "Plants",
      "quantity": 16,
      "reason": "counted",
      "at": "2026-09-21T23:00:00.000Z"
    },
    {
      "detail": "Purple",
      "note": "",
      "id": "r-okale",
      "purchaseId": "p-okale",
      "name": "Ornamental kale",
      "label": "Plants",
      "quantity": 8,
      "reason": "ran-out",
      "at": "2026-09-23T22:00:00.000Z"
    },
    {
      "detail": "Pink",
      "note": "Counted 8 still out.",
      "id": "r-asters",
      "purchaseId": "p-asters",
      "name": "Asters",
      "label": "Flowers",
      "quantity": 6,
      "reason": "counted",
      "at": "2026-09-25T23:10:00.000Z"
    },
    {
      "detail": "Purple",
      "note": "Sold out over the weekend.",
      "id": "r-purple",
      "purchaseId": "p-mum-purple",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 22,
      "reason": "ran-out",
      "at": "2026-09-26T23:00:00.000Z"
    },
    {
      "detail": "Mixed",
      "note": "Counted 20 still out.",
      "id": "r-gourds",
      "purchaseId": "p-gourds",
      "name": "Gourds",
      "label": "Pumpkins",
      "quantity": 10,
      "reason": "counted",
      "at": "2026-09-26T23:20:00.000Z"
    },
    {
      "detail": "Yellow",
      "note": "Weekend count.",
      "id": "r-yellow-1",
      "purchaseId": "p-mum-yellow",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 18,
      "reason": "counted",
      "at": "2026-09-27T22:00:00.000Z"
    },
    {
      "detail": "",
      "note": "Counted 9 still out.",
      "id": "r-straw",
      "purchaseId": "p-straw",
      "name": "Straw bales",
      "label": "Decor",
      "quantity": 7,
      "reason": "counted",
      "at": "2026-09-27T22:15:00.000Z"
    },
    {
      "detail": "Bunches",
      "note": "Counted 8 still out.",
      "id": "r-kale",
      "purchaseId": "p-kale",
      "name": "Kale",
      "label": "Plants",
      "quantity": 12,
      "reason": "counted",
      "at": "2026-09-28T21:40:00.000Z"
    },
    {
      "detail": "",
      "note": "Counted 28 still out.",
      "id": "r-sugar-1",
      "purchaseId": "p-sugar",
      "name": "Sugar pumpkins",
      "label": "Pumpkins",
      "quantity": 20,
      "reason": "counted",
      "at": "2026-09-29T22:00:00.000Z"
    },
    {
      "detail": "",
      "note": "",
      "id": "r-cinderella",
      "purchaseId": "p-cinderella",
      "name": "Cinderella pumpkins",
      "label": "Pumpkins",
      "quantity": 10,
      "reason": "ran-out",
      "at": "2026-09-29T22:30:00.000Z"
    },
    {
      "detail": "Burgundy",
      "note": "Counted 10 still out.",
      "id": "r-burgundy",
      "purchaseId": "p-mum-burgundy",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 14,
      "reason": "counted",
      "at": "2026-09-30T23:00:00.000Z"
    },
    {
      "detail": "Orange",
      "note": "Counted 14 still out.",
      "id": "r-orange",
      "purchaseId": "p-mum-orange",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 6,
      "reason": "counted",
      "at": "2026-10-01T22:00:00.000Z"
    },
    {
      "detail": "",
      "note": "Counted 25 still out.",
      "id": "r-pie",
      "purchaseId": "p-pie",
      "name": "Pie pumpkins",
      "label": "Pumpkins",
      "quantity": 11,
      "reason": "counted",
      "at": "2026-10-01T22:20:00.000Z"
    },
    {
      "detail": "White",
      "note": "Counted 7 still out.",
      "id": "r-white",
      "purchaseId": "p-mum-white",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 9,
      "reason": "counted",
      "at": "2026-10-02T21:50:00.000Z"
    },
    {
      "detail": "",
      "note": "Counted 6 still out.",
      "id": "r-sun",
      "purchaseId": "p-sun",
      "name": "Sunflowers",
      "label": "Flowers",
      "quantity": 12,
      "reason": "counted",
      "at": "2026-10-02T22:00:00.000Z"
    },
    {
      "detail": "White",
      "note": "Counted 15 still out.",
      "id": "r-boo",
      "purchaseId": "p-boo",
      "name": "Baby Boo",
      "label": "Pumpkins",
      "quantity": 9,
      "reason": "counted",
      "at": "2026-10-02T22:10:00.000Z"
    },
    {
      "detail": "Orange",
      "note": "Six were soft.",
      "id": "r-mini-sold",
      "purchaseId": "p-mini",
      "name": "Mini pumpkins",
      "label": "Pumpkins",
      "quantity": 22,
      "reason": "ran-out",
      "at": "2026-10-02T23:00:00.000Z"
    },
    {
      "detail": "Orange",
      "note": "Six were soft.",
      "id": "r-mini-tossed",
      "purchaseId": "p-mini",
      "name": "Mini pumpkins",
      "label": "Pumpkins",
      "quantity": 6,
      "reason": "tossed",
      "at": "2026-10-02T23:00:00.000Z"
    },
    {
      "detail": "Yellow",
      "note": "Evening count. 10 still out.",
      "id": "r-yellow-today",
      "purchaseId": "p-mum-yellow",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 8,
      "reason": "counted",
      "at": "2026-10-04T00:10:00.000Z"
    },
    {
      "detail": "Red",
      "note": "Counted 8 still out.",
      "id": "r-red-today",
      "purchaseId": "p-mum-red",
      "name": "Mums",
      "label": "Flowers",
      "quantity": 4,
      "reason": "counted",
      "at": "2026-10-04T00:20:00.000Z"
    },
    {
      "detail": "",
      "note": "Counted 20 still out.",
      "id": "r-sugar-today",
      "purchaseId": "p-sugar",
      "name": "Sugar pumpkins",
      "label": "Pumpkins",
      "quantity": 8,
      "reason": "counted",
      "at": "2026-10-04T00:35:00.000Z"
    },
    {
      "detail": "",
      "note": "Pulled the last of them.",
      "id": "r-indian-sold",
      "purchaseId": "p-indian",
      "name": "Indian corn",
      "label": "Plants",
      "quantity": 15,
      "reason": "ran-out",
      "at": "2026-10-04T00:50:00.000Z"
    },
    {
      "detail": "",
      "note": "Pulled the last of them.",
      "id": "r-indian-tossed",
      "purchaseId": "p-indian",
      "name": "Indian corn",
      "label": "Plants",
      "quantity": 3,
      "reason": "tossed",
      "at": "2026-10-04T00:50:00.000Z"
    }
  ],
  "collections": [
    {
      "id": "cash-2026-09-06",
      "amount": 78,
      "at": "2026-09-06T23:15:00.000Z",
      "note": "Sunday after church"
    },
    {
      "id": "cash-2026-09-07",
      "amount": 27,
      "at": "2026-09-07T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-08",
      "amount": 24,
      "at": "2026-09-08T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-09",
      "amount": 35,
      "at": "2026-09-09T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-10",
      "amount": 44,
      "at": "2026-09-10T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-11",
      "amount": 70,
      "at": "2026-09-11T23:15:00.000Z",
      "note": "Friday rush"
    },
    {
      "id": "cash-2026-09-12",
      "amount": 127,
      "at": "2026-09-13T00:15:00.000Z",
      "note": "Saturday jar"
    },
    {
      "id": "cash-2026-09-13",
      "amount": 84,
      "at": "2026-09-13T23:15:00.000Z",
      "note": "Sunday after church"
    },
    {
      "id": "cash-2026-09-14",
      "amount": 33,
      "at": "2026-09-14T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-15",
      "amount": 12,
      "at": "2026-09-15T23:15:00.000Z",
      "note": "Rainy, slow"
    },
    {
      "id": "cash-2026-09-16",
      "amount": 26,
      "at": "2026-09-16T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-17",
      "amount": 35,
      "at": "2026-09-17T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-18",
      "amount": 76,
      "at": "2026-09-18T23:15:00.000Z",
      "note": "Friday rush"
    },
    {
      "id": "cash-2026-09-19",
      "amount": 133,
      "at": "2026-09-20T00:15:00.000Z",
      "note": "Saturday jar"
    },
    {
      "id": "cash-2026-09-20",
      "amount": 90,
      "at": "2026-09-20T23:15:00.000Z",
      "note": "Sunday after church"
    },
    {
      "id": "cash-2026-09-21",
      "amount": 24,
      "at": "2026-09-21T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-22",
      "amount": 12,
      "at": "2026-09-22T23:15:00.000Z",
      "note": "Rainy, slow"
    },
    {
      "id": "cash-2026-09-23",
      "amount": 32,
      "at": "2026-09-23T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-24",
      "amount": 41,
      "at": "2026-09-24T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-25",
      "amount": 82,
      "at": "2026-09-25T23:15:00.000Z",
      "note": "Friday rush"
    },
    {
      "id": "cash-2026-09-26",
      "amount": 124,
      "at": "2026-09-27T00:15:00.000Z",
      "note": "Saturday jar"
    },
    {
      "id": "cash-2026-09-27",
      "amount": 81,
      "at": "2026-09-27T23:15:00.000Z",
      "note": "Sunday after church"
    },
    {
      "id": "cash-2026-09-28",
      "amount": 30,
      "at": "2026-09-28T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-29",
      "amount": 27,
      "at": "2026-09-29T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-09-30",
      "amount": 38,
      "at": "2026-09-30T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-10-01",
      "amount": 32,
      "at": "2026-10-01T23:15:00.000Z",
      "note": ""
    },
    {
      "id": "cash-2026-10-02",
      "amount": 73,
      "at": "2026-10-02T23:15:00.000Z",
      "note": "Friday rush"
    },
    {
      "id": "cash-2026-10-03",
      "amount": 130,
      "at": "2026-10-04T00:15:00.000Z",
      "note": "Saturday jar"
    },
    {
      "id": "cash-tonight",
      "amount": 46,
      "at": "2026-10-04T01:15:00.000Z",
      "note": "Evening jar, not emptied yet"
    }
  ],
  "priceChanges": [
    {
      "detail": "Pink",
      "id": "pc-asters",
      "purchaseId": "p-asters",
      "name": "Asters",
      "label": "Flowers",
      "fromPrice": 8,
      "toPrice": 9,
      "reason": "",
      "at": "2026-09-14T22:00:00.000Z"
    },
    {
      "detail": "",
      "id": "pc-straw",
      "purchaseId": "p-straw",
      "name": "Straw bales",
      "label": "Decor",
      "fromPrice": 10,
      "toPrice": 8,
      "reason": "too-high",
      "at": "2026-09-19T21:00:00.000Z"
    },
    {
      "detail": "Mixed",
      "id": "pc-gourds-1",
      "purchaseId": "p-gourds",
      "name": "Gourds",
      "label": "Pumpkins",
      "fromPrice": 4,
      "toPrice": 3,
      "reason": "too-high",
      "at": "2026-09-20T20:00:00.000Z"
    },
    {
      "detail": "",
      "id": "pc-cinderella",
      "purchaseId": "p-cinderella",
      "name": "Cinderella pumpkins",
      "label": "Pumpkins",
      "fromPrice": 12,
      "toPrice": 9,
      "reason": "too-high",
      "at": "2026-09-21T19:00:00.000Z"
    },
    {
      "detail": "",
      "id": "pc-pie",
      "purchaseId": "p-pie",
      "name": "Pie pumpkins",
      "label": "Pumpkins",
      "fromPrice": 4,
      "toPrice": 3,
      "reason": "too-high",
      "at": "2026-09-22T20:00:00.000Z"
    },
    {
      "detail": "Yellow",
      "id": "pc-yellow-1",
      "purchaseId": "p-mum-yellow",
      "name": "Mums",
      "label": "Flowers",
      "fromPrice": 8,
      "toPrice": 6,
      "reason": "too-high",
      "at": "2026-09-24T21:00:00.000Z"
    },
    {
      "detail": "Burgundy",
      "id": "pc-burgundy",
      "purchaseId": "p-mum-burgundy",
      "name": "Mums",
      "label": "Flowers",
      "fromPrice": 8,
      "toPrice": 6,
      "reason": "too-high",
      "at": "2026-09-28T20:30:00.000Z"
    },
    {
      "detail": "Mixed",
      "id": "pc-gourds-2",
      "purchaseId": "p-gourds",
      "name": "Gourds",
      "label": "Pumpkins",
      "fromPrice": 3,
      "toPrice": 2,
      "reason": "season",
      "at": "2026-09-30T22:00:00.000Z"
    },
    {
      "detail": "White",
      "id": "pc-white",
      "purchaseId": "p-mum-white",
      "name": "Mums",
      "label": "Flowers",
      "fromPrice": 7,
      "toPrice": 5,
      "reason": "season",
      "at": "2026-10-02T21:00:00.000Z"
    },
    {
      "detail": "",
      "id": "pc-sun",
      "purchaseId": "p-sun",
      "name": "Sunflowers",
      "label": "Flowers",
      "fromPrice": 7,
      "toPrice": 5,
      "reason": "season",
      "at": "2026-10-02T21:30:00.000Z"
    },
    {
      "detail": "Yellow",
      "id": "pc-yellow-today",
      "purchaseId": "p-mum-yellow",
      "name": "Mums",
      "label": "Flowers",
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
