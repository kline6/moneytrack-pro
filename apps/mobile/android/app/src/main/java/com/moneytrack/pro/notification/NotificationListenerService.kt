package com.moneytrack.pro.notification

import android.app.Notification
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap

class NotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "MoneyTrackNL"
        private val PAYMENT_PACKAGES = setOf(
            "com.tencent.mm",
            "com.eg.android.AlipayGphone"
        )
        private var lastProcessedKey: String? = null

        fun isNotificationListenerEnabled(context: Context): Boolean {
            val flat = android.provider.Settings.Secure.getString(
                context.contentResolver,
                "enabled_notification_listeners"
            )
            if (flat.isNullOrBlank()) return false
            val componentName = ComponentName(context, NotificationListenerService::class.java).flattenToString()
            return flat.contains(componentName)
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName !in PAYMENT_PACKAGES) return

        val notification = sbn.notification ?: return
        val extras = notification.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()

        val content = bigText ?: text
        Log.d(TAG, "Notification from ${sbn.packageName}: title=$title text=$content bigText=$bigText subText=$subText")

        if (content.isBlank() && title.isBlank()) return

        // Deduplicate
        val key = "${sbn.packageName}_${sbn.postTime}_$content"
        if (key == lastProcessedKey) return
        lastProcessedKey = key

        val source = when (sbn.packageName) {
            "com.tencent.mm" -> "wechat"
            "com.eg.android.AlipayGphone" -> "alipay"
            else -> "unknown"
        }

        // Combine title + content for better parsing
        val fullText = "$title $content"

        // Skip non-payment notifications (transfer confirmations, etc.)
        val isPayment = fullText.contains("支付") || fullText.contains("付款") ||
                fullText.contains("消费") || fullText.contains("支出") ||
                fullText.contains("收款") || fullText.contains("转入") ||
                fullText.contains("已付") || fullText.contains("成功") ||
                fullText.contains("元") || fullText.contains("¥") || fullText.contains("￥")
        if (!isPayment) {
            Log.d(TAG, "Not a payment notification, skipping")
            return
        }

        // Extract amount - support multiple formats
        val amountPatterns = listOf(
            Regex("""[¥￥]\s*(\d+\.?\d*)"""),
            Regex("""(\d+\.?\d*)\s*元"""),
            Regex("""金额\s*(\d+\.?\d*)"""),
            Regex("""支付\s*[¥￥]?\s*(\d+\.?\d*)"""),
            Regex("""付款\s*[¥￥]?\s*(\d+\.?\d*)"""),
            Regex("""消费\s*[¥￥]?\s*(\d+\.?\d*)"""),
            Regex("""支出\s*[¥￥]?\s*(\d+\.?\d*)""")
        )

        var amount: Double? = null
        for (pattern in amountPatterns) {
            val match = pattern.find(fullText)
            if (match != null) {
                amount = match.groupValues[1].toDoubleOrNull()
                if (amount != null && amount > 0) break
                amount = null
            }
        }

        if (amount == null || amount <= 0) {
            Log.d(TAG, "Could not extract amount from: $fullText")
            return
        }

        // Extract merchant name
        val merchant = extractMerchant(title, content)
        Log.d(TAG, "Payment detected: $source $merchant $amount")

        try {
            val reactContext = NotificationListenerModule.getReactContext(applicationContext)
            if (reactContext == null) {
                Log.w(TAG, "ReactContext not available, event will be lost")
                return
            }

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
            Log.e(TAG, "Failed to send event", e)
        }
    }

    private fun extractMerchant(title: String, content: String): String {
        // Try to extract merchant from common patterns
        // "微信支付" -> remove prefix
        var merchant = title
            .replace(Regex("^(微信|支付宝)(支付|付款)?"), "")
            .replace(Regex("^(支付|付款|消费)"), "")
            .trim()

        if (merchant.isBlank()) {
            // Try content: "你在 XXX 消费了 ¥123.45"
            val merchantMatch = Regex("""在\s*(.+?)\s*(消费|支付|付款|花费)""").find(content)
            if (merchantMatch != null) {
                merchant = merchantMatch.groupValues[1].trim()
            }
        }

        if (merchant.isBlank()) merchant = "未知商户"
        return merchant
    }
}
