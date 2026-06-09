package com.moneytrack.pro.notification

import android.app.Notification
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap

class NotificationListenerService : NotificationListenerService() {

    companion object {
        private val PAYMENT_PACKAGES = setOf(
            "com.tencent.mm",           // WeChat
            "com.eg.android.AlipayGphone" // Alipay
        )
        private var lastProcessedKey: String? = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName !in PAYMENT_PACKAGES) return

        val notification = sbn.notification ?: return
        val extras = notification.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()

        val content = bigText ?: text
        if (content.isBlank()) return

        // Deduplicate
        val key = "${sbn.packageName}_${sbn.postTime}_$content"
        if (key == lastProcessedKey) return
        lastProcessedKey = key

        val source = when (sbn.packageName) {
            "com.tencent.mm" -> "wechat"
            "com.eg.android.AlipayGphone" -> "alipay"
            else -> "unknown"
        }

        // Try to extract amount: look for patterns like ¥123.45 or 123.45元
        val amountRegex = Regex("""[¥￥]?\s*(\d+\.?\d*)\s*元?""")
        val match = amountRegex.find(content)
        val amount = match?.groupValues?.get(1)?.toDoubleOrNull() ?: return

        if (amount <= 0) return

        val merchant = title.replace(Regex("(微信|支付宝)(支付)?"), "").trim()

        try {
            val appContext = applicationContext
            val reactContext = com.facebook.react.ReactApplication::class.java
                .let { (appContext as? com.facebook.react.ReactApplication)?.reactNativeHost?.reactInstanceManager?.currentReactContext as? ReactApplicationContext }
                ?: return

            val params: WritableMap = Arguments.createMap().apply {
                putDouble("amount", amount)
                putString("merchant", merchant)
                putString("source", source)
                putString("rawTitle", title)
                putString("rawText", content)
                putDouble("timestamp", sbn.postTime.toDouble())
            }
            NotificationListenerModule.sendEvent(reactContext, params)
        } catch (e: Exception) {
            // Silently ignore - React context may not be ready
        }
    }
}
