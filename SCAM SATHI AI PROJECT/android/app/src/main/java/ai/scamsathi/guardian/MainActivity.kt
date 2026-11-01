package ai.scamsathi.guardian

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast

/**
 * ScamSathi AI Android Application Host
 * Loads the mobile-first responsive PWA with secure native Android bridge
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        // Secure JavaScript interface for native device features
        webView.addJavascriptInterface(ScamSathiNativeBridge(this), "AndroidBridge")

        // Load local asset or deployed PWA host
        val targetUrl = intent.getStringExtra("EXTRA_TARGET_URL") ?: "https://scamsathi.local/pwa/index.html"
        webView.loadUrl(targetUrl)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}

/**
 * Safe JavaScript interface providing native device alerts and haptic feedback
 */
class ScamSathiNativeBridge(private val activity: Activity) {

    @JavascriptInterface
    fun triggerHapticFeedback(level: String) {
        // Haptic pulse for High or Critical Scam Alerts
        activity.runOnUiThread {
            Toast.makeText(activity, "🛡️ ScamSathi Alert Triggered", Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun getAppVersion(): String {
        return "3.0.0-Hackathon"
    }
}

