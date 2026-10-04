import { LOCAL_CACHE } from "@/lib/version";

function localUrl(name: string): string | null {
  try {
    const url = new URL(name);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname.endsWith("/sw.js") || url.pathname.includes("/api/")) return null;
    if (
      url.pathname.startsWith("/src/") ||
      url.pathname.startsWith("/@") ||
      url.pathname.startsWith("/node_modules/")
    ) {
      return null;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

async function warmCache(): Promise<void> {
  if (!("caches" in window)) return;
  const cache = await caches.open(LOCAL_CACHE);
  const base = import.meta.env.BASE_URL;
  const urls = new Set<string>([base, `${base}favicon.svg`, `${base}manifest.webmanifest`]);
  for (const entry of performance.getEntriesByType("resource")) {
    const url = localUrl(entry.name);
    if (url) urls.add(url);
  }
  await Promise.all(
    [...urls].map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch {
        // A missed file just means that screen is not saved yet.
      }
    }),
  );
}

/** Saves the app on the device. No-op in the live preview; the installed copy uses it. */
export function installOfflineCopy(): void {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  void warmCache();
}
