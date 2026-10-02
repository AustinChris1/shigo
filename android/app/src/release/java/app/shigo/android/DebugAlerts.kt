package app.shigo.android

import android.content.Context

// Release builds cannot post test alerts; the real version lives in src/debug.
object DebugAlerts {
    @Suppress("UNUSED_PARAMETER")
    fun post(ctx: Context, title: String, text: String) = Unit
}
