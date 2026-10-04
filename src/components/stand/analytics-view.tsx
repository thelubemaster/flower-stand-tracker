import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { cn } from "@/lib/cn";
import { buildAnalytics, chartSummary, type Analytics, type RangeKey } from "@/lib/stand/analytics";
import { formatMoney } from "@/lib/stand/format";
import { useStandStore } from "@/lib/stand/store";
import { Choice } from "@/components/stand/ui";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "all", label: "All" },
];

export function AnalyticsView() {
  const purchases = useStandStore((state) => state.purchases);
  const removals = useStandStore((state) => state.removals);
  const collections = useStandStore((state) => state.collections);
  const [range, setRange] = useState<RangeKey>("7");
  const empty = purchases.length + removals.length + collections.length === 0;
  const stats = buildAnalytics(purchases, removals, collections, range);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Time range">
        {RANGES.map((item) => (
          <Choice key={item.key} selected={range === item.key} onClick={() => setRange(item.key)}>
            {item.label}
          </Choice>
        ))}
      </div>
      {empty ? (
        <section className="rounded-card border border-line bg-card px-4 py-8">
          <h2 className="font-display text-2xl text-balance">Nothing to read yet</h2>
          <p className="mt-2 text-sm text-pretty text-muted">
            Add stock and log the cash you collect. This page reads that book. It will not guess which bunch sold.
          </p>
        </section>
      ) : (
        <AnalyticsBody stats={stats} />
      )}
    </div>
  );
}

function AnalyticsBody({ stats }: { stats: Analytics }) {
  const hasCash = stats.series.some((point) => point.amount > 0);
  return (
    <>
      <section className="rounded-card bg-moss px-4 py-5 text-card">
        <p className="text-sm">Collected</p>
        <p className="mt-1 font-display text-5xl leading-tight tabular-nums">{formatMoney(stats.collected)}</p>
        <p className="mt-2 text-sm text-pretty">{stats.comparison ?? "Everything logged in the book."}</p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Paid for stock" value={formatMoney(stats.spent)} />
        <Metric
          label={stats.gap >= 0 ? "Ahead of stock cost" : "Short of stock cost"}
          value={formatMoney(stats.gap)}
          tone={stats.gap >= 0 ? "moss" : "clay"}
        />
      </div>
      <p className="text-sm text-pretty text-muted">
        Collected minus what you paid in this stretch. Tossed and dead stock still counts as paid.
      </p>
      <section className="rounded-card border border-line bg-card p-4">
        <h2 className="font-display text-2xl text-balance">Cash</h2>
        <p className="mt-1 text-sm text-pretty text-muted">
          {stats.byWeek ? "Each bar is a week of the jar." : "Each bar is a day of the jar."} Not which flowers sold.
        </p>
        {hasCash ? (
          <CashChart stats={stats} />
        ) : (
          <p className="mt-4 text-sm text-muted">No cash logged in this stretch.</p>
        )}
      </section>
      <section className="rounded-card border border-line bg-card p-4">
        <h2 className="font-display text-2xl text-balance">On the stand now</h2>
        <p className="mt-1 text-sm text-muted">This part is today, not the range above.</p>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-muted">Pieces</dt>
            <dd className="mt-1 text-lg font-medium tabular-nums">{stats.onStand}</dd>
          </div>
          <div>
            <dt className="text-muted">Asking</dt>
            <dd className="mt-1 text-lg font-medium tabular-nums">{formatMoney(stats.asking)}</dd>
          </div>
          <div>
            <dt className="text-muted">Cost</dt>
            <dd className="mt-1 text-lg font-medium tabular-nums">{formatMoney(stats.costOut)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-pretty text-muted">
          {stats.onStand === 0
            ? "Nothing is out, so there is no asking price left."
            : stats.room >= 0
              ? `${formatMoney(stats.room)} of room if what is out sells at the price you set.`
              : `${formatMoney(Math.abs(stats.room))} under cost if what is out sells at the price you set.`}
        </p>
        {stats.onStand > 0 ? <KindMix kinds={stats.kinds} /> : null}
      </section>
      <section className="rounded-card border border-line bg-card p-4">
        <h2 className="font-display text-2xl text-balance">Left the stand</h2>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <Count label="Sold out" value={stats.ranOut} />
          <Count label="Tossed" value={stats.tossed} />
          <Count label="Dead" value={stats.dead} />
        </dl>
        <p className="mt-3 text-sm text-pretty text-muted">
          {stats.tossed + stats.dead === 0
            ? "Nothing was marked tossed or dead in this stretch."
            : `About ${formatMoney(stats.wasteCost)} of what you paid left as tossed or dead.`}
        </p>
      </section>
      {stats.lots.length > 0 ? (
        <section className="rounded-card border border-line bg-card p-4">
          <h2 className="font-display text-2xl text-balance">Asking above cost</h2>
          <p className="mt-1 text-sm text-pretty text-muted">
            Room on what is still out, if it sells at your price. Not cash already in the jar.
          </p>
          <ul className="mt-2">
            {stats.lots.map((lot) => (
              <li key={lot.id} className="flex items-baseline justify-between gap-3 border-t border-line py-3 first:border-t-0">
                <div className="min-w-0">
                  <p className="font-medium break-words">{lot.name}</p>
                  <p className="text-sm text-muted">
                    <span className="tabular-nums">{formatMoney(lot.unit)}</span> cost ·{" "}
                    <span className="tabular-nums">{formatMoney(lot.ask)}</span> asking
                  </p>
                </div>
                <p className={lot.room >= 0 ? "shrink-0 font-medium tabular-nums text-moss" : "shrink-0 font-medium tabular-nums text-clay"}>
                  {formatMoney(lot.room)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function CashChart({ stats }: { stats: Analytics }) {
  const reduce = usePrefersReducedMotion();
  return (
    <div className="mt-4">
      <div className="h-44 w-full min-w-0" role="img" aria-label={chartSummary(stats)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={stats.series.length > 10 ? 4 : 0}
              tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--color-paper)" }}
              content={({ active, payload }) => {
                if (!active || payload == null || payload.length === 0) return null;
                const point = payload[0]?.payload as { title?: string; amount?: number } | undefined;
                if (point == null) return null;
                return (
                  <div className="rounded-2xl border border-line bg-card px-3 py-2 text-sm text-ink">
                    <p className="text-muted">{point.title}</p>
                    <p className="font-medium tabular-nums">{formatMoney(point.amount ?? 0)}</p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="amount"
              fill="var(--color-moss)"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
              isAnimationActive={!reduce}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {stats.busiest ? (
        <p className="mt-2 text-sm text-muted">
          Busiest {stats.byWeek ? "week" : "day"}: {stats.busiest.title},{" "}
          <span className="tabular-nums">{formatMoney(stats.busiest.amount)}</span>.
        </p>
      ) : null}
    </div>
  );
}

function KindMix({ kinds }: { kinds: Analytics["kinds"] }) {
  return (
    <div className="mt-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-paper" aria-hidden>
        {kinds.map((slice) => (
          <div
            key={slice.kind}
            className={
              slice.kind === "flower" ? "h-full bg-moss" : slice.kind === "plant" ? "h-full bg-ink" : "h-full bg-clay"
            }
            style={{ width: `${slice.share}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-2 text-sm">
        {kinds.map((slice) => (
          <li key={slice.kind} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <span
                className={
                  slice.kind === "flower"
                    ? "size-2.5 rounded-full bg-moss"
                    : slice.kind === "plant"
                      ? "size-2.5 rounded-full bg-ink"
                      : "size-2.5 rounded-full bg-clay"
                }
                aria-hidden
              />
              {slice.title}
            </span>
            <span className="tabular-nums">{slice.onStand}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "moss" | "clay" }) {
  return (
    <div className="rounded-card border border-line bg-card px-4 py-3">
      <p className="text-sm text-pretty text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-medium tabular-nums",
          tone === "moss" && "text-moss",
          tone === "clay" && "text-clay",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return reduce;
}
