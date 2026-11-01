package ai.scamsathi.guardian

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationCompat

/**
 * Optional Real-Time Notification Inspection Service
 * Requires explicit user toggle in Android Settings -> Special App Access -> Notification Access.
 * Complies strictly with Google Play User Data policies:
 *  - Only inspects notification text for known urgent scam patterns (UPI PIN, APK, Bijli disconnect)
 *  - Runs 100% locally on device
 *  - Never logs or transmits private conversations or credentials
 */
class ScamNotificationListener : NotificationListenerService() {

    private val CHANNEL_ID = "scamsathi_threat_alerts"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return

        // Skip our own notifications to avoid recursion
        if (sbn.packageName == packageName) return

        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val combined = "$title $text".lowercase()

        // Quick on-device heuristic filter
        val isUpiTrap = combined.contains("upi pin") && (combined.contains("receive") || combined.contains("claim"))
        val isBijliApk = (combined.contains("bijli") || combined.contains("electricity")) && (combined.contains(".apk") || combined.contains("9:30 pm"))
        val isDigitalArrest = combined.contains("digital arrest") || (combined.contains("customs") && combined.contains("drugs"))

        if (isUpiTrap || isBijliApk || isDigitalArrest) {
            val threatName = when {
                isUpiTrap -> "UPI PIN Reverse-Payment Trap"
                isBijliApk -> "Fake Electricity Bill APK Malware"
                else -> "Digital Arrest Extortion"
            }
            triggerThreatWarning(threatName, sbn.packageName)
        }
    }

    private fun triggerThreatWarning(threatType: String, fromPackage: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val alertNotification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("🚨 ScamSathi Alert: $threatType")
            .setContentText("Incoming notification from $fromPackage contains suspicious cyber fraud patterns. Tap to inspect safely.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        manager.notify(1930, alertNotification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ScamSathi Threat Advisories",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Immediate warnings for detected high-risk cyber scams"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}

