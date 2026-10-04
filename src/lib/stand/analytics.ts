import { format } from "date-fns";
import { formatMoney, kindTitle, localDay } from "@/lib/stand/format";
import { roundMoney, unitCost } from "@/lib/stand/logic";
import type { Collection, Kind, Purchase, Removal } from "@/lib/stand/types";

export type RangeKey = "7" | "30" | "all";

export type CashPoint = {
  day: string;
  label: string;
  title: string;
  amount: number;
};

export type KindSlice = {
  kind: Kind;
  title: string;
  onStand: number;
  share: number;
};

export type LotRoom = {
  id: string;
  name: string;
  unit: number;
  ask: number;
  room: number;
};

export type Analytics = {
  collected: number;
  spent: number;
  gap: number;
  comparison: string | null;
  series: CashPoint[];
  byWeek: boolean;
  busiest: { title: string; amount: number } | null;
  onStand: number;
  asking: number;
  costOut: number;
  room: number;
  kinds: KindSlice[];
  ranOut: number;
  tossed: number;
  dead: number;
  wasteCost: number;
  lots: LotRoom[];
};

const KINDS: Kind[] = ["flower", "plant", "pumpkin"];

function parseDay(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

function addDays(day: string, delta: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return localDay(new Date(year, month - 1, date + delta));
}

function stampDay(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return localDay(date);
}

function inSpan(day: string, start: string | null, end: string): boolean {
  if (day > end) return false;
  if (start != null && day < start) return false;
  return true;
}

function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  let cursor = start;
  while (cursor <= end && days.length < 800) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

function rangeBounds(range: RangeKey, now: Date): { start: string | null; end: string } {
  const end = localDay(now);
  if (range === "7") return { start: addDays(end, -6), end };
  if (range === "30") return { start: addDays(end, -29), end };
  return { start: null, end };
}

function sumCollected(collections: Collection[], start: string | null, end: string): number {
  return roundMoney(
    collections.reduce((sum, collection) => {
      const day = stampDay(collection.at);
      if (day == null || !inSpan(day, start, end)) return sum;
      return sum + collection.amount;
    }, 0),
  );
}

function axisLabel(day: string, count: number): string {
  const date = parseDay(day);
  if (count <= 7) return format(date, "EEE");
  if (count <= 31) return format(date, "M/d");
  return format(date, "MMM d");
}

function cashSeries(
  collections: Collection[],
  start: string | null,
  end: string,
): { points: CashPoint[]; byWeek: boolean } {
  const dated = collections
    .map((collection) => stampDay(collection.at))
    .filter((day): day is string => day != null && inSpan(day, start, end))
    .sort();
  const first = start ?? dated[0];
  if (first == null) return { points: [], byWeek: false };
  const days = eachDay(first, end);
  const byDay = new Map<string, number>();
  for (const collection of collections) {
    const day = stampDay(collection.at);
    if (day == null || !inSpan(day, first, end)) continue;
    byDay.set(day, (byDay.get(day) ?? 0) + collection.amount);
  }
  if (days.length <= 31) {
    return {
      byWeek: false,
      points: days.map((day) => ({
        day,
        label: axisLabel(day, days.length),
        title: format(parseDay(day), "MMM d"),
        amount: roundMoney(byDay.get(day) ?? 0),
      })),
    };
  }
  const points: CashPoint[] = [];
  for (let index = 0; index < days.length; index += 7) {
    const chunk = days.slice(index, index + 7);
    const amount = roundMoney(chunk.reduce((sum, day) => sum + (byDay.get(day) ?? 0), 0));
    points.push({
      day: chunk[0],
      label: format(parseDay(chunk[0]), "MMM d"),
      title: `Week of ${format(parseDay(chunk[0]), "MMM d")}`,
      amount,
    });
  }
  return { points, byWeek: true };
}

export function buildAnalytics(
  purchases: Purchase[],
  removals: Removal[],
  collections: Collection[],
  range: RangeKey,
  now = new Date(),
): Analytics {
  const { start, end } = rangeBounds(range, now);
  const collected = sumCollected(collections, start, end);
  const spent = roundMoney(
    purchases.reduce((sum, purchase) => {
      const day = stampDay(purchase.at);
      if (day == null || !inSpan(day, start, end)) return sum;
      return sum + purchase.totalCost;
    }, 0),
  );
  const { points, byWeek } = cashSeries(collections, start, end);
  let comparison: string | null = null;
  if (start != null) {
    const span = eachDay(start, end).length;
    const previousEnd = addDays(start, -1);
    const previousStart = addDays(start, -span);
    const previous = sumCollected(collections, previousStart, previousEnd);
    comparison = compareLine(collected, previous, span);
  }

  const busiestPoint = points.reduce<CashPoint | null>((best, point) => {
    if (point.amount <= 0) return best;
    if (best == null || point.amount > best.amount) return point;
    return best;
  }, null);

  const onStand = purchases.reduce((sum, purchase) => sum + purchase.remaining, 0);
  const asking = roundMoney(purchases.reduce((sum, purchase) => sum + purchase.remaining * purchase.sellPrice, 0));
  const costOut = roundMoney(purchases.reduce((sum, purchase) => sum + purchase.remaining * unitCost(purchase), 0));
  const kinds = KINDS.map((kind) => {
    const pieces = purchases.reduce(
      (sum, purchase) => (purchase.kind === kind ? sum + purchase.remaining : sum),
      0,
    );
    return {
      kind,
      title: kindTitle(kind),
      onStand: pieces,
      share: onStand > 0 ? (pieces / onStand) * 100 : 0,
    };
  });

  const purchaseById = new Map(purchases.map((purchase) => [purchase.id, purchase]));
  let ranOut = 0;
  let tossed = 0;
  let dead = 0;
  let wasteCost = 0;
  for (const removal of removals) {
    const day = stampDay(removal.at);
    if (day == null || !inSpan(day, start, end)) continue;
    if (removal.reason === "ran-out") ranOut += removal.quantity;
    if (removal.reason === "tossed") tossed += removal.quantity;
    if (removal.reason === "dead") dead += removal.quantity;
    if (removal.reason === "tossed" || removal.reason === "dead") {
      const purchase = purchaseById.get(removal.purchaseId);
      if (purchase) wasteCost += removal.quantity * unitCost(purchase);
    }
  }

  const lots = purchases
    .filter((purchase) => purchase.remaining > 0)
    .map((purchase) => {
      const unit = unitCost(purchase);
      return {
        id: purchase.id,
        name: purchase.name,
        unit,
        ask: purchase.sellPrice,
        room: roundMoney((purchase.sellPrice - unit) * purchase.remaining),
      };
    })
    .sort((a, b) => b.room - a.room)
    .slice(0, 5);

  return {
    collected,
    spent,
    gap: roundMoney(collected - spent),
    comparison,
    series: points,
    byWeek,
    busiest: busiestPoint ? { title: busiestPoint.title, amount: busiestPoint.amount } : null,
    onStand,
    asking,
    costOut,
    room: roundMoney(asking - costOut),
    kinds,
    ranOut,
    tossed,
    dead,
    wasteCost: roundMoney(wasteCost),
    lots,
  };
}

function compareLine(current: number, previous: number, dayCount: number): string {
  const span = dayCount === 7 ? "7 days" : dayCount === 30 ? "30 days" : `${dayCount} days`;
  const delta = roundMoney(current - previous);
  if (previous === 0 && current === 0) return `No cash in these ${span}.`;
  if (previous === 0) return `No cash in the ${span} before this.`;
  if (delta === 0) return `Same as the ${span} before.`;
  if (delta > 0) return `Up ${formatMoney(delta)} from the ${span} before.`;
  return `Down ${formatMoney(Math.abs(delta))} from the ${span} before.`;
}

export function chartSummary(analytics: Analytics): string {
  if (analytics.busiest == null) {
    return analytics.byWeek ? "No cash logged in these weeks." : "No cash logged in these days.";
  }
  const grain = analytics.byWeek ? "week" : "day";
  return `Cash by ${grain}. Busiest is ${analytics.busiest.title} at ${formatMoney(analytics.busiest.amount)}.`;
}
