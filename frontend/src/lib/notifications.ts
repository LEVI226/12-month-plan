import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// This schedules a LOCAL notification on the
// device itself. No server, no push token, no account is involved.

export const CHANNEL_ID = 'daily-reminder';

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rappel quotidien',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
  });
}

export async function getPermissionStatus() {
  return Notifications.getPermissionsAsync();
}

export async function requestPermission() {
  return Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  return { hour: Number.isFinite(h) ? h : 20, minute: Number.isFinite(m) ? m : 0 };
}

export async function scheduleDailyReminder(time: string, firstName?: string) {
  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { hour, minute } = parseTime(time);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Votre point quotidien',
      body: firstName
        ? `${firstName}, un petit pas vous attend aujourd'hui.`
        : "Un petit pas vous attend aujourd'hui.",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification() {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Aperçu du rappel Childeric',
      body: "Voici à quoi ressemblera votre rappel quotidien.",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      repeats: false,
      channelId: CHANNEL_ID,
    },
  });
}
