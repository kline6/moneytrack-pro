package com.moneytrack.pro;

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
        if (!combined.contains("\u5fae\u4fe1\u652f\u4ed8") && !combined.contains("\u652f\u4ed8\u6210\u529f") &&
            !combined.contains("\u4ed8\u6b3e\u6210\u529f") && !combined.contains("\u8f6c\u8d26") &&
            !combined.contains("\u7ea2\u5305")) return;
        double amount = extractAmount(combined);
        if (amount <= 0) return;
        String merchant = extractMerchant(title, text, "\u5fae\u4fe1");
        if (combined.contains("\u7ea2\u5305")) merchant = "\u5fae\u4fe1\u7ea2\u5305";
        module.sendPaymentEvent(amount, merchant, "wechat", title, text);
    }

    private void handleAlipay(String title, String text, String combined) {
        if (!combined.contains("\u4ed8\u6b3e") && !combined.contains("\u8f6c\u8d26") &&
            !combined.contains("\u6d88\u8d39") && !combined.contains("\u6263\u6b3e")) return;
        double amount = extractAmount(combined);
        if (amount <= 0) return;
        String merchant = extractMerchant(title, text, "\u652f\u4ed8\u5b9d");
        module.sendPaymentEvent(amount, merchant, "alipay", title, text);
    }

    private double extractAmount(String text) {
        Pattern[] patterns = {
            Pattern.compile("[\u00a5\uffe5]\\s*(\\d+\\.?\\d*)"),
            Pattern.compile("(\\d+\\.?\\d*)\\s*\u5143"),
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
        String cleaned = text.replaceAll("[\u5fae\u4fe1\u652f\u4ed8\u652f\u4ed8\u6210\u529f\u4ed8\u6b3e\u6210\u529f\u8f6c\u8d26\u6210\u529f]", "")
            .replaceAll("[\u00a5\uffe5]\\s*\\d+\\.?\\d*", "").replaceAll("\\d+\\.?\\d*\\s*\u5143", "").trim();
        if (cleaned.length() > 0 && cleaned.length() < 30) return cleaned;
        if (title.length() > 0 && title.length() < 20 && !title.contains("\u5fae\u4fe1") && !title.contains("\u652f\u4ed8\u5b9d")) return title;
        return defaultName;
    }
}