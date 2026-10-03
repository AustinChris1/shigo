package app.shigo.android

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.util.Base64
import androidx.core.graphics.drawable.toBitmap
import androidx.core.net.toUri
import java.io.ByteArrayOutputStream
import android.os.Build
import android.provider.Settings
import android.webkit.WebView
import androidx.core.app.NotificationManagerCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONArray
import org.json.JSONObject

// The Alerts page talks to the app as window.shigoAndroid. Android only exposes it to Shigo's own site (one origin),
// in the main frame, so no other page can link a phone or read its status. Protocol: src/components/AlertsSetup.tsx.
object Bridge {
    fun install(activity: Activity, web: WebView) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return
        val base = BuildConfig.BASE_URL.toUri()
        val origin = "${base.scheme}://${base.encodedAuthority}"
        WebViewCompat.addWebMessageListener(web, "shigoAndroid", setOf(origin)) { _, message, _, isMainFrame, reply ->
            if (!isMainFrame) return@addWebMessageListener
            val m = runCatching { JSONObject(message.data ?: "") }.getOrNull() ?: return@addWebMessageListener
            when (m.optString("type")) {
                "pair" -> Prefs.setKey(activity, m.optString("key"))
                "unpair" -> Prefs.setKey(activity, null)
                "openListenerSettings" -> openListenerSettings(activity)
                "openAppSettings" -> openAppSettings(activity)
                "debugTestAlert" -> DebugAlerts.post(activity, m.optString("title", "Money received"), m.optString("text"))
            }
            reply.postMessage(status(activity).toString())
        }
    }

    // The bank's own launcher icon from this phone, as a small PNG, so the page can show real logos without
    // Shigo hosting any bank's branding.
    private fun iconOf(pm: PackageManager, pkg: String): String? = runCatching {
        val bmp = pm.getApplicationIcon(pkg).toBitmap(96, 96)
        val out = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
        "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    }.getOrNull()

    fun status(ctx: Context): JSONObject {
        val pm = ctx.packageManager
        val installed = JSONArray()
        for ((pkg, label) in BankApps.ALL) {
            val present = runCatching { pm.getPackageInfo(pkg, 0) }.isSuccess
            if (present) installed.put(JSONObject().put("pkg", pkg).put("label", label).put("icon", iconOf(pm, pkg) ?: JSONObject.NULL))
        }
        val installer = runCatching {
            if (Build.VERSION.SDK_INT >= 30) pm.getInstallSourceInfo(ctx.packageName).installingPackageName
            else @Suppress("DEPRECATION") pm.getInstallerPackageName(ctx.packageName)
        }.getOrNull()
        return JSONObject()
            .put("type", "status")
            .put("version", BuildConfig.VERSION_NAME)
            .put("device", deviceName())
            .put("paired", Prefs.key(ctx) != null)
            .put("listenerEnabled", NotificationManagerCompat.getEnabledListenerPackages(ctx).contains(ctx.packageName))
            .put("installedApps", installed)
            .put("sdk", Build.VERSION.SDK_INT)
            .put("sideloaded", installer != "com.android.vending")
    }

    private fun deviceName(): String {
        val maker = Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
        return if (Build.MODEL.startsWith(Build.MANUFACTURER, ignoreCase = true)) Build.MODEL else "$maker ${Build.MODEL}"
    }

    private fun openListenerSettings(activity: Activity) {
        // Android 11+ can open Shigo's own switch. Some phone makers leave that screen out; fall back to the full list.
        var opened = false
        if (Build.VERSION.SDK_INT >= 30) {
            val component = ComponentName(activity, AlertListener::class.java).flattenToString()
            val detail = Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
                .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, component)
            opened = runCatching { activity.startActivity(detail) }.isSuccess
        }
        if (!opened) runCatching { activity.startActivity(Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")) }
    }

    private fun openAppSettings(activity: Activity) {
        runCatching {
            activity.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", activity.packageName, null)))
        }
    }
}
