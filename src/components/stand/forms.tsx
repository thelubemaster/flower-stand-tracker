import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { APP_SOURCE_URL, APP_VERSION } from "@/lib/version";
import { formatMoney, kindTitle, localDay } from "@/lib/stand/format";
import { draftFromPurchase } from "@/lib/stand/logic";
import type { FieldErrors } from "@/lib/stand/logic";
import { useStandStore } from "@/lib/stand/store";
import type { CashDraft, Kind, PurchaseDraft, TakeOffDraft } from "@/lib/stand/types";
import { Choice, Field, PressButton, Sheet, TextControl, AreaControl } from "@/components/stand/ui";

const KINDS: Kind[] = ["flower", "plant", "pumpkin"];

function emptyPurchase(): PurchaseDraft {
  return {
    name: "",
    kind: "flower",
    quantity: "",
    totalCost: "",
    sellPrice: "",
    day: localDay(),
    note: "",
  };
}

function failure(result: { ok: true } | { ok: false; errors?: FieldErrors; error?: string }): FieldErrors | null {
  if (result.ok) return null;
  if ("errors" in result && result.errors) return result.errors;
  return { form: result.error ?? "That didn't save." };
}

export function BuySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addPurchase = useStandStore((state) => state.addPurchase);
  const [draft, setDraft] = useState<PurchaseDraft>(emptyPurchase);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setDraft(emptyPurchase());
    setErrors({});
  }, [open]);

  const paidEach = paidEachPreview(draft);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add to the stand"
      description="A bunch, a flat, or a crate. This stays in the record even after it sells out."
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const result = addPurchase(draft);
          const next = failure(result);
          if (next) {
            setErrors(next);
            return;
          }
          onOpenChange(false);
        }}
      >
        <KindField kind={draft.kind} onChange={(kind) => setDraft({ ...draft, kind })} />
        <Field label="What is it?" error={errors.name}>
          <TextControl
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Sunflowers"
            autoComplete="off"
          />
        </Field>
        <Field label="How many" error={errors.quantity}>
          <TextControl
            inputMode="numeric"
            value={draft.quantity}
            onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
            placeholder="24"
          />
        </Field>
        <Field label="Paid for the lot" error={errors.totalCost} hint={paidEach}>
          <TextControl
            inputMode="decimal"
            value={draft.totalCost}
            onChange={(event) => setDraft({ ...draft, totalCost: event.target.value })}
            placeholder="36.00"
          />
        </Field>
        <Field label="Selling each for" error={errors.sellPrice}>
          <TextControl
            inputMode="decimal"
            value={draft.sellPrice}
            onChange={(event) => setDraft({ ...draft, sellPrice: event.target.value })}
            placeholder="5.00"
          />
        </Field>
        <Field label="Day bought" error={errors.day}>
          <TextControl
            type="date"
            value={draft.day}
            max={localDay()}
            onChange={(event) => setDraft({ ...draft, day: event.target.value })}
          />
        </Field>
        <Field label="Note" error={errors.note}>
          <AreaControl
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
            placeholder="Optional. Wholesale barn, or the neighbor's patch."
          />
        </Field>
        {errors.form ? (
          <p className="text-sm text-clay" role="alert">
            {errors.form}
          </p>
        ) : null}
        <PressButton type="submit" className="w-full">
          Put on the stand
        </PressButton>
      </form>
    </Sheet>
  );
}

export function EditSheet({
  purchaseId,
  onOpenChange,
}: {
  purchaseId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const purchase = useStandStore((state) => state.purchases.find((row) => row.id === purchaseId));
  const updatePurchase = useStandStore((state) => state.updatePurchase);
  const deletePurchase = useStandStore((state) => state.deletePurchase);
  const [draft, setDraft] = useState<PurchaseDraft>(emptyPurchase);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!purchase) return;
    setDraft(draftFromPurchase(purchase));
    setErrors({});
    setConfirmDelete(false);
  }, [purchase]);

  const open = purchaseId != null && purchase != null;
  const alreadyOff = purchase ? purchase.quantity - purchase.remaining : 0;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Fix this lot"
      description="Correct a name, a price, or the count. The record keeps what already left the stand."
    >
      {purchase ? (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const result = updatePurchase(purchase.id, draft);
            const next = failure(result);
            if (next) {
              setErrors(next);
              return;
            }
            onOpenChange(false);
          }}
        >
          <KindField kind={draft.kind} onChange={(kind) => setDraft({ ...draft, kind })} />
          <Field label="What is it?" error={errors.name}>
            <TextControl
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </Field>
          <Field
            label="How many you bought"
            error={errors.quantity}
            hint={alreadyOff > 0 ? `${alreadyOff} already left the stand.` : undefined}
          >
            <TextControl
              inputMode="numeric"
              value={draft.quantity}
              onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
            />
          </Field>
          <Field label="Paid for the lot" error={errors.totalCost} hint={paidEachPreview(draft)}>
            <TextControl
              inputMode="decimal"
              value={draft.totalCost}
              onChange={(event) => setDraft({ ...draft, totalCost: event.target.value })}
            />
          </Field>
          <Field label="Selling each for" error={errors.sellPrice}>
            <TextControl
              inputMode="decimal"
              value={draft.sellPrice}
              onChange={(event) => setDraft({ ...draft, sellPrice: event.target.value })}
            />
          </Field>
          <Field label="Day bought" error={errors.day}>
            <TextControl
              type="date"
              value={draft.day}
              max={localDay()}
              onChange={(event) => setDraft({ ...draft, day: event.target.value })}
            />
          </Field>
          <Field label="Note" error={errors.note}>
            <AreaControl value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />
          </Field>
          {errors.form ? (
            <p className="text-sm text-clay" role="alert">
              {errors.form}
            </p>
          ) : null}
          <PressButton type="submit" className="w-full">
            Save the lot
          </PressButton>
          {alreadyOff === 0 ? (
            confirmDelete ? (
              <PressButton
                variant="quiet"
                className="w-full text-clay"
                onClick={() => {
                  const result = deletePurchase(purchase.id);
                  if (!result.ok) {
                    setErrors(failure(result) ?? { form: "Couldn't remove that lot." });
                    return;
                  }
                  onOpenChange(false);
                }}
              >
                Yes, remove this unused lot
              </PressButton>
            ) : (
              <PressButton variant="ghost" className="w-full text-clay" onClick={() => setConfirmDelete(true)}>
                Remove this unused lot
              </PressButton>
            )
          ) : null}
        </form>
      ) : null}
    </Sheet>
  );
}

export function TakeOffSheet({
  purchaseId,
  onOpenChange,
}: {
  purchaseId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const purchase = useStandStore((state) => state.purchases.find((row) => row.id === purchaseId));
  const takeOff = useStandStore((state) => state.takeOff);
  const [draft, setDraft] = useState<TakeOffDraft>({
    outcome: "sold-out",
    left: "1",
    leftoverReason: "tossed",
    day: localDay(),
    note: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!purchase || purchase.remaining < 1) return;
    setDraft({
      outcome: "sold-out",
      left: "1",
      leftoverReason: "tossed",
      day: localDay(),
      note: "",
    });
    setErrors({});
  }, [purchase]);

  const open = purchaseId != null && purchase != null && purchase.remaining > 0;
  const leftCount = /^\d+$/.test(draft.left.trim()) ? Number(draft.left) : null;
  const soldCount =
    purchase && leftCount != null ? Math.max(0, purchase.remaining - leftCount) : null;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Take off the stand"
      description="The lot leaves the active list. You already logged how many you bought."
    >
      {purchase ? (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const result = takeOff(purchase.id, draft);
            const next = failure(result);
            if (next) {
              setErrors(next);
              return;
            }
            onOpenChange(false);
          }}
        >
          <p className="text-sm text-pretty text-muted">
            <span className="font-medium text-ink">{purchase.name}</span>
            {` · you bought ${purchase.quantity}`}
            {purchase.remaining === purchase.quantity
              ? `. All ${purchase.remaining} are still out.`
              : `. ${purchase.remaining} are still out.`}
          </p>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">What happened</legend>
            <div className="grid grid-cols-2 gap-2">
              <Choice
                selected={draft.outcome === "sold-out"}
                onClick={() => setDraft({ ...draft, outcome: "sold-out" })}
              >
                Sold out
              </Choice>
              <Choice selected={draft.outcome === "left"} onClick={() => setDraft({ ...draft, outcome: "left" })}>
                Some left
              </Choice>
            </div>
          </fieldset>
          {draft.outcome === "sold-out" ? (
            <p className="text-sm text-pretty text-muted">
              All {purchase.remaining} still out count as sold out. Cash still goes in the jar, not here.
            </p>
          ) : (
            <>
              <Field label="How many were left" error={errors.left}>
                <div className="flex items-center gap-2">
                  <PressButton
                    variant="quiet"
                    className="size-12 px-0"
                    aria-label="Fewer left"
                    onClick={() =>
                      setDraft({ ...draft, left: stepQuantity(draft.left, -1, purchase.remaining) })
                    }
                  >
                    <Minus className="size-5" aria-hidden />
                  </PressButton>
                  <TextControl
                    className="text-center tabular-nums"
                    inputMode="numeric"
                    value={draft.left}
                    onChange={(event) => setDraft({ ...draft, left: event.target.value })}
                  />
                  <PressButton
                    variant="quiet"
                    className="size-12 px-0"
                    aria-label="More left"
                    onClick={() =>
                      setDraft({ ...draft, left: stepQuantity(draft.left, 1, purchase.remaining) })
                    }
                  >
                    <Plus className="size-5" aria-hidden />
                  </PressButton>
                </div>
              </Field>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Those left were</legend>
                <div className="grid grid-cols-2 gap-2">
                  <Choice
                    selected={draft.leftoverReason === "tossed"}
                    onClick={() => setDraft({ ...draft, leftoverReason: "tossed" })}
                  >
                    Tossed
                  </Choice>
                  <Choice
                    selected={draft.leftoverReason === "dead"}
                    onClick={() => setDraft({ ...draft, leftoverReason: "dead" })}
                  >
                    Dead
                  </Choice>
                </div>
                {errors.reason ? (
                  <p className="mt-2 text-sm text-clay" role="alert">
                    {errors.reason}
                  </p>
                ) : null}
              </fieldset>
              <p className="text-sm text-pretty text-muted">
                {leftCount == null || leftCount < 1 || leftCount > purchase.remaining
                  ? "Say how many were still there when you pulled it."
                  : soldCount === 0
                    ? `All ${leftCount} still out count as ${draft.leftoverReason}.`
                    : `${leftCount} ${draft.leftoverReason}. The other ${soldCount} count as sold out.`}
              </p>
            </>
          )}
          <Field label="Day" error={errors.day}>
            <TextControl
              type="date"
              value={draft.day}
              max={localDay()}
              onChange={(event) => setDraft({ ...draft, day: event.target.value })}
            />
          </Field>
          <Field label="Note" error={errors.note}>
            <AreaControl
              value={draft.note}
              onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              placeholder="Optional."
            />
          </Field>
          {errors.form ? (
            <p className="text-sm text-clay" role="alert">
              {errors.form}
            </p>
          ) : null}
          <PressButton type="submit" className="w-full">
            Take off the stand
          </PressButton>
        </form>
      ) : null}
    </Sheet>
  );
}

export function CashSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const logCollection = useStandStore((state) => state.logCollection);
  const [draft, setDraft] = useState<CashDraft>({ amount: "", day: localDay(), note: "" });
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setDraft({ amount: "", day: localDay(), note: "" });
    setErrors({});
  }, [open]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Log cash"
      description="Count what came in. You don't have to say which flowers it was."
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const result = logCollection(draft);
          const next = failure(result);
          if (next) {
            setErrors(next);
            return;
          }
          onOpenChange(false);
        }}
      >
        <Field label="Amount collected" error={errors.amount}>
          <TextControl
            inputMode="decimal"
            value={draft.amount}
            onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
            placeholder="42.00"
          />
        </Field>
        <Field label="Day" error={errors.day}>
          <TextControl
            type="date"
            value={draft.day}
            max={localDay()}
            onChange={(event) => setDraft({ ...draft, day: event.target.value })}
          />
        </Field>
        <Field label="Note" error={errors.note}>
          <AreaControl
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
            placeholder="Optional. Morning jar, or after the rush."
          />
        </Field>
        {errors.form ? (
          <p className="text-sm text-clay" role="alert">
            {errors.form}
          </p>
        ) : null}
        <PressButton type="submit" className="w-full">
          Log this cash
        </PressButton>
      </form>
    </Sheet>
  );
}

export function AboutSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Version ${APP_VERSION}`}
      description="This number changes with every update."
    >
      <div className="grid gap-3 text-sm text-pretty text-ink">
        <p>
          Flower Stand runs on this phone. The book is saved in the app on this device. Nothing is uploaded. There is
          no account and no cloud copy.
        </p>
        <p className="text-muted">
          The app is downloaded from GitHub only. It is not hosted on Grok.{" "}
          <a className="underline" href={APP_SOURCE_URL}>
            thelubemaster/flower-stand-tracker
          </a>
        </p>
        <p className="text-muted">
          This says {APP_VERSION}. That number changes only when a newer copy from that GitHub repo is on the phone.
          The book itself never leaves this device. Download the record from the Record tab if you want a file of it.
        </p>
      </div>
    </Sheet>
  );
}

function KindField({ kind, onChange }: { kind: Kind; onChange: (kind: Kind) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Kind</legend>
      <div className="grid grid-cols-3 gap-2">
        {KINDS.map((option) => (
          <Choice key={option} selected={kind === option} onClick={() => onChange(option)}>
            {kindTitle(option)}
          </Choice>
        ))}
      </div>
    </fieldset>
  );
}

function paidEachPreview(draft: PurchaseDraft): string | undefined {
  if (!/^\d+$/.test(draft.quantity.trim())) return undefined;
  const quantity = Number(draft.quantity);
  const cleaned = draft.totalCost.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return undefined;
  const cost = Number(cleaned);
  if (quantity < 1 || !Number.isFinite(cost)) return undefined;
  return `That's ${formatMoney(cost / quantity)} each, before you sell.`;
}

function stepQuantity(current: string, delta: number, max: number): string {
  const parsed = /^\d+$/.test(current.trim()) ? Number(current) : 0;
  const next = Math.min(max, Math.max(1, parsed + delta));
  return String(next);
}
