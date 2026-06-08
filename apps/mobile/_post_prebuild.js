const fs = require("fs");
const path = require("path");

const base = "E:\\项目合集\\理财app\\apps\\mobile\\android\\app\\src\\main\\java\\com\\moneytrack\\pro";
const pluginDir = "E:\\项目合集\\理财app\\apps\\mobile\\plugins";

// Copy Java files
const files = ["NotificationListenerModule.java", "NotificationListenerPackage.java", "PaymentNotificationListenerService.java"];
for (const f of files) {
  const src = path.join(pluginDir, f);
  const dst = path.join(base, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log("Copied:", f);
  } else {
    console.log("Missing source:", src);
  }
}

// Register package in MainApplication.kt
const ktFile = path.join(base, "MainApplication.kt");
let kt = fs.readFileSync(ktFile, "utf8");

if (!kt.includes("NotificationListenerPackage")) {
  // Add import after existing imports
  kt = kt.replace(
    /import com\.facebook\.react\.ReactPackage/,
    "import com.facebook.react.ReactPackage\nimport com.moneytrack.pro.NotificationListenerPackage"
  );
  
  // Add package registration
  kt = kt.replace(
    /packages\.add\(new MyReactNativePackage\(\)\)/,
    "packages.add(new MyReactNativePackage())\n            packages.add(NotificationListenerPackage())"
  );
  
  // If the above didn't match, try the comment pattern
  if (!kt.includes("packages.add(NotificationListenerPackage())")) {
    kt = kt.replace(
      /\/\/ packages\.add\(new MyReactNativePackage\(\)\);?/,
      "packages.add(NotificationListenerPackage())"
    );
  }
  
  fs.writeFileSync(ktFile, kt, "utf8");
  console.log("MainApplication.kt updated");
} else {
  console.log("MainApplication.kt already registered");
}
