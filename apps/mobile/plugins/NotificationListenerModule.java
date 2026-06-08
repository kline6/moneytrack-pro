package com.moneytrack.pro;

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
