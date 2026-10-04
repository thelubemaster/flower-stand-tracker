import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  collectionFromDraft,
  purchaseFromDraft,
  closeLotFromDraft,
  restoreRemoval,
  revisePurchase,
} from "@/lib/stand/logic";
import type { CashDraft, Collection, Purchase, PurchaseDraft, Removal, TakeOffDraft } from "@/lib/stand/types";
import type { FieldErrors } from "@/lib/stand/logic";

type Result = { ok: true } | { ok: false; errors: FieldErrors } | { ok: false; error: string };

type StandState = {
  purchases: Purchase[];
  removals: Removal[];
  collections: Collection[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  addPurchase: (draft: PurchaseDraft) => Result;
  updatePurchase: (id: string, draft: PurchaseDraft) => Result;
  deletePurchase: (id: string) => Result;
  takeOff: (purchaseId: string, draft: TakeOffDraft) => Result;
  undoRemoval: (removalId: string) => Result;
  logCollection: (draft: CashDraft) => Result;
  deleteCollection: (id: string) => Result;
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
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addPurchase: (draft) => {
        const built = purchaseFromDraft(draft, newId());
        if (!built.ok) return built;
        set({ purchases: [built.purchase, ...get().purchases] });
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
              ? { ...removal, name: revised.purchase.name, kind: revised.purchase.kind }
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
        set({ purchases: get().purchases.filter((purchase) => purchase.id !== id) });
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
    }),
    {
      name: "flower-stand-ledger-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        purchases: state.purchases,
        removals: state.removals,
        collections: state.collections,
      }),
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
