/**
 * After `cap add android`, drop the in-app installer into the generated project.
 * The Android app then updates itself. It does not open a browser.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const javaDir = join(root, "android/app/src/main/java/app/flowerstand/book");
const pluginSrc = join(root, "android-shell/ApkInstallerPlugin.java");
const pluginDest = join(javaDir, "ApkInstallerPlugin.java");
const main = join(javaDir, "MainActivity.java");
const manifest = join(root, "android/app/src/main/AndroidManifest.xml");

if (!existsSync(main) || !existsSync(manifest)) {
  console.error("Android project is missing. Run cap add android first.");
  process.exit(1);
}

copyFileSync(pluginSrc, pluginDest);

let activity = readFileSync(main, "utf8");
if (!activity.includes("ApkInstallerPlugin")) {
  if (!activity.includes("import android.os.Bundle;")) {
    activity = activity.replace(
      "import com.getcapacitor.BridgeActivity;",
      "import android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;",
    );
  }
  if (activity.includes("public class MainActivity extends BridgeActivity {}")) {
    activity = activity.replace(
      "public class MainActivity extends BridgeActivity {}",
      `public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}`,
    );
  } else if (activity.includes("super.onCreate(savedInstanceState);")) {
    activity = activity.replace(
      "super.onCreate(savedInstanceState);",
      "registerPlugin(ApkInstallerPlugin.class);\n        super.onCreate(savedInstanceState);",
    );
  } else {
    console.error("Could not register ApkInstallerPlugin in MainActivity.");
    process.exit(1);
  }
  writeFileSync(main, activity);
}

let xml = readFileSync(manifest, "utf8");
if (!xml.includes("REQUEST_INSTALL_PACKAGES")) {
  xml = xml.replace(
    "<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\">",
    `<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />`,
  );
  if (!xml.includes("REQUEST_INSTALL_PACKAGES")) {
    console.error("Could not add the install permission.");
    process.exit(1);
  }
  writeFileSync(manifest, xml);
}

copyFileSync(join(root, "android-shell/flower-stand.keystore"), join(root, "android/app/flower-stand.keystore"));

const gradlePath = join(root, "android/app/build.gradle");
let gradle = readFileSync(gradlePath, "utf8");
if (!gradle.includes("flower-stand.keystore")) {
  const signed = `signingConfigs {
        flowerstand {
            storeFile file("flower-stand.keystore")
            storePassword "fs-stand-9f3c1a7e"
            keyAlias "flowerstand"
            keyPassword "fs-stand-9f3c1a7e"
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.flowerstand
        }
        release {
            signingConfig signingConfigs.flowerstand
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }`;
  if (!gradle.includes("buildTypes {")) {
    console.error("Could not find buildTypes in the Android project.");
    process.exit(1);
  }
  gradle = gradle.replace(/buildTypes \{[\s\S]*?\n    \}/, signed);
  if (!gradle.includes("flower-stand.keystore")) {
    console.error("Could not sign the Android app with the stable key.");
    process.exit(1);
  }
  writeFileSync(gradlePath, gradle);
}

console.log("In-app updater is in the Android project.");
