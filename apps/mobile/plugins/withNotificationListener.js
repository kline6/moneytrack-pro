const { withAndroidManifest, withMainApplication, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PKG = "com.moneytrack.pro";
const SERVICE_CLASS = "PaymentNotificationListenerService";
const PACKAGE_CLASS = "NotificationListenerPackage";
const MODULE_CLASS = "NotificationListenerModule";

const JAVA_FILES = [
  "NotificationListenerModule.java",
  "NotificationListenerPackage.java",
  "PaymentNotificationListenerService.java",
];

function withNotificationListener(config) {
  // 1. Modify AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Add permission
    if (!manifest["uses-permission"]) manifest["uses-permission"] = [];
    const hasPerm = manifest["uses-permission"].some(
      (p) => p.$?.["android:name"] === "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    );
    if (!hasPerm) {
      manifest["uses-permission"].push({
        $: { "android:name": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" },
      });
    }

    // Add service to application
    const app = manifest.application?.[0];
    if (app) {
      if (!app.service) app.service = [];
      const hasService = app.service.some(
        (s) => s.$?.["android:name"] === `${PKG}.${SERVICE_CLASS}`
      );
      if (!hasService) {
        app.service.push({
          $: {
            "android:name": `${PKG}.${SERVICE_CLASS}`,
            "android:exported": "true",
            "android:permission": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
          },
          "intent-filter": [
            {
              action: [
                { $: { "android:name": "android.service.notification.NotificationListenerService" } },
              ],
            },
          ],
        });
      }
    }

    return config;
  });

  // 2. Register package in MainApplication
  config = withMainApplication(config, (config) => {
    const importLine = `import ${PKG}.${PACKAGE_CLASS};`;
    if (!config.modResults.contents.includes(importLine)) {
      // Add import
      config.modResults.contents = config.modResults.contents.replace(
        /(import com\.facebook\.react\.ReactPackage;)/,
        `$1\n${importLine}`
      );
    }

    // Add package to getPackages()
    const packageLine = `new ${PACKAGE_CLASS}()`;
    if (!config.modResults.contents.includes(packageLine)) {
      config.modResults.contents = config.modResults.contents.replace(
        /(packages\.add\(new MainReactPackage\(\)\);)/,
        `$1\n      packages.add(${packageLine});`
      );
    }

    return config;
  });

  // 3. Copy Java source files to android directory
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const javaDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java/com/moneytrack/pro"
      );

      if (!fs.existsSync(javaDir)) {
        fs.mkdirSync(javaDir, { recursive: true });
      }

      const pluginDir = path.join(config.modRequest.projectRoot, "plugins");

      for (const file of JAVA_FILES) {
        const src = path.join(pluginDir, file);
        const dest = path.join(javaDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      return config;
    },
  ]);

  return config;
}

module.exports = withNotificationListener;
