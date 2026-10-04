import { formatMoney, formatStamp, itemName, localDay, markdownReasonLabel, reasonLabel } from "@/lib/stand/format";
import { activePurchases, askingValue, collectedOnDay, markdownChoices, sameLocalDay } from "@/lib/stand/logic";
import { useStandStore } from "@/lib/stand/store";
import { PressButton } from "@/components/stand/ui";

export function DayView({
  onLog,
  onMarkdown,
}: {
  onLog: () => void;
  onMarkdown: (id: string, price: number | null) => void;
}) {
  const purchases = useStandStore((state) => state.purchases);
  const removals = useStandStore((state) => state.removals);
  const collections = useStandStore((state) => state.collections);
  const priceChanges = useStandStore((state) => state.priceChanges);
  const day = localDay();
  const sitting = activePurchases(purchases);
  const cameOff = removals
    .filter((removal) => sameLocalDay(removal.at, day))
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at));
  const prices = priceChanges
    .filter((change) => sameLocalDay(change.at, day))
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="grid gap-4">
      <section className="rounded-card bg-moss px-4 py-5 text-card">
        <p className="text-sm">Jar today</p>
        <p className="font-display text-5xl tabular-nums leading-none">{formatMoney(collectedOnDay(collections, day))}</p>
        <p className="mt-3 text-sm">Asking if what's left sells · {formatMoney(askingValue(purchases))}</p>
        <PressButton variant="quiet" className="mt-4 w-full" onClick={onLog}>
          Log money collected
        </PressButton>
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-2xl">Still sitting</h2>
        {sitting.length === 0 ? (
          <p className="text-sm text-pretty text-muted">Nothing is on the stand tonight.</p>
        ) : (
          <ul className="grid gap-3">
            {sitting.map((purchase) => {
              const choices = markdownChoices(purchase.sellPrice);
              return (
                <li key={purchase.id} className="rounded-card border border-line bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{itemName(purchase)}</p>
                      <p className="text-sm text-muted">{purchase.label}</p>
                    </div>
                    <p className="font-display text-3xl tabular-nums leading-none">{purchase.remaining}</p>
                  </div>
                  <p className="mt-2 text-sm">
                    Sign is <span className="font-medium tabular-nums">{formatMoney(purchase.sellPrice)}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {choices.map((choice) => (
                      <PressButton key={choice} variant="quiet" onClick={() => onMarkdown(purchase.id, choice)}>
                        {formatMoney(choice)}
                      </PressButton>
                    ))}
                    <PressButton variant="quiet" onClick={() => onMarkdown(purchase.id, null)}>
                      Other
                    </PressButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-2xl">Came off today</h2>
        {cameOff.length === 0 ? (
          <p className="text-sm text-pretty text-muted">Nothing left the stand today.</p>
        ) : (
          <ul className="grid gap-2">
            {cameOff.map((removal) => (
              <li key={removal.id} className="rounded-card border border-line bg-card px-4 py-3">
                <p className="font-medium break-words">{itemName(removal)}</p>
                <p className="text-sm text-muted">
                  {removal.quantity} · {reasonLabel(removal.reason)} · {formatStamp(removal.at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {prices.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="font-display text-2xl">Prices today</h2>
          <ul className="grid gap-2">
            {prices.map((change) => (
              <li key={change.id} className="rounded-card border border-line bg-card px-4 py-3">
                <p className="font-medium break-words">{itemName(change)}</p>
                <p className="text-sm text-muted tabular-nums">
                  {formatMoney(change.fromPrice)} to {formatMoney(change.toPrice)}
                  {markdownReasonLabel(change.reason) ? ` · ${markdownReasonLabel(change.reason)}` : ""} · {formatStamp(change.at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
