const fs = require("fs");
const path = require("path");

const base = "E:\\项目合集\\理财app\\apps\\mobile\\android\\app\\src\\main\\java\\com\\moneytrack\\pro";

// 1. NotificationListenerModule.java
fs.writeFileSync(path.join(base, "NotificationListenerModule.java"), `package com.moneytrack.pro;

import android.content.Intent;
import android.os.Build;
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
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void isPermissionGranted(Promise promise) {
        String pkgName = reactContext.getPackageName();
        String flat = Settings.Secure.getString(reactContext.getContentResolver(), "enabled_notification_listeners");
        boolean granted = !TextUtils.isEmpty(flat) && flat.contains(pkgName);
        promise.resolve(granted);
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
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(EVENT_NAME, params);
        }
    }
}
`, "utf8");
console.log("NotificationListenerModule.java");

// 2. PaymentNotificationListenerService.java
fs.writeFileSync(path.join(base, "PaymentNotificationListenerService.java"), `package com.moneytrack.pro;

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
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(\\\\d+\\\\.?\\\\d*)\\\\s*(?:\\\\u5143)?");
    private static final Pattern YEN_PATTERN = Pattern.compile("[\\\\u00a5\\\\uffe5]\\\\s*(\\\\d+\\\\.?\\\\d*)");

    private static NotificationListenerModule module;

    public static void setModule(NotificationListenerModule m) {
        module = m;
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null || module == null) return;

        String pkg = sbn.getPackageName();
        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;
        if (extras == null) return;

        CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
        String title = titleCs != null ? titleCs.toString() : "";
        String text = textCs != null ? textCs.toString() : "";
        if (title.isEmpty() && text.isEmpty()) return;

        String combined = title + " " + text;

        try {
            if (PKG_WECHAT.equals(pkg)) {
                handleWechat(title, text, combined);
            } else if (PKG_ALIPAY.equals(pkg)) {
                handleAlipay(title, text, combined);
            }
        } catch (Exception e) {
            Log.e(TAG, "Parse error: " + e.getMessage());
        }
    }

    private void handleWechat(String title, String text, String combined) {
        boolean isPayment = combined.contains("\\u5fae\\u4fe1\\u652f\\u4ed8") ||
                           combined.contains("\\u652f\\u4ed8\\u6210\\u529f") ||
                           combined.contains("\\u4ed8\\u6b3e\\u6210\\u529f") ||
                           combined.contains("\\u8f6c\\u8d26") ||
                           combined.contains("\\u7ea2\\u5305");
        if (!isPayment) return;

        double amount = extractAmount(combined);
        if (amount <= 0) return;

        String merchant = extractMerchant(title, text, "\\u5fae\\u4fe1");
        if (combined.contains("\\u7ea2\\u5305")) merchant = "\\u5fae\\u4fe1\\u7ea2\\u5305";

        module.sendPaymentEvent(amount, merchant, "wechat", title, text);
    }

    private void handleAlipay(String title, String text, String combined) {
        boolean isPayment = combined.contains("\\u4ed8\\u6b3e") ||
                           combined.contains("\\u8f6c\\u8d26") ||
                           combined.contains("\\u6d88\\u8d39") ||
                           combined.contains("\\u5237\\u5361\\u652f\\u4ed8") ||
                           combined.contains("\\u6263\\u6b3e");
        if (!isPayment) return;

        double amount = extractAmount(combined);
        if (amount <= 0) return;

        String merchant = extractMerchant(title, text, "\\u652f\\u4ed8\\u5b9d");

        module.sendPaymentEvent(amount, merchant, "alipay", title, text);
    }

    private double extractAmount(String text) {
        Matcher m = YEN_PATTERN.matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1)); } catch (NumberFormatException e) {}
        }
        // Try XX.XX元 pattern
        Pattern suffixPattern = Pattern.compile("(\\\\d+\\\\.?\\\\d*)\\\\s*\\\\u5143");
        m = suffixPattern.matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1)); } catch (NumberFormatException e) {}
        }
        // Fallback: any number that looks like money
        m = AMOUNT_PATTERN.matcher(text);
        if (m.find()) {
            try {
                double val = Double.parseDouble(m.group(1));
                if (val > 0) return val;
            } catch (NumberFormatException e) {}
        }
        return 0;
    }

    private String extractMerchant(String title, String text, String defaultName) {
        String cleaned = text
            .replace("\\u5fae\\u4fe1\\u652f\\u4ed8", "")
            .replace("\\u652f\\u4ed8\\u6210\\u529f", "")
            .replace("\\u4ed8\\u6b3e\\u6210\\u529f", "")
            .replace("\\u8f6c\\u8d26\\u6210\\u529f", "")
            .replace("\\u6d88\\u8d39\\u6210\\u529f", "")
            .replaceAll("[\\\\u00a5\\\\uffe5]\\\\s*\\\\d+\\\\.?\\\\d*", "")
            .replaceAll("\\\\d+\\\\.?\\\\d*\\\\s*\\\\u5143", "")
            .trim();

        if (cleaned.length() > 0 && cleaned.length() < 30) return cleaned;
        if (title.length() > 0 && title.length() < 20) return title;
        return defaultName;
    }
}
`, "utf8");
console.log("PaymentNotificationListenerService.java");

// 3. NotificationListenerPackage.java
fs.writeFileSync(path.join(base, "NotificationListenerPackage.java"), `package com.moneytrack.pro;

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
`, "utf8");
console.log("NotificationListenerPackage.java");
console.log("All Java files written!");
