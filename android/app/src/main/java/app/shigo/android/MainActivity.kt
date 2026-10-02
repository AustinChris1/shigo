package app.shigo.android

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.res.Configuration
import android.net.Uri
import android.os.Bundle
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.addCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.net.toUri
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

// The app is the Shigo website in a WebView, plus the bank-app alert reader. Only Shigo's own pages open in here;
// WhatsApp, phone and other links go to their own apps.
class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private lateinit var root: FrameLayout
    private val base: Uri = BuildConfig.BASE_URL.toUri()
    private var fileCallback: ValueCallback<Array<Uri>>? = null

    private val pickFile = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        fileCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(r.resultCode, r.data))
        fileCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        root = FrameLayout(this)
        web = WebView(this)
        root.addView(web, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        setContentView(root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }
        applySystemBarColours()

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false // the "it has entered" chime plays without a tap
            userAgentString = "$userAgentString ShigoAndroid/${BuildConfig.VERSION_NAME}"
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                if (isShigo(u)) return false
                openOutside(u)
                return true
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) view.loadDataWithBaseURL(null, offlinePage(), "text/html", "utf-8", null)
            }

            // Low-memory phones may kill the page's renderer. Start over instead of crashing.
            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                root.removeView(view)
                view.destroy()
                recreate()
                return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return try {
                    pickFile.launch(params.createIntent()); true
                } catch (e: ActivityNotFoundException) {
                    fileCallback = null; false
                }
            }
        }
        Bridge.install(this, web)

        onBackPressedDispatcher.addCallback(this) {
            if (web.canGoBack()) web.goBack() else { isEnabled = false; onBackPressedDispatcher.onBackPressed() }
        }

        if (savedInstanceState != null) web.restoreState(savedInstanceState) else web.loadUrl("${BuildConfig.BASE_URL}/app")
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        applySystemBarColours()
    }

    private fun isShigo(u: Uri) = (u.scheme == "https" || u.scheme == "http") && u.host == base.host && u.port == base.port

    private fun openOutside(u: Uri) {
        val intent = if (u.scheme == "intent") {
            runCatching { Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME).apply { selector = null; component = null } }.getOrNull() ?: return
        } else Intent(Intent.ACTION_VIEW, u)
        try {
            startActivity(intent.addCategory(Intent.CATEGORY_BROWSABLE))
        } catch (e: ActivityNotFoundException) {
            // WhatsApp not installed and no fallback: nothing to open.
        }
    }

    private fun dark() = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

    private fun applySystemBarColours() {
        root.setBackgroundColor(getColor(R.color.bg))
        WindowCompat.getInsetsController(window, root).apply {
            isAppearanceLightStatusBars = !dark()
            isAppearanceLightNavigationBars = !dark()
        }
    }

    private fun offlinePage(): String {
        val bg = if (dark()) "#0E1311" else "#FBFBF8"
        val ink = if (dark()) "#E8ECE9" else "#141A17"
        return """<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
            <body style="margin:0;display:grid;place-items:center;min-height:100vh;background:$bg;color:$ink;font-family:sans-serif;text-align:center;padding:24px">
            <div><h2 style="margin:0 0 8px">No connection</h2><p style="opacity:.75;margin:0 0 20px">Shigo needs the internet to check payments.</p>
            <a href="${BuildConfig.BASE_URL}/app" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#14783C;color:#fff;text-decoration:none;font-weight:600">Try again</a></div></body>"""
    }
}
