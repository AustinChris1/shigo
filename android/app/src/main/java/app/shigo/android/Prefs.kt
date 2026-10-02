package app.shigo.android

import android.content.Context
import androidx.core.content.edit

// The phone key from pairing. App-private storage, excluded from backups, so it never leaves this phone.
object Prefs {
    private const val FILE = "shigo"
    private const val KEY = "device_key"
    private val FORMAT = Regex("^shd_[A-Za-z0-9_-]{20,}$")

    fun key(ctx: Context): String? = ctx.getSharedPreferences(FILE, Context.MODE_PRIVATE).getString(KEY, null)

    fun setKey(ctx: Context, key: String?) {
        if (key != null && !FORMAT.matches(key)) return
        ctx.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit { if (key == null) remove(KEY) else putString(KEY, key) }
    }
}
