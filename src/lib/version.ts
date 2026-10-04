/** Bump this on every update the stand should be able to see. Keep public/sw.js in sync. */
export const APP_VERSION = "1.5.0";

export const APP_NAME = "Flower Stand";

/** The only place the app is downloaded. Not a hosted Grok site. */
export const APP_SOURCE_URL = "https://github.com/thelubemaster/flower-stand-tracker";

/** Same install page the receipt tracker uses: GitHub Pages, not a Grok host. */
export const APP_INSTALL_URL = "https://thelubemaster.github.io/flower-stand-tracker/?install=1";

export const APP_APK_URL =
  "https://github.com/thelubemaster/flower-stand-tracker/releases/latest/download/flower-stand.apk";

export const APP_APK_NAME = "flower-stand.apk";

export const LOCAL_CACHE = `flower-stand-${APP_VERSION}`;
