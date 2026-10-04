/**
 * Updates from GitHub only — same idea as the receipt tracker.
 * The stand book never leaves the phone. This only asks GitHub which copy is published.
 */
import { compareVersions } from "@/lib/stand/semver";
import { installApkInsideApp, isNativeAndroidApp } from "@/lib/stand/apk-install";
import {
  APP_APK_NAME,
  APP_APK_URL,
  APP_VERSION,
  CHANGELOG,
  GITHUB_PAGES_BASE,
  GITHUB_RELEASES_LATEST,
  githubApkForTag,
  type ChangelogEntry,
} from "@/lib/version";

export { compareVersions };

export type UpdateManifest = {
  version: string;
  notes?: string;
  apkUrl?: string;
  source?: string;
};

export type UpdateCheckResult =
  | { status: "current"; version: string; latest: string; source?: string }
  | { status: "ahead"; version: string; latest: string; source?: string }
  | { status: "available"; manifest: UpdateManifest }
  | { status: "error"; message: string };

const CACHE_MS = 60_000;

let inflight: Promise<UpdateCheckResult> | null = null;
let cached: { at: number; result: UpdateCheckResult } | null = null;

export function updateAvailable(result: UpdateCheckResult | null): boolean {
  return result?.status === "available";
}

export function changelogFor(version: string): ChangelogEntry | undefined {
  const clean = version.replace(/^v/i, "");
  return CHANGELOG.find((entry) => entry.version === clean);
}

function normalizeVersion(value: string): string {
  return value.replace(/^v/i, "").trim();
}

function parseManifest(raw: unknown, source: string): UpdateManifest | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as { version?: unknown; notes?: unknown; apkUrl?: unknown; apkVersion?: unknown };
  const version = normalizeVersion(String(body.version || body.apkVersion || ""));
  if (!version) return null;
  const apkUrl = typeof body.apkUrl === "string" && body.apkUrl.includes(".apk") ? body.apkUrl : githubApkForTag(version);
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 280) : undefined;
  return { version, notes, apkUrl, source };
}

function manifestFromRelease(raw: unknown): UpdateManifest | null {
  if (!raw || typeof raw !== "object") return null;
  const rel = raw as {
    tag_name?: string;
    name?: string;
    body?: string;
    assets?: Array<{ name?: string; browser_download_url?: string }>;
  };
  const version = normalizeVersion(String(rel.tag_name || rel.name || ""));
  if (!version) return null;
  const apk = (rel.assets || []).find((asset) => asset.name === APP_APK_NAME);
  return {
    version,
    notes: rel.body?.replace(/\s+/g, " ").trim().slice(0, 280),
    apkUrl: apk?.browser_download_url || githubApkForTag(version),
    source: "github-releases",
  };
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function loadCandidates(): Promise<UpdateManifest[]> {
  const found: UpdateManifest[] = [];
  const release = manifestFromRelease(await fetchJson(GITHUB_RELEASES_LATEST));
  if (release) found.push(release);
  if (typeof location !== "undefined" && location.hostname === "thelubemaster.github.io") {
    const pages = parseManifest(await fetchJson(`${GITHUB_PAGES_BASE}/app-update.json`), "github-pages");
    if (pages) found.push(pages);
  }
  return found;
}

function decide(manifests: UpdateManifest[]): UpdateCheckResult {
  let best: UpdateManifest | null = null;
  for (const manifest of manifests) {
    if (!best || compareVersions(manifest.version, best.version) > 0) best = manifest;
  }
  if (!best) {
    return {
      status: "error",
      message: "Could not reach GitHub updates. Check your internet, then try again.",
    };
  }
  const compared = compareVersions(best.version, APP_VERSION);
  if (compared > 0) return { status: "available", manifest: best };
  if (compared < 0) return { status: "ahead", version: APP_VERSION, latest: best.version, source: best.source };
  return { status: "current", version: APP_VERSION, latest: best.version, source: best.source };
}

export async function checkForUpdate(force = false): Promise<UpdateCheckResult> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.result;
  if (!force && inflight) return inflight;
  inflight = loadCandidates()
    .then((manifests) => {
      const result = decide(manifests);
      cached = { at: Date.now(), result };
      return result;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function summaryFor(result: UpdateCheckResult | null): string {
  if (!result) return "Checking GitHub…";
  if (result.status === "available") {
    return `GitHub has v${result.manifest.version}. This phone is still on v${APP_VERSION}.`;
  }
  if (result.status === "ahead") {
    return `This phone is v${result.version}. The published GitHub copy is still v${result.latest}.`;
  }
  if (result.status === "current") {
    return `Up to date. This phone and GitHub are both v${result.version}.`;
  }
  return result.message;
}

export function stepsFor(result: UpdateCheckResult | null): string[] {
  if (!result) return ["Look up the latest copy on GitHub."];
  if (result.status === "available") {
    return [
      "Get up to date refreshes the Flower Stand already on this phone.",
      "It does not open the download page. The book stays here.",
    ];
  }
  if (result.status === "error") return ["Try again when this phone has a signal."];
  return ["Nothing to install. The book on this phone is already the published copy, or newer."];
}

/** The old button sent people to ?install=1&fresh=. That visit is an update, not a new download. */
export function isUpdateArrival(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.has("fresh") || params.has("updated");
}

/** Reload this app. Never the install page. */
export function inPlaceUpdateUrl(currentHref: string, now = Date.now()): string {
  const url = new URL(currentHref);
  url.searchParams.delete("install");
  url.searchParams.delete("fresh");
  url.searchParams.set("updated", String(now));
  return url.toString();
}

async function clearInstalledCopy(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

function publishedAppHref(): string {
  if (typeof location !== "undefined" && location.hostname === "thelubemaster.github.io") {
    return new URL(location.href).toString();
  }
  return `${GITHUB_PAGES_BASE}/`;
}

/** Install the published GitHub copy without leaving the app. The book is not uploaded. */
export async function applyPublishedUpdate(
  result: UpdateCheckResult,
  onProgress?: (message: string) => void,
): Promise<string> {
  if (result.status !== "available") return summaryFor(result);
  const version = result.manifest.version;
  if (isNativeAndroidApp()) {
    const apkUrl = result.manifest.apkUrl || githubApkForTag(version) || APP_APK_URL;
    return installApkInsideApp(apkUrl, onProgress);
  }
  onProgress?.(`Refreshing v${version} on this phone…`);
  await clearInstalledCopy();
  const next = inPlaceUpdateUrl(publishedAppHref());
  window.location.replace(next);
  return `Refreshing v${version}. The book stays on this phone.`;
}
