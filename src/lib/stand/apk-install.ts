import { registerPlugin } from "@capacitor/core";
import { APP_APK_NAME } from "@/lib/version";

type Progress = { percent?: number; message?: string };

type ApkInstallerPlugin = {
  downloadAndInstall(options: { url: string; fileName?: string }): Promise<{ installed?: boolean }>;
  addListener(event: "apkProgress", listener: (event: Progress) => void): Promise<{ remove: () => void }>;
};

const ApkInstaller = registerPlugin<ApkInstallerPlugin>("ApkInstaller");

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

/** True only inside the installed Android app, not a browser tab. */
export function isNativeAndroidApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.()) return false;
  const platform = cap.getPlatform?.();
  return platform === "android" || /android/i.test(navigator.userAgent);
}

/** Download the new app file inside Flower Stand, then Android asks to tap Install. */
export async function installApkInsideApp(
  url: string,
  onProgress?: (message: string) => void,
): Promise<string> {
  let remove = () => {};
  try {
    const listener = await ApkInstaller.addListener("apkProgress", (event) => {
      if (event.message) onProgress?.(event.message);
      else if (typeof event.percent === "number" && event.percent >= 0) onProgress?.(`Downloading… ${event.percent}%`);
    });
    remove = () => listener.remove();
  } catch {
    // Progress is optional. The download still runs.
  }
  try {
    onProgress?.("Downloading the update inside Flower Stand…");
    await ApkInstaller.downloadAndInstall({ url, fileName: APP_APK_NAME });
    return "Tap Install on the Android screen. Flower Stand stays on the phone, and so does the book.";
  } finally {
    remove();
  }
}
