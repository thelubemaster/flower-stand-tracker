export type RemovalReason = "ran-out" | "tossed" | "dead";

export type PartDraft = {
  detail: string;
  quantity: string;
};

export type Purchase = {
  id: string;
  lotId: string;
  partIndex: number;
  name: string;
  label: string;
  detail: string;
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
  label: string;
  detail: string;
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
  label: string;
  detail: string;
  quantity: string;
  totalCost: string;
  sellPrice: string;
  day: string;
  note: string;
  parts: PartDraft[];
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
