package ai.scamsathi.guardian

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle

/**
 * Intercepts incoming "Share" actions from WhatsApp, Gmail, SMS, or Mobile Browser
 * Extracts text content and redirects to ScamSathi's local scanning engine
 */
class ShareTargetActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT) ?: ""
            handleSharedContent(sharedText)
        } else {
            finish()
        }
    }

    private fun handleSharedContent(text: String) {
        if (text.isBlank()) {
            finish()
            return
        }

        // Show instant preview dialog before opening full dashboard
        AlertDialog.Builder(this)
            .setTitle("🛡️ Scan with ScamSathi AI")
            .setMessage("Incoming shared content detected:\n\n\"${text.take(120)}...\"\n\nInspect this message with on-device heuristics?")
            .setPositiveButton("Scan Now") { _, _ ->
                val encodedText = Uri.encode(text)
                val targetUrl = "https://scamsathi.local/pwa/index.html?text=$encodedText"
                
                val mainIntent = Intent(this, MainActivity::class.java).apply {
                    putExtra("EXTRA_TARGET_URL", targetUrl)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                startActivity(mainIntent)
                finish()
            }
            .setNegativeButton("Cancel") { _, _ ->
                finish()
            }
            .setCancelable(true)
            .setOnCancelListener { finish() }
            .show()
    }
}

