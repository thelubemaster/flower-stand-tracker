/** Compare semver-ish strings. a > b → 1. */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, "").split(/[.+-]/).map((part) => parseInt(part, 10) || 0);
  const pb = b.replace(/^v/i, "").split(/[.+-]/).map((part) => parseInt(part, 10) || 0);
  const count = Math.max(pa.length, pb.length);
  for (let i = 0; i < count; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}
