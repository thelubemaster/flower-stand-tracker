export type Kind = "flower" | "plant" | "pumpkin";

export type RemovalReason = "ran-out" | "tossed" | "dead";

export type Purchase = {
  id: string;
  name: string;
  kind: Kind;
  quantity: number;
  remaining: number;
  totalCost: number;
  sellPrice: number;
  at: string;
  note: string;
};

export type Removal = {
  id: string;
  purchaseId: string;
  name: string;
  kind: Kind;
  quantity: number;
  reason: RemovalReason;
  at: string;
  note: string;
};

export type Collection = {
  id: string;
  amount: number;
  at: string;
  note: string;
};

export type PurchaseDraft = {
  name: string;
  kind: Kind;
  quantity: string;
  totalCost: string;
  sellPrice: string;
  day: string;
  note: string;
};

export type CashDraft = {
  amount: string;
  day: string;
  note: string;
};

export type TakeOffDraft = {
  outcome: "sold-out" | "left";
  left: string;
  leftoverReason: "tossed" | "dead";
  day: string;
  note: string;
};
