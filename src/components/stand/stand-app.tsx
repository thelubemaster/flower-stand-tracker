import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Banknote, ChartColumn, ScrollText, Sprout } from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/lib/version";
import { formatMoney, formatStamp, itemName, localDay, reasonLabel } from "@/lib/stand/format";
import {
  activePurchases,
  askingValue,
  buildLedger,
  clearedCount,
  collectedOnDay,
  costStillOut,
  ledgerCsv,
  lotOutcome,
  piecesOnStand,
  totalCollected,
  totalSpent,
  unitCost,
  type LedgerFilter,
} from "@/lib/stand/logic";
import { rehydrateStand, useStandStore } from "@/lib/stand/store";
import { installOfflineCopy } from "@/lib/stand/offline";
import { AboutSheet, BuySheet, CashSheet, EditSheet, TakeOffSheet } from "@/components/stand/forms";
import { Choice, PressButton } from "@/components/stand/ui";

const AnalyticsView = lazy(() =>
  import("@/components/stand/analytics-view").then((mod) => ({ default: mod.AnalyticsView })),
);

type Tab = "stand" | "cash" | "stats" | "record";

export function StandApp() {
  const hydrated = useStandStore((state) => state.hydrated);
  const [tab, setTab] = useState<Tab>("stand");
  const [buyOpen, setBuyOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [takeId, setTakeId] = useState<string | null>(null);

  useEffect(() => {
    rehydrateStand();
    installOfflineCopy();
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-paper text-ink" data-app-version={APP_VERSION}>
        <Header onAbout={() => setAboutOpen(true)} />
        <p className="px-4 text-sm text-muted">Opening your stand book…</p>
        <AboutSheet open={aboutOpen} onOpenChange={setAboutOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper text-ink" data-app-version={APP_VERSION}>
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
        <Header onAbout={() => setAboutOpen(true)} />
        <main className="flex-1 px-4 pb-28">
          {tab === "stand" ? (
            <StandView onAdd={() => setBuyOpen(true)} onEdit={setEditId} onTake={setTakeId} />
          ) : null}
          {tab === "cash" ? <CashView onLog={() => setCashOpen(true)} /> : null}
          {tab === "stats" ? (
            <Suspense fallback={<p className="text-sm text-muted">Opening the numbers…</p>}>
              <AnalyticsView />
            </Suspense>
          ) : null}
          {tab === "record" ? <RecordView /> : null}
        </main>
      </div>
      <nav
        aria-label="Sections"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card"
      >
        <div className="mx-auto grid max-w-xl grid-cols-4">
          <NavButton label="Stand" icon={<Sprout className="size-5" aria-hidden />} selected={tab === "stand"} onClick={() => setTab("stand")} />
          <NavButton label="Cash" icon={<Banknote className="size-5" aria-hidden />} selected={tab === "cash"} onClick={() => setTab("cash")} />
          <NavButton label="Stats" icon={<ChartColumn className="size-5" aria-hidden />} selected={tab === "stats"} onClick={() => setTab("stats")} />
          <NavButton label="Record" icon={<ScrollText className="size-5" aria-hidden />} selected={tab === "record"} onClick={() => setTab("record")} />
        </div>
      </nav>
      <BuySheet open={buyOpen} onOpenChange={setBuyOpen} />
      <CashSheet open={cashOpen} onOpenChange={setCashOpen} />
      <AboutSheet open={aboutOpen} onOpenChange={setAboutOpen} />
      <EditSheet purchaseId={editId} onOpenChange={(open) => { if (!open) setEditId(null); }} />
      <TakeOffSheet purchaseId={takeId} onOpenChange={(open) => { if (!open) setTakeId(null); }} />
    </div>
  );
}

function Header({ onAbout }: { onAbout: () => void }) {
  return (
    <header className="header-pad px-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl leading-none text-balance">{APP_NAME}</h1>
        <button
          type="button"
          className="tap min-h-11 rounded-full border border-line bg-card px-3 text-sm font-medium tabular-nums"
          onClick={onAbout}
          aria-label={`Version ${APP_VERSION}. See how to check for updates.`}
        >
          v{APP_VERSION}
        </button>
      </div>
      <p className="mt-2 text-sm text-pretty text-muted">
        On this phone only. Stock, prices, and the cash you collect.
      </p>
    </header>
  );
}

function NavButton({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={selected ? "tap grid min-h-14 place-items-center gap-1 text-sm font-medium text-moss" : "tap grid min-h-14 place-items-center gap-1 text-sm text-muted"}
      aria-current={selected ? "page" : undefined}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function StandView({
  onAdd,
  onEdit,
  onTake,
}: {
  onAdd: () => void;
  onEdit: (id: string) => void;
  onTake: (id: string) => void;
}) {
  const purchases = useStandStore((state) => state.purchases);
  const [label, setLabel] = useState("all");
  const active = activePurchases(purchases);
  const labels = [...new Set(active.map((purchase) => purchase.label))].sort((a, b) => a.localeCompare(b));
  const shown = label === "all" ? active : active.filter((purchase) => purchase.label === label);
  const cleared = clearedCount(purchases);

  return (
    <div className="grid gap-4">
      <section className="rounded-card bg-moss px-4 py-5 text-card">
        <p className="text-sm">On the stand</p>
        <p className="font-display text-5xl tabular-nums leading-none">{piecesOnStand(purchases)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p>Asking if it sells</p>
            <p className="mt-1 text-lg font-medium tabular-nums">{formatMoney(askingValue(purchases))}</p>
          </div>
          <div>
            <p>Cost still out</p>
            <p className="mt-1 text-lg font-medium tabular-nums">{formatMoney(costStillOut(purchases))}</p>
          </div>
        </div>
      </section>
      <PressButton className="w-full" onClick={onAdd}>
        Add stock
      </PressButton>
      {active.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Choice selected={label === "all"} onClick={() => setLabel("all")}>
            All {active.length}
          </Choice>
          {labels.map((option) => {
            const count = active.filter((purchase) => purchase.label === option).length;
            return (
              <Choice key={option} selected={label === option} onClick={() => setLabel(option)}>
                {option} {count}
              </Choice>
            );
          })}
        </div>
      ) : null}
      {active.length === 0 ? (
        <section className="rounded-card border border-line bg-card px-4 py-8 text-center">
          <h2 className="font-display text-2xl text-balance">Nothing is out right now</h2>
          <p className="mt-2 text-sm text-pretty text-muted">
            Add whatever you're selling. Name it, then break one buy into colors if you need to.
          </p>
        </section>
      ) : null}
      {active.length > 0 && shown.length === 0 ? (
        <p className="text-sm text-muted">None of those are on the stand right now.</p>
      ) : null}
      <ul className="grid gap-3">
        {shown.map((purchase) => (
          <li key={purchase.id} className="rounded-card border border-line bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted">{purchase.label}</p>
                <h2 className="font-display text-2xl leading-tight text-balance break-words">
                  {purchase.detail || purchase.name}
                </h2>
                {purchase.detail ? <p className="text-sm text-muted">{purchase.name}</p> : null}
              </div>
              <p className="font-display text-4xl tabular-nums leading-none">{purchase.remaining}</p>
            </div>
            <p className="mt-2 text-sm text-muted">
              of {purchase.quantity} bought · {formatStamp(purchase.at)}
            </p>
            {purchases.filter((row) => row.lotId === purchase.lotId).length > 1 ? (
              <p className="text-sm text-muted">
                Part of{" "}
                {purchases.filter((row) => row.lotId === purchase.lotId).reduce((sum, row) => sum + row.quantity, 0)}{" "}
                {purchase.name}
              </p>
            ) : null}
            <p className="mt-3 text-sm">
              Selling for <span className="font-medium tabular-nums">{formatMoney(purchase.sellPrice)}</span> each
            </p>
            <p className="text-sm text-muted">
              Paid {formatMoney(purchase.totalCost)} · {formatMoney(unitCost(purchase))} each
            </p>
            {purchase.note ? <p className="mt-2 text-sm text-pretty text-muted">{purchase.note}</p> : null}
            <div className="mt-4 grid gap-2">
              <PressButton className="w-full" onClick={() => onTake(purchase.id)}>
                Take off the stand
              </PressButton>
              <PressButton variant="quiet" className="w-full" onClick={() => onEdit(purchase.id)}>
                Fix this lot
              </PressButton>
            </div>
          </li>
        ))}
      </ul>
      {cleared > 0 ? (
        <p className="text-sm text-pretty text-muted">
          {cleared === 1 ? "1 lot is off the stand." : `${cleared} lots are off the stand.`} They’re still in the record.
        </p>
      ) : null}
    </div>
  );
}

function CashView({ onLog }: { onLog: () => void }) {
  const purchases = useStandStore((state) => state.purchases);
  const collections = useStandStore((state) => state.collections);
  const deleteCollection = useStandStore((state) => state.deleteCollection);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const collected = totalCollected(collections);
  const spent = totalSpent(purchases);
  const gap = collected - spent;
  const today = collectedOnDay(collections);
  const rows = collections.slice().sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));

  return (
    <div className="grid gap-4">
      <section className="rounded-card border border-line bg-card px-4 py-5">
        <p className="text-sm font-medium text-clay">Money collected</p>
        <p className="mt-1 font-display text-5xl tabular-nums leading-none">{formatMoney(collected)}</p>
        <p className="mt-2 text-sm text-muted">Today {formatMoney(today)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
          <div>
            <p className="text-muted">Paid for stock</p>
            <p className="mt-1 text-lg font-medium tabular-nums">{formatMoney(spent)}</p>
          </div>
          <div>
            <p className="text-muted">{gap >= 0 ? "Ahead of stock cost" : "Short of stock cost"}</p>
            <p className={gap >= 0 ? "mt-1 text-lg font-medium tabular-nums text-moss" : "mt-1 text-lg font-medium tabular-nums text-clay"}>
              {formatMoney(gap)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-pretty text-muted">
          This is cash in minus what you paid. Tossed and dead stock still counts as paid, because you aren’t logging each sale.
        </p>
      </section>
      <PressButton className="w-full" onClick={onLog}>
        Log money collected
      </PressButton>
      {rows.length === 0 ? (
        <p className="text-sm text-pretty text-muted">
          Nothing in the cash box yet. When you count the jar, log the total. You don’t need to say what sold.
        </p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((collection) => (
            <li key={collection.id} className="rounded-card border border-line bg-card px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium tabular-nums">{formatMoney(collection.amount)}</p>
                <p className="text-sm text-muted">{formatStamp(collection.at)}</p>
              </div>
              {collection.note ? <p className="mt-1 text-sm text-pretty text-muted">{collection.note}</p> : null}
              {pendingId === collection.id ? (
                <PressButton
                  variant="ghost"
                  className="mt-2 px-0 text-clay"
                  onClick={() => {
                    deleteCollection(collection.id);
                    setPendingId(null);
                  }}
                >
                  Yes, remove this cash line
                </PressButton>
              ) : (
                <PressButton variant="ghost" className="mt-2 px-0" onClick={() => setPendingId(collection.id)}>
                  Remove
                </PressButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecordView() {
  const purchases = useStandStore((state) => state.purchases);
  const removals = useStandStore((state) => state.removals);
  const collections = useStandStore((state) => state.collections);
  const undoRemoval = useStandStore((state) => state.undoRemoval);
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const rows = buildLedger(purchases, removals, collections, filter);
  const empty = purchases.length + removals.length + collections.length === 0;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {purchases.length} buys · {removals.length} removals · {collections.length} cash drops
        </p>
        <PressButton
          variant="quiet"
          disabled={empty}
          onClick={() => downloadRecord(ledgerCsv(purchases, removals, collections))}
        >
          Download record
        </PressButton>
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["bought", "Bought"],
            ["removed", "Removed"],
            ["cash", "Cash"],
          ] as const
        ).map(([value, label]) => (
          <Choice key={value} selected={filter === value} onClick={() => setFilter(value)}>
            {label}
          </Choice>
        ))}
      </div>
      {notice ? (
        <p className="text-sm text-clay" role="alert">
          {notice}
        </p>
      ) : null}
      {empty ? (
        <section className="rounded-card border border-line bg-card px-4 py-8">
          <h2 className="font-display text-2xl text-balance">The record is empty</h2>
          <p className="mt-2 text-sm text-pretty text-muted">
            Buys, what you take off the stand, and every cash drop stay here. Nothing gets thrown out of the book when stock leaves the stand.
          </p>
        </section>
      ) : null}
      {!empty && rows.length === 0 ? <p className="text-sm text-muted">Nothing in this part of the record.</p> : null}
      <ul className="grid gap-2">
        {rows.map((row) => {
          if (row.type === "bought") {
            const purchase = row.purchase;
            return (
              <li key={row.id} className="rounded-card border border-line bg-card px-4 py-3">
                <p className="text-sm text-muted">Bought · {formatStamp(purchase.at)}</p>
                <p className="font-medium break-words">{itemName(purchase)}</p>
                <p className="text-sm text-muted">
                  {purchase.label} · {purchase.quantity} bought · paid {formatMoney(purchase.totalCost)} · sell{" "}
                  {formatMoney(purchase.sellPrice)} each
                </p>
                <p className="text-sm text-muted">{lotOutcome(purchase, removals)}</p>
                {purchase.note ? <p className="mt-1 text-sm text-pretty">{purchase.note}</p> : null}
              </li>
            );
          }
          if (row.type === "removed") {
            const removal = row.removal;
            return (
              <li key={row.id} className="rounded-card border border-line bg-card px-4 py-3">
                <p className="text-sm text-muted">
                  {reasonLabel(removal.reason)} · {formatStamp(removal.at)}
                </p>
                <p className="mt-1 font-medium break-words">{itemName(removal)}</p>
                <p className="text-sm text-muted">
                  {removal.quantity} {removal.reason === "ran-out" ? "sold out" : "left the stand"}
                </p>
                {removal.note ? <p className="mt-1 text-sm text-pretty">{removal.note}</p> : null}
                <PressButton
                  variant="ghost"
                  className="mt-2 px-0"
                  onClick={() => {
                    const result = undoRemoval(removal.id);
                    setNotice(result.ok ? null : "error" in result ? result.error : "Couldn't put that back.");
                  }}
                >
                  Put back on the stand
                </PressButton>
              </li>
            );
          }
          const collection = row.collection;
          return (
            <li key={row.id} className="rounded-card border border-line bg-card px-4 py-3">
              <p className="text-sm text-muted">Cash collected · {formatStamp(collection.at)}</p>
              <p className="mt-1 font-medium tabular-nums">{formatMoney(collection.amount)}</p>
              {collection.note ? <p className="mt-1 text-sm text-pretty text-muted">{collection.note}</p> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function downloadRecord(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `flower-stand-record-${localDay()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
