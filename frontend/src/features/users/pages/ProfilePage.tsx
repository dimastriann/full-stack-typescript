import UserForm from '../components/UserForm';
import { useAuthStore } from '../../../store/authStore';
import { usePushNotifications } from '../../../hooks/usePushNotifications';
import { Bell, CheckCircle2, ShieldAlert, Loader2, Send } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const [toastMsg, setToastMsg] = useState('');
  const [toastError, setToastError] = useState(false);
  const [testing, setTesting] = useState(false);

  const showToast = (msg: string, isErr = false) => {
    setToastMsg(msg);
    setToastError(isErr);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSuccess = () => {
    showToast('Profile updated successfully');
  };

  const handleSubscribe = async () => {
    try {
      await subscribe();
      showToast('Successfully subscribed to push notifications!');
    } catch (err) {
      showToast((err as Error).message || 'Failed to subscribe', true);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe();
      showToast('Unsubscribed from push notifications');
    } catch {
      showToast('Failed to unsubscribe', true);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      await sendTestNotification();
      showToast('Test push notification sent!');
    } catch {
      showToast('Failed to send test notification', true);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border transition-all animate-slide-in-up ${
            toastError
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400'
              : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Profile
        </h1>
      </div>

      {/* Profile Info Form */}
      <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl p-8 border border-surface-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Personal Information
        </h2>
        {user ? (
          <UserForm userId={user.id} onSuccess={handleSuccess} isFromProfile />
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
        )}
      </div>

      {/* Push Notifications Card */}
      <div className="bg-white dark:bg-slate-900 shadow-card rounded-2xl p-8 border border-surface-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Push Notifications
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enable real-time push alerts to stay updated on comment mentions,
              task assignments, and activity updates directly on your device.
            </p>
          </div>
        </div>

        <div className="border-t border-surface-100 dark:border-slate-800/60 pt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              Checking notification status...
            </div>
          ) : !isSupported ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-2xl flex gap-3 text-orange-800 dark:text-orange-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block mb-0.5">Not Supported</span>
                Your current browser does not support push notifications. To use
                this feature, try accessing ProjectFlow in a modern browser such
                as Chrome, Edge, or Safari on desktop or mobile.
              </div>
            </div>
          ) : permission === 'denied' ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-3 text-red-800 dark:text-red-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block mb-0.5">
                  Permission Denied
                </span>
                Notifications have been blocked in your browser settings. To
                enable them, click the lock icon in your address bar, change
                notification permissions to "Allow", and reload the page.
              </div>
            </div>
          ) : isSubscribed ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-900/30 rounded-2xl flex gap-3 text-green-800 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold block mb-0.5">
                    Push Notifications Active
                  </span>
                  This browser is successfully subscribed to push notifications.
                  You will receive updates directly on this device.
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2"
                >
                  {testing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send Test Notification
                </button>
                <button
                  onClick={handleUnsubscribe}
                  className="px-4 py-2 bg-white hover:bg-surface-50 border border-surface-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  Disable Notifications
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                You are not currently subscribed to push notifications on this
                device.
              </p>
              <button
                onClick={handleSubscribe}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Enable Push Notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
