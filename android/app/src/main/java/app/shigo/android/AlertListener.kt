package app.shigo.android

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

// Android hands every notification on the phone to this service once the seller allows notification access.
// It drops everything except alerts from the bank apps in BankApps, and only while this phone is linked.
class AlertListener : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val app = when {
            sbn.packageName in BankApps.ALL -> sbn.packageName
            // Debug builds: Shigo's own notifications come only from DebugAlerts.
            BuildConfig.DEBUG && sbn.packageName == packageName -> BankApps.TEST_APP
            else -> return
        }
        if (Prefs.key(this) == null) return
        val n = sbn.notification
        if (n.flags and Notification.FLAG_GROUP_SUMMARY != 0) return

        val extras = n.extras
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
        val text = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: extras.getCharSequence(Notification.EXTRA_TEXT))
            ?.toString()?.takeIf { it.isNotBlank() } ?: return

        AlertSender.send(
            this,
            Alert(
                app = app,
                title = title,
                text = text,
                postedAt = sbn.postTime,
                shownAt = if (n.`when` > 0) n.`when` else sbn.postTime,
                receivedAt = System.currentTimeMillis(),
            ),
        )
    }
}
