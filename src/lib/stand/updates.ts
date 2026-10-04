/**
 * Updates from GitHub only — same idea as the receipt tracker.
 * The stand book never leaves the phone. This only asks GitHub which copy is published.
 */
import { compareVersions } from "@/lib/stand/semver";
import {
  APP_APK_NAME,
  APP_APK_URL,
  APP_INSTALL_URL,
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
      `Get v${result.manifest.version} from GitHub.`,
      isAndroid()
        ? `Open ${APP_APK_NAME}, then tap Install. The book stays on the phone.`
        : "iPhone reloads the home-screen copy. The book stays on the phone.",
    ];
  }
  if (result.status === "error") return ["Try again when this phone has a signal."];
  return ["Nothing to install. The book on this phone is already the published copy, or newer."];
}

function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

function onGitHubPages(): boolean {
  return typeof location !== "undefined" && location.hostname === "thelubemaster.github.io";
}

function startApkDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = APP_APK_NAME;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

async function reloadPublishedCopy(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  const next = new URL(APP_INSTALL_URL);
  next.searchParams.set("fresh", String(Date.now()));
  window.location.replace(next.toString());
}

/** Install the published GitHub copy. Does not upload the stand book. */
export async function applyPublishedUpdate(result: UpdateCheckResult): Promise<string> {
  if (result.status !== "available") return summaryFor(result);
  const version = result.manifest.version;
  const apkUrl = result.manifest.apkUrl || githubApkForTag(version) || APP_APK_URL;
  if (isAndroid()) {
    startApkDownload(apkUrl);
    return `Download started for v${version}. Open ${APP_APK_NAME}, then tap Install.`;
  }
  if (onGitHubPages()) {
    await reloadPublishedCopy();
    return `Reloading v${version} from GitHub…`;
  }
  window.location.assign(APP_INSTALL_URL);
  return "Opening the GitHub install page.";
}
