/** Bump this on every update the stand should be able to see. Keep public/sw.js and public/app-update.json in sync. */
export const APP_VERSION = "1.9.0";

export const APP_NAME = "Flower Stand";

/** The only place the app is downloaded. Not a hosted Grok site. */
export const APP_SOURCE_URL = "https://github.com/thelubemaster/flower-stand-tracker";

export const GITHUB_OWNER = "thelubemaster";
export const GITHUB_REPO = "flower-stand-tracker";

/** Same install page the receipt tracker uses: GitHub Pages, not a Grok host. */
export const APP_INSTALL_URL = "https://thelubemaster.github.io/flower-stand-tracker/?install=1";

export const GITHUB_PAGES_BASE = "https://thelubemaster.github.io/flower-stand-tracker";

export const APP_APK_URL =
  "https://github.com/thelubemaster/flower-stand-tracker/releases/latest/download/flower-stand.apk";

export const APP_APK_NAME = "flower-stand.apk";

/** Latest release API. Public repo, so the phone can check without an account. */
export const GITHUB_RELEASES_LATEST =
  "https://api.github.com/repos/thelubemaster/flower-stand-tracker/releases/latest";

export function githubApkForTag(tag: string): string {
  const t = tag.startsWith("v") ? tag : `v${tag}`;
  return `${APP_SOURCE_URL}/releases/download/${t}/${APP_APK_NAME}`;
}

export const LOCAL_CACHE = `flower-stand-${APP_VERSION}`;

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  changes: string[];
};

/** Newest first. Shown in the update sheet. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.9.0",
    date: "2026-10-03",
    title: "Get up to date stays in the app",
    changes: [
      "The button refreshes the Flower Stand already on this phone",
      "It does not send you to download the app again",
      "Android installs the next copy from inside the app",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-10-03",
    title: "Why the price came down",
    changes: [
      "A drop asks if it was priced too high or the season is ending",
      "The record keeps the item, the old price, the new price, and when",
      "Prices on the record shows every markdown",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-10-03",
    title: "A backup, a live count, and dusk prices",
    changes: [
      "Save the whole book as a file and put it back on a phone",
      "Update how many are still out without taking the lot off",
      "Day screen shows the jar, what came off, and one-tap markdowns",
    ],
  },
  {
    version: "1.6.1",
    date: "2026-10-03",
    title: "A little mum for the icon",
    changes: ["Cute flower-in-a-pot logo on the home screen and next to the name"],
  },
  {
    version: "1.6.0",
    date: "2026-10-03",
    title: "Updates work like the receipt tracker",
    changes: [
      "The version checks GitHub when the app opens",
      "A dot means this phone is behind the published copy",
      "Android downloads the new app file from the GitHub release",
      "iPhone reloads the home-screen copy from GitHub",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-10-03",
    title: "Install from GitHub",
    changes: [
      "Android gets the app file from the GitHub release",
      "iPhone adds the GitHub install page to the Home Screen",
    ],
  },
];
