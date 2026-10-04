import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  collectionFromDraft,
  purchasesFromDraft,
  closeLotFromDraft,
  countFromDraft,
  priceChangeFromAmount,
  restoreRemoval,
  revisePurchase,
  upgradePurchase,
  upgradeRemoval,
} from "@/lib/stand/logic";
import type { StandBackup } from "@/lib/stand/backup";
import type { CashDraft, Collection, CountDraft, PriceChange, Purchase, PurchaseDraft, Removal, TakeOffDraft } from "@/lib/stand/types";
import type { FieldErrors } from "@/lib/stand/logic";

type Result = { ok: true } | { ok: false; errors: FieldErrors } | { ok: false; error: string };

type StandState = {
  purchases: Purchase[];
  removals: Removal[];
  collections: Collection[];
  priceChanges: PriceChange[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  addPurchase: (draft: PurchaseDraft) => Result;
  updatePurchase: (id: string, draft: PurchaseDraft) => Result;
  deletePurchase: (id: string) => Result;
  takeOff: (purchaseId: string, draft: TakeOffDraft) => Result;
  updateCount: (purchaseId: string, draft: CountDraft) => Result;
  setPrice: (purchaseId: string, price: number) => Result;
  undoRemoval: (removalId: string) => Result;
  undoPrice: (changeId: string) => Result;
  logCollection: (draft: CashDraft) => Result;
  deleteCollection: (id: string) => Result;
  replaceBook: (backup: StandBackup) => Result;
};

function newId(): string {
  return crypto.randomUUID();
}

export const useStandStore = create<StandState>()(
  persist(
    (set, get) => ({
      purchases: [],
      removals: [],
      collections: [],
      priceChanges: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addPurchase: (draft) => {
        const built = purchasesFromDraft(draft, newId);
        if (!built.ok) return built;
        set({ purchases: [...built.purchases, ...get().purchases] });
        return { ok: true };
      },
      updatePurchase: (id, draft) => {
        const current = get().purchases.find((purchase) => purchase.id === id);
        if (!current) return { ok: false, error: "That lot is no longer in the book." };
        const revised = revisePurchase(current, draft);
        if (!revised.ok) return revised;
        set({
          purchases: get().purchases.map((purchase) => (purchase.id === id ? revised.purchase : purchase)),
          removals: get().removals.map((removal) =>
            removal.purchaseId === id
              ? { ...removal, name: revised.purchase.name, label: revised.purchase.label, detail: revised.purchase.detail }
              : removal,
          ),
        });
        return { ok: true };
      },
      deletePurchase: (id) => {
        const linked = get().removals.some((removal) => removal.purchaseId === id);
        if (linked) {
          return {
            ok: false,
            error: "This lot is already in the record. Take the rest off the stand instead of deleting it.",
          };
        }
        const exists = get().purchases.some((purchase) => purchase.id === id);
        if (!exists) return { ok: false, error: "That lot is no longer in the book." };
        set({
          purchases: get().purchases.filter((purchase) => purchase.id !== id),
          priceChanges: get().priceChanges.filter((change) => change.purchaseId !== id),
        });
        return { ok: true };
      },
      takeOff: (purchaseId, draft) => {
        const current = get().purchases.find((purchase) => purchase.id === purchaseId);
        if (!current) return { ok: false, error: "That lot is no longer on the stand." };
        const built = closeLotFromDraft(current, draft, { soldOutId: newId(), leftoverId: newId() });
        if (!built.ok) return built;
        set({
          purchases: get().purchases.map((purchase) => (purchase.id === purchaseId ? built.purchase : purchase)),
          removals: [...built.removals, ...get().removals],
        });
        return { ok: true };
      },
      updateCount: (purchaseId, draft) => {
        const current = get().purchases.find((purchase) => purchase.id === purchaseId);
        if (!current) return { ok: false, error: "That lot is no longer on the stand." };
        const built = countFromDraft(current, draft, newId());
        if (!built.ok) return built;
        set({
          purchases: get().purchases.map((purchase) => (purchase.id === purchaseId ? built.purchase : purchase)),
          removals: [built.removal, ...get().removals],
        });
        return { ok: true };
      },
      setPrice: (purchaseId, price) => {
        const current = get().purchases.find((purchase) => purchase.id === purchaseId);
        if (!current) return { ok: false, error: "That lot is no longer in the book." };
        const built = priceChangeFromAmount(current, price, newId());
        if (!built.ok) return built;
        set({
          purchases: get().purchases.map((purchase) => (purchase.id === purchaseId ? built.purchase : purchase)),
          priceChanges: [built.change, ...get().priceChanges],
        });
        return { ok: true };
      },
      undoRemoval: (removalId) => {
        const removal = get().removals.find((row) => row.id === removalId);
        if (!removal) return { ok: false, error: "That line is already gone." };
        const current = get().purchases.find((purchase) => purchase.id === removal.purchaseId);
        if (!current) return { ok: false, error: "The lot for that removal is missing." };
        const restored = restoreRemoval(current, removal);
        if (!restored.ok) return restored;
        set({
          purchases: get().purchases.map((purchase) =>
            purchase.id === current.id ? restored.purchase : purchase,
          ),
          removals: get().removals.filter((row) => row.id !== removalId),
        });
        return { ok: true };
      },
      undoPrice: (changeId) => {
        const change = get().priceChanges.find((row) => row.id === changeId);
        if (!change) return { ok: false, error: "That price change is already gone." };
        const later = get().priceChanges.some(
          (row) =>
            row.purchaseId === change.purchaseId &&
            row.id !== change.id &&
            (row.at > change.at || (row.at === change.at && row.id > change.id)),
        );
        if (later) return { ok: false, error: "A later price change is still in the book. Undo that one first." };
        const current = get().purchases.find((purchase) => purchase.id === change.purchaseId);
        if (!current) return { ok: false, error: "The lot for that price is missing." };
        if (current.sellPrice !== change.toPrice) {
          return { ok: false, error: "The sign price doesn't match this change anymore." };
        }
        set({
          purchases: get().purchases.map((purchase) =>
            purchase.id === current.id ? { ...purchase, sellPrice: change.fromPrice } : purchase,
          ),
          priceChanges: get().priceChanges.filter((row) => row.id !== changeId),
        });
        return { ok: true };
      },
      logCollection: (draft) => {
        const built = collectionFromDraft(draft, newId());
        if (!built.ok) return built;
        set({ collections: [built.collection, ...get().collections] });
        return { ok: true };
      },
      deleteCollection: (id) => {
        const exists = get().collections.some((collection) => collection.id === id);
        if (!exists) return { ok: false, error: "That cash line is already gone." };
        set({ collections: get().collections.filter((collection) => collection.id !== id) });
        return { ok: true };
      },
      replaceBook: (backup) => {
        set({
          purchases: backup.purchases,
          removals: backup.removals,
          collections: backup.collections,
          priceChanges: backup.priceChanges,
        });
        return { ok: true };
      },
    }),
    {
      name: "flower-stand-ledger-v1",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        purchases: state.purchases,
        removals: state.removals,
        collections: state.collections,
        priceChanges: state.priceChanges,
      }),
      migrate: (persisted) => {
        const data = (persisted ?? {}) as {
          purchases?: unknown[];
          removals?: unknown[];
          collections?: Collection[];
          priceChanges?: PriceChange[];
        };
        return {
          purchases: (data.purchases ?? []).map(upgradePurchase),
          removals: (data.removals ?? []).map(upgradeRemoval),
          collections: data.collections ?? [],
          priceChanges: Array.isArray(data.priceChanges) ? data.priceChanges : [],
        };
      },
      onRehydrateStorage: () => () => {
        useStandStore.getState().setHydrated(true);
      },
    },
  ),
);

export function rehydrateStand(): void {
  const pending = useStandStore.persist.rehydrate();
  if (pending == null) {
    useStandStore.getState().setHydrated(true);
    return;
  }
  void Promise.resolve(pending).catch(() => {
    useStandStore.getState().setHydrated(true);
  });
}
