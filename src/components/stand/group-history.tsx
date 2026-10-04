import { formatMoney, formatStamp, markdownReasonLabel, reasonLabel } from "@/lib/stand/format";
import { buildItemGroups } from "@/lib/stand/groups";
import { unitCost } from "@/lib/stand/logic";
import { useStandStore } from "@/lib/stand/store";
import type { GroupPart } from "@/lib/stand/groups";

export function GroupHistory({ label }: { label?: string }) {
  const purchases = useStandStore((state) => state.purchases);
  const removals = useStandStore((state) => state.removals);
  const priceChanges = useStandStore((state) => state.priceChanges);
  const groups = buildItemGroups(purchases, removals, priceChanges).filter((group) => !label || group.label === label);

  if (groups.length === 0) {
    return <p className="text-sm text-pretty text-muted">Nothing in this group yet.</p>;
  }

  return (
    <div className="grid gap-6">
      {groups.map((group) => (
        <section key={group.label} className="grid gap-3">
          <header>
            <h2 className="font-display text-3xl leading-none">{group.label}</h2>
            <p className="mt-2 text-sm text-pretty text-muted">
              {group.remaining} still out of {group.bought} bought · {group.adds}{" "}
              {group.adds === 1 ? "time added" : "times added"} · paid {formatMoney(group.spent)}
            </p>
          </header>
          {group.items.map((item) => (
            <article key={item.name} className="rounded-card border border-line bg-card px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-2xl leading-tight text-balance">{item.name}</h3>
                <p className="font-display text-3xl tabular-nums leading-none">{item.remaining}</p>
              </div>
              <p className="mt-1 text-sm text-muted">
                {item.remaining > 0 ? `${item.remaining} still out of ${item.bought} bought` : `Off the stand · ${item.bought} bought`}{" "}
                · paid {formatMoney(item.spent)}
              </p>
              <ol className="mt-4 grid gap-4">
                {item.adds.map((add) => (
                  <li key={add.id} className="grid gap-3 border-t border-line pt-3">
                    <p className="text-sm font-medium">Added {formatStamp(add.at)}</p>
                    {add.parts.map((part) => (
                      <PartHistory key={part.purchase.id} part={part} showDetail={add.parts.length > 1 || part.purchase.detail.trim() !== ""} />
                    ))}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}

function PartHistory({ part, showDetail }: { part: GroupPart; showDetail: boolean }) {
  const purchase = part.purchase;
  return (
    <div className="grid gap-1 text-sm">
      {showDetail ? <p className="font-medium">{purchase.detail.trim() || purchase.name}</p> : null}
      <p className="text-pretty text-muted">
        {purchase.quantity} bought · paid {formatMoney(purchase.totalCost)} · {formatMoney(unitCost(purchase))} each · selling{" "}
        {formatMoney(purchase.sellPrice)} each
      </p>
      {purchase.note ? <p className="text-pretty">{purchase.note}</p> : null}
      {part.prices.map((change) => (
        <p key={change.id} className="text-pretty">
          Price {formatMoney(change.fromPrice)} to {formatMoney(change.toPrice)} · {formatStamp(change.at)}
          {markdownReasonLabel(change.reason) ? ` · ${markdownReasonLabel(change.reason)}` : ""}
        </p>
      ))}
      {part.removals.map((removal) => (
        <p key={removal.id} className="text-pretty">
          {reasonLabel(removal.reason)} · {removal.quantity} · {formatStamp(removal.at)}
          {removal.note ? ` · ${removal.note}` : ""}
        </p>
      ))}
      <p className="text-muted">
        {purchase.remaining > 0
          ? `${purchase.remaining} still on the stand`
          : part.removals.length === 0
            ? "Off the stand"
            : "None left on the stand"}
      </p>
    </div>
  );
}
