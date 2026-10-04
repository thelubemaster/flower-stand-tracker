package app.flowerstand.book;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

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
 * Download the next Flower Stand APK inside the app, then open Android's Install sheet.
 * Does not open a browser.
 */
@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {
    private static final String ACTION_INSTALL_COMPLETE = "app.flowerstand.book.INSTALL_COMPLETE";

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private volatile boolean cancelled = false;
    private BroadcastReceiver installReceiver;

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
        final String fileName = call.getString("fileName", "flower-stand.apk");
        new Thread(() -> {
            try {
                emit(1, "Downloading the update inside Flower Stand…");
                File apkFile = downloadToFile(url, fileName);
                if (cancelled) {
                    call.reject("Cancelled");
                    return;
                }
                if (apkFile == null || apkFile.length() < 100_000L) {
                    call.reject("Download incomplete. Try again on Wi-Fi.");
                    return;
                }
                emit(99, "Opening the Install screen…");
                mainHandler.post(() -> {
                    try {
                        installWithPackageInstaller(apkFile);
                        JSObject ok = new JSObject();
                        ok.put("installed", true);
                        call.resolve(ok);
                        emit(100, "Tap Install on the Android screen. The book stays on the phone.");
                    } catch (Exception e) {
                        call.reject("Could not open Install: " + e.getMessage());
                    }
                });
            } catch (Exception e) {
                mainHandler.post(() -> call.reject("Download error: " + e.getMessage()));
            }
        }, "flower-stand-apk").start();
    }

    private File downloadToFile(String startUrl, String fileName) throws Exception {
        HttpURLConnection conn = openFollowingRedirects(startUrl);
        try {
            int code = conn.getResponseCode();
            if (code < 200 || code >= 300) {
                throw new IllegalStateException("HTTP " + code);
            }
            long total = conn.getContentLengthLong();
            File apkFile = new File(getContext().getFilesDir(), fileName);
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

    private void installWithPackageInstaller(File apk) throws Exception {
        Context ctx = getContext();
        PackageInstaller installer = ctx.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams params =
                new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        params.setAppPackageName(ctx.getPackageName());
        int sessionId = installer.createSession(params);
        PackageInstaller.Session session = installer.openSession(sessionId);
        try (InputStream in = new BufferedInputStream(new FileInputStream(apk));
                OutputStream out = session.openWrite("package", 0, apk.length())) {
            byte[] buf = new byte[256 * 1024];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            session.fsync(out);
        }
        registerInstallReceiver();
        Intent callback = new Intent(ACTION_INSTALL_COMPLETE);
        callback.setPackage(ctx.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) flags |= PendingIntent.FLAG_MUTABLE;
        PendingIntent pending = PendingIntent.getBroadcast(ctx, sessionId, callback, flags);
        session.commit(pending.getIntentSender());
        session.close();
    }

    private void registerInstallReceiver() {
        if (installReceiver != null) return;
        installReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
                if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                    Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
                    if (confirm != null) {
                        confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(confirm);
                    }
                }
            }
        };
        IntentFilter filter = new IntentFilter(ACTION_INSTALL_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(installReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(installReceiver, filter);
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
            conn.setRequestProperty("User-Agent", "FlowerStand-InAppUpdater/1.0");
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
        if (installReceiver != null) {
            try {
                getContext().unregisterReceiver(installReceiver);
            } catch (Exception ignored) {
            }
            installReceiver = null;
        }
        super.handleOnDestroy();
    }
}
