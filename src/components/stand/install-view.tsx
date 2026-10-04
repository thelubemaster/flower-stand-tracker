import { useEffect, useRef, useState } from "react";
import { APP_APK_NAME, APP_APK_URL, APP_INSTALL_URL, APP_VERSION } from "@/lib/version";
import { PressButton } from "@/components/stand/ui";

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

function isIos(): boolean {
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return true;
  const nav = navigator as Navigator & { platform?: string; maxTouchPoints?: number };
  return nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1;
}

export function runningAsInstalledApp(): boolean {
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    }
  ).Capacitor;
  try {
    if (cap?.isNativePlatform?.()) return true;
    const platform = cap?.getPlatform?.();
    if (platform === "android" || platform === "ios") return true;
  } catch {
    // A normal browser has no Capacitor.
  }
  if (/Android/i.test(navigator.userAgent) && /; wv\)/i.test(navigator.userAgent)) return true;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

function startDownload() {
  const link = document.createElement("a");
  link.href = APP_APK_URL;
  link.download = APP_APK_NAME;
  link.rel = "noopener";
  link.target = "_blank";
  document.body.append(link);
  link.click();
  link.remove();
}

export function InstallView({ onUseHere }: { onUseHere: () => void }) {
  const android = isAndroid();
  const ios = isIos();
  const started = useRef(false);
  const [status, setStatus] = useState(
    android ? "Starting the download…" : ios ? "Add it from Safari." : "Pick your phone.",
  );

  useEffect(() => {
    if (!android || started.current) return;
    started.current = true;
    const timer = window.setTimeout(() => {
      setStatus(`Download started. Open ${APP_APK_NAME}, then tap Install.`);
      startDownload();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [android]);

  return (
    <section className="rounded-card border border-line bg-card px-4 py-6">
      <p className="text-sm text-muted">
        {ios ? "Apple" : android ? "Android" : "Android and Apple"} · v{APP_VERSION}
      </p>
      <h2 className="mt-1 font-display text-3xl text-balance">
        {ios ? "Install on iPhone" : android ? "Install on Android" : "Install Flower Stand"}
      </h2>
      {ios ? (
        <>
          <p className="mt-3 text-sm text-pretty text-muted">
            Apple will not install an Android file. In Safari, add this page to your Home Screen. The book stays on the
            phone.
          </p>
          <ol className="mt-4 grid list-decimal gap-2 pl-5 text-sm">
            <li>
              Open this page in <span className="font-medium">Safari</span>
            </li>
            <li>
              Tap <span className="font-medium">Share</span> (the square with the arrow)
            </li>
            <li>
              Tap <span className="font-medium">Add to Home Screen</span>
            </li>
            <li>
              Tap <span className="font-medium">Add</span>, then open Flower Stand from the home screen
            </li>
          </ol>
          <p className="mt-4 text-sm text-pretty text-muted">{status}</p>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-pretty text-muted">
            Android gets the app file. iPhone and iPad use Safari and Add to Home Screen. Nothing is uploaded.
          </p>
          <PressButton
            className="mt-4 w-full"
            onClick={() => {
              setStatus(`Download started. Open ${APP_APK_NAME}, then tap Install.`);
              startDownload();
            }}
          >
            Download {APP_APK_NAME}
          </PressButton>
          <p className="mt-3 text-sm text-pretty text-muted">{status}</p>
          {android ? (
            <ol className="mt-4 grid list-decimal gap-2 pl-5 text-sm">
              <li>
                Open <span className="font-medium">{APP_APK_NAME}</span>
              </li>
              <li>
                Allow <span className="font-medium">Install unknown apps</span> if Android asks
              </li>
              <li>
                Tap <span className="font-medium">Install</span>, then Open
              </li>
            </ol>
          ) : (
            <a className="mt-4 block text-sm font-medium text-moss underline" href={APP_INSTALL_URL}>
              iPhone or iPad — open this page in Safari
            </a>
          )}
        </>
      )}
      <p className="mt-4 break-all text-sm text-muted">{APP_INSTALL_URL.replace("https://", "")}</p>
      <PressButton variant="quiet" className="mt-4 w-full" onClick={onUseHere}>
        Use it in this browser
      </PressButton>
    </section>
  );
}
