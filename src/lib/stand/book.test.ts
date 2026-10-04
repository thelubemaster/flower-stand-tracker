import assert from "node:assert/strict";
import test from "node:test";
import { buildBackup, parseBackup } from "./backup.ts";
import { countFromDraft, markdownChoices, priceChangeFromAmount } from "./logic.ts";
import type { Purchase } from "./types.ts";

const mum: Purchase = {
  id: "p1",
  lotId: "lot",
  partIndex: 0,
  name: "Mums",
  label: "Flowers",
  detail: "Yellow",
  quantity: 10,
  remaining: 10,
  totalCost: 40,
  sellPrice: 5,
  at: "2026-10-03T18:00:00.000Z",
  note: "",
};

test("still out drops the count and keeps the lot up", () => {
  const built = countFromDraft(mum, { mode: "left", amount: "3", day: "2026-10-03", note: "" }, "r1", new Date("2026-10-03T20:00:00.000Z"));
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.purchase.remaining, 3);
  assert.equal(built.removal.quantity, 7);
  assert.equal(built.removal.reason, "counted");
});

test("pulling the whole lot is refused", () => {
  const built = countFromDraft(mum, { mode: "pulled", amount: "10", day: "2026-10-03", note: "" }, "r1");
  assert.equal(built.ok, false);
});

test("markdown chips step down a dollar", () => {
  assert.deepEqual(markdownChoices(5), [4, 3, 2]);
});

test("backup round trip keeps the book", () => {
  const counted = countFromDraft(mum, { mode: "left", amount: "3", day: "2026-10-03", note: "" }, "r1", new Date("2026-10-03T20:00:00.000Z"));
  assert.equal(counted.ok, true);
  if (!counted.ok) return;
  const priced = priceChangeFromAmount(counted.purchase, 3, "season", "c1", new Date("2026-10-03T21:00:00.000Z"));
  assert.equal(priced.ok, true);
  if (!priced.ok) return;
  assert.equal(priced.change.reason, "season");
  const refused = priceChangeFromAmount(counted.purchase, 3, "", "c2");
  assert.equal(refused.ok, false);
  const backup = buildBackup([priced.purchase], [counted.removal], [], [priced.change], "1.7.0");
  const parsed = parseBackup(JSON.stringify(backup));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.backup.purchases[0].remaining, 3);
  assert.equal(parsed.backup.purchases[0].sellPrice, 3);
  assert.equal(parsed.backup.removals[0].reason, "counted");
});

test("a spreadsheet is not a backup", () => {
  const parsed = parseBackup("when,type\n");
  assert.equal(parsed.ok, false);
});
