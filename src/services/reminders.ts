// Local scheduled notifications (FR8). No server needed.
import { Platform } from 'react-native';
import { Reminders } from '../data/types';

export async function applyReminders(r: Reminders): Promise<{ ok: boolean; message?: string }> {
  if (Platform.OS === 'web') return { ok: false, message: 'Reminders work on the phone app.' };
  try {
    const N = await import('expo-notifications');
    await N.cancelAllScheduledNotificationsAsync();
    if (!r.workoutEnabled && !r.mealEnabled) return { ok: true };

    const perm = await N.requestPermissionsAsync();
    if (!perm.granted) return { ok: false, message: 'Notifications are turned off for FitFlow in system settings.' };

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('reminders', { name: 'Reminders', importance: N.AndroidImportance.DEFAULT });
    }
    const daily = (hour: number, minute: number) => ({
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'reminders',
    });

    if (r.workoutEnabled) {
      await N.scheduleNotificationAsync({
        content: { title: "Time for today's workout", body: 'Your plan is ready. Even 15 minutes counts.' },
        trigger: daily(r.workoutHour, r.workoutMinute),
      });
    }
    if (r.mealEnabled) {
      await N.scheduleNotificationAsync({
        content: { title: 'Log your lunch', body: 'Snap a photo of your meal. It takes a few seconds.' },
        trigger: daily(13, 0),
      });
      await N.scheduleNotificationAsync({
        content: { title: 'Log your dinner', body: 'Snap a photo of your meal before you forget.' },
        trigger: daily(19, 30),
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not schedule reminders on this device.' };
  }
}
