import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ensureNotificationPermission } from './permissions';

export const CHANNELS = {
    endingSoon: 'ending-soon-v1',
    nextLesson: 'next-lesson',
} as const;

export async function setupChannels() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(CHANNELS.endingSoon, {
        name: 'Скоро конец урока',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 400, 200, 400, 200, 400],
        enableVibrate: true,
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.nextLesson, {
        name: 'Следующий урок',
        importance: Notifications.AndroidImportance.HIGH,
    });
}

export async function initNotifications() {
    await setupChannels();
    await ensureNotificationPermission();
}
