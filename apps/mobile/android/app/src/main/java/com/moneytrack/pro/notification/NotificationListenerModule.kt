package com.moneytrack.pro.notification

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationListenerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "NotificationListener"

    @ReactMethod
    fun isPermissionGranted(promise: Promise) {
        val context = reactApplicationContext
        val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
        val enabled = flat?.contains(context.packageName) == true
        promise.resolve(enabled)
    }

    @ReactMethod
    fun requestPermission() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactApplicationContext.startActivity(intent)
    }

    companion object {
        fun sendEvent(reactContext: ReactApplicationContext, params: WritableMap) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onPaymentDetected", params)
        }
    }
}
