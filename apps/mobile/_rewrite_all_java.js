const fs = require("fs");
const path = require("path");

const base = "E:\\项目合集\\理财app\\apps\\mobile\\android\\app\\src\\main\\java\\com\\moneytrack\\pro";
const pluginDir = "E:\\项目合集\\理财app\\apps\\mobile\\plugins";

// Ensure plugin dir exists
if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir, { recursive: true });

const files = {
  "NotificationListenerModule.java": `package com.moneytrack.pro;

import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

@ReactModule(name = NotificationListenerModule.NAME)
public class NotificationListenerModule extends ReactContextBaseJavaModule {
    public static final String NAME = "NotificationListener";
    private static final String EVENT_NAME = "onPaymentDetected";
    private final ReactApplicationContext reactContext;

    public NotificationListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        PaymentNotificationListenerService.setModule(this);
    }

    @NonNull
    @Override
    public String getName() { return NAME; }

    @ReactMethod
    public void isPermissionGranted(Promise promise) {
        String pkgName = reactContext.getPackageName();
        String flat = Settings.Secure.getString(reactContext.getContentResolver(), "enabled_notification_listeners");
        promise.resolve(!TextUtils.isEmpty(flat) && flat.contains(pkgName));
    }

    @ReactMethod
    public void requestPermission() {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(int count) {}

    public void sendPaymentEvent(double amountInYuan, String merchant, String source, String rawTitle, String rawText) {
        if (reactContext.hasActiveCatalystInstance()) {
            WritableMap params = Arguments.createMap();
            params.putDouble("amount", amountInYuan);
            params.putString("merchant", merchant != null ? merchant : "");
            params.putString("source", source);
            params.putString("rawTitle", rawTitle != null ? rawTitle : "");
            params.putString("rawText", rawText != null ? rawText : "");
            params.putDouble("timestamp", System.currentTimeMillis());
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(EVENT_NAME, params);
        }
    }
}
`,

  "NotificationListenerPackage.java": `package com.moneytrack.pro;

import androidx.annotation.NonNull;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class NotificationListenerPackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new NotificationListenerModule(reactContext));
        return modules;
    }
    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
`,

  "PaymentNotificationListenerService.java": `package com.moneytrack.pro;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PaymentNotificationListenerService extends NotificationListenerService {
    private static final String TAG = "PaymentNotification";
    private static final String PKG_WECHAT = "com.tencent.mm";
    private static final String PKG_ALIPAY = "com.eg.android.AlipayGphone";
    private static NotificationListenerModule module;

    public static void setModule(NotificationListenerModule m) { module = m; }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null || module == null) return;
        String pkg = sbn.getPackageName();
        Bundle extras = sbn.getNotification().extras;
        if (extras == null) return;
        CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
        String title = titleCs != null ? titleCs.toString() : "";
        String text = textCs != null ? textCs.toString() : "";
        if (title.isEmpty() && text.isEmpty()) return;
        String combined = title + " " + text;
        try {
            if (PKG_WECHAT.equals(pkg)) handleWechat(title, text, combined);
            else if (PKG_ALIPAY.equals(pkg)) handleAlipay(title, text, combined);
        } catch (Exception e) { Log.e(TAG, "Parse error: " + e.getMessage()); }
    }

    private void handleWechat(String title, String text, String combined) {
        if (!combined.contains("\\u5fae\\u4fe1\\u652f\\u4ed8") && !combined.contains("\\u652f\\u4ed8\\u6210\\u529f") &&
            !combined.contains("\\u4ed8\\u6b3e\\u6210\\u529f") && !combined.contains("\\u8f6c\\u8d26") &&
            !combined.contains("\\u7ea2\\u5305")) return;
        double amount = extractAmount(combined);
        if (amount <= 0) return;
        String merchant = extractMerchant(title, text, "\\u5fae\\u4fe1");
        if (combined.contains("\\u7ea2\\u5305")) merchant = "\\u5fae\\u4fe1\\u7ea2\\u5305";
        module.sendPaymentEvent(amount, merchant, "wechat", title, text);
    }

    private void handleAlipay(String title, String text, String combined) {
        if (!combined.contains("\\u4ed8\\u6b3e") && !combined.contains("\\u8f6c\\u8d26") &&
            !combined.contains("\\u6d88\\u8d39") && !combined.contains("\\u6263\\u6b3e")) return;
        double amount = extractAmount(combined);
        if (amount <= 0) return;
        String merchant = extractMerchant(title, text, "\\u652f\\u4ed8\\u5b9d");
        module.sendPaymentEvent(amount, merchant, "alipay", title, text);
    }

    private double extractAmount(String text) {
        Pattern[] patterns = {
            Pattern.compile("[\\u00a5\\uffe5]\\s*(\\d+\\.?\\d*)"),
            Pattern.compile("(\\d+\\.?\\d*)\\s*\\u5143"),
            Pattern.compile("(\\d+\\.?\\d*)")
        };
        for (Pattern p : patterns) {
            Matcher m = p.matcher(text);
            if (m.find()) {
                try { double v = Double.parseDouble(m.group(1)); if (v > 0) return v; } catch (NumberFormatException e) {}
            }
        }
        return 0;
    }

    private String extractMerchant(String title, String text, String defaultName) {
        String cleaned = text.replaceAll("[\\u5fae\\u4fe1\\u652f\\u4ed8\\u652f\\u4ed8\\u6210\\u529f\\u4ed8\\u6b3e\\u6210\\u529f\\u8f6c\\u8d26\\u6210\\u529f]", "")
            .replaceAll("[\\u00a5\\uffe5]\\s*\\d+\\.?\\d*", "").replaceAll("\\d+\\.?\\d*\\s*\\u5143", "").trim();
        if (cleaned.length() > 0 && cleaned.length() < 30) return cleaned;
        if (title.length() > 0 && title.length() < 20 && !title.contains("\\u5fae\\u4fe1") && !title.contains("\\u652f\\u4ed8\\u5b9d")) return title;
        return defaultName;
    }
}
`
};

// Write to both plugin dir and android dir
for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(pluginDir, filename), content, "utf8");
  fs.writeFileSync(path.join(base, filename), content, "utf8");
  console.log("Written:", filename);
}
