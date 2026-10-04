package app.flowerstand.book;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Download the next Flower Stand APK inside the app, then open Android's Install screen
 * while the app is still in front. Does not open a browser.
 */
@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private volatile boolean cancelled = false;

    @PluginMethod
    public void canInstallPackages(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ret.put("allowed", getContext().getPackageManager().canRequestPackageInstalls());
        } else {
            ret.put("allowed", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        final String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getContext().getPackageManager().canRequestPackageInstalls()) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(intent);
            } catch (Exception ignored) {
            }
            call.reject("Allow Install unknown apps for Flower Stand, then tap Get up to date again.");
            return;
        }

        cancelled = false;
        call.setKeepAlive(true);
        new Thread(() -> {
            try {
                emit(1, "Downloading the update inside Flower Stand…");
                File apkFile = downloadToFile(url);
                if (cancelled) {
                    call.reject("Cancelled");
                    return;
                }
                if (apkFile == null || apkFile.length() < 100_000L || !isZip(apkFile)) {
                    call.reject("Download incomplete. Try again on Wi-Fi.");
                    return;
                }
                emit(99, "Opening Android's Install screen…");
                mainHandler.post(() -> {
                    try {
                        openSystemInstall(apkFile);
                        JSObject ok = new JSObject();
                        ok.put("installed", false);
                        ok.put("prompted", true);
                        call.resolve(ok);
                        emit(100, "Tap Install. The stand stays on the phone.");
                    } catch (Exception e) {
                        call.reject("Could not open Install: " + e.getMessage());
                    }
                });
            } catch (Exception e) {
                mainHandler.post(() -> call.reject("Download error: " + e.getMessage()));
            }
        }, "flower-stand-apk").start();
    }

    private File downloadToFile(String startUrl) throws Exception {
        HttpURLConnection conn = openFollowingRedirects(startUrl);
        try {
            int code = conn.getResponseCode();
            if (code < 200 || code >= 300) {
                throw new IllegalStateException("HTTP " + code);
            }
            long total = conn.getContentLengthLong();
            File dir = new File(getContext().getCacheDir(), "updates");
            if (!dir.exists() && !dir.mkdirs()) {
                throw new IllegalStateException("Couldn't prepare the update file");
            }
            File apkFile = new File(dir, "flower-stand.apk");
            if (apkFile.exists()) apkFile.delete();
            try (InputStream in = new BufferedInputStream(conn.getInputStream(), 256 * 1024);
                    OutputStream out = new FileOutputStream(apkFile)) {
                byte[] buf = new byte[256 * 1024];
                long read = 0;
                int n;
                int lastPct = 0;
                while ((n = in.read(buf)) != -1) {
                    if (cancelled) throw new IllegalStateException("Cancelled");
                    out.write(buf, 0, n);
                    read += n;
                    if (total > 0) {
                        int pct = (int) Math.min(98, (read * 100L) / total);
                        if (pct >= lastPct + 1) {
                            lastPct = pct;
                            emit(pct, "Downloading… " + pct + "%");
                        }
                    }
                }
                out.flush();
            }
            return apkFile;
        } finally {
            conn.disconnect();
        }
    }

    /** Open the system installer from the foreground app. A background prompt never appears. */
    private void openSystemInstall(File apk) {
        Activity activity = getActivity();
        if (activity == null) {
            throw new IllegalStateException("Open Flower Stand, then tap Get up to date again.");
        }
        Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.setClipData(ClipData.newRawUri("Flower Stand update", uri));
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        activity.startActivity(intent);
    }

    private boolean isZip(File file) {
        try (FileInputStream in = new FileInputStream(file)) {
            byte[] magic = new byte[2];
            return in.read(magic) == 2 && magic[0] == 'P' && magic[1] == 'K';
        } catch (Exception e) {
            return false;
        }
    }

    private HttpURLConnection openFollowingRedirects(String startUrl) throws Exception {
        String current = startUrl;
        HttpURLConnection conn = null;
        for (int i = 0; i < 8; i++) {
            URL u = new URL(current);
            conn = (HttpURLConnection) u.openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(45_000);
            conn.setReadTimeout(180_000);
            conn.setRequestProperty("Accept", "*/*");
            conn.setRequestProperty("User-Agent", "FlowerStand-InAppUpdater/1.1");
            conn.connect();
            int code = conn.getResponseCode();
            if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                String loc = conn.getHeaderField("Location");
                conn.disconnect();
                if (loc == null || loc.isEmpty()) throw new IllegalStateException("Redirect without a location");
                current = new URL(u, loc).toString();
                continue;
            }
            return conn;
        }
        throw new IllegalStateException("Too many redirects");
    }

    private void emit(int percent, String message) {
        JSObject event = new JSObject();
        event.put("percent", percent);
        event.put("message", message);
        mainHandler.post(() -> notifyListeners("apkProgress", event));
    }

    @Override
    protected void handleOnDestroy() {
        cancelled = true;
        super.handleOnDestroy();
    }
}
