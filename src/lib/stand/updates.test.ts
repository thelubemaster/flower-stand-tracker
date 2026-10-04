import assert from "node:assert/strict";
import test from "node:test";
import { compareVersions } from "./semver.ts";

test("compareVersions orders the published copy against this phone", () => {
  assert.equal(compareVersions("1.6.0", "1.5.0"), 1);
  assert.equal(compareVersions("1.5.0", "1.6.0"), -1);
  assert.equal(compareVersions("v1.6.0", "1.6.0"), 0);
  assert.equal(compareVersions("1.6.1", "1.6.0"), 1);
  assert.equal(compareVersions("1.10.0", "1.9.0"), 1);
});
