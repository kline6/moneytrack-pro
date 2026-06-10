package com.moneytrack.pro.notification

import android.content.Intent
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.ReactApplication

class NotificationListenerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "MoneyTrackNL"

        fun getReactContext(appContext: android.content.Context): ReactApplicationContext? {
            return try {
                val app = appContext as? ReactApplication ?: return null
                val host = app.reactNativeHost ?: return null
                val manager = host.reactInstanceManager ?: return null
                manager.currentReactContext as? ReactApplicationContext
            } catch (e: Exception) {
                Log.e(TAG, "Failed to get ReactContext", e)
                null
            }
        }

        fun sendEvent(reactContext: ReactApplicationContext, params: WritableMap) {
            try {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onPaymentDetected", params)
                Log.d(TAG, "Event sent to JS")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send event to JS", e)
            }
        }
    }

    override fun getName(): String = "NotificationListener"

    @ReactMethod
    fun isPermissionGranted(promise: Promise) {
        try {
            val context = reactApplicationContext
            val componentName = android.content.ComponentName(context, NotificationListenerService::class.java).flattenToString()
            val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
            val enabled = flat?.contains(componentName) == true
            Log.d(TAG, "isPermissionGranted: $enabled (componentName=$componentName, flat=$flat)")
            promise.resolve(enabled)
        } catch (e: Exception) {
            Log.e(TAG, "isPermissionGranted failed", e)
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestPermission() {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "requestPermission failed", e)
        }
    }
}
