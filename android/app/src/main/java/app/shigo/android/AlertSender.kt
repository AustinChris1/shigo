package app.shigo.android

import android.content.Context
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

// One alert as the phone saw it. Times are this phone's clock; the server only trusts the gaps between them.
data class Alert(
    val app: String,
    val title: String?,
    val text: String,
    val postedAt: Long, // when Android received it from the bank app
    val shownAt: Long, // the notification's own timestamp; stays the same when the bank app updates it
    val receivedAt: Long, // when Shigo's listener saw it
)

object AlertSender {
    private const val TAG = "ShigoAlerts"
    private val io = Executors.newSingleThreadExecutor()

    // Send now so the order turns green in seconds; if that fails, WorkManager retries once there is a network.
    fun send(ctx: Context, alert: Alert) {
        val app = ctx.applicationContext
        io.execute {
            if (post(app, alert) == Outcome.RETRY) queue(app, alert)
        }
    }

    enum class Outcome { DONE, RETRY }

    fun post(ctx: Context, a: Alert): Outcome {
        val key = Prefs.key(ctx) ?: return Outcome.DONE
        val body = JSONObject()
            .put("app", a.app)
            .put("title", a.title ?: JSONObject.NULL)
            .put("text", a.text)
            .put("postedAt", a.postedAt)
            .put("shownAt", a.shownAt)
            .put("receivedAt", a.receivedAt)
            .put("sentAt", System.currentTimeMillis())
            .put("appVersion", BuildConfig.VERSION_NAME)
            .toString()
        return try {
            val conn = (URL("${BuildConfig.BASE_URL}/api/rails/bankapp").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10_000
                readTimeout = 15_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Authorization", "Bearer $key")
            }
            conn.outputStream.use { it.write(body.toByteArray()) }
            val code = conn.responseCode
            conn.disconnect()
            when {
                code in 200..299 -> Outcome.DONE
                code == 401 -> { Prefs.setKey(ctx, null); Outcome.DONE } // phone was stopped from the Alerts screen
                code in 400..499 -> Outcome.DONE // the server will never accept this one
                else -> Outcome.RETRY
            }
        } catch (e: IOException) {
            Log.i(TAG, "send failed, will retry: ${e.message}")
            Outcome.RETRY
        }
    }

    private fun queue(ctx: Context, a: Alert) {
        val req = OneTimeWorkRequestBuilder<RetryWorker>()
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .setInputData(
                workDataOf(
                    "app" to a.app, "title" to a.title, "text" to a.text,
                    "postedAt" to a.postedAt, "shownAt" to a.shownAt, "receivedAt" to a.receivedAt,
                ),
            )
            .build()
        WorkManager.getInstance(ctx).enqueue(req)
    }

    class RetryWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
        override suspend fun doWork(): Result {
            val d = inputData
            val alert = Alert(
                app = d.getString("app") ?: return Result.failure(),
                title = d.getString("title"),
                text = d.getString("text") ?: return Result.failure(),
                postedAt = d.getLong("postedAt", 0),
                shownAt = d.getLong("shownAt", 0),
                receivedAt = d.getLong("receivedAt", 0),
            )
            return when {
                post(applicationContext, alert) == Outcome.DONE -> Result.success()
                runAttemptCount >= 30 -> Result.failure()
                else -> Result.retry()
            }
        }
    }
}
