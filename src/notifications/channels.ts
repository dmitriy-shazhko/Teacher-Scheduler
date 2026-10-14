import { Platform } from 'react-native';
import notifee, { AndroidImportance, AndroidVisibility } from 'react-native-notify-kit';

export const CHANNELS = {
    status: 'status-v1',
    endingSoon: 'ending-soon-v3',
} as const;

export async function setupChannels() {
    if (Platform.OS !== 'android') return;

    await notifee.createChannel({
        id: CHANNELS.status,
        name: 'Расписание',
        importance: AndroidImportance.LOW,
        visibility: AndroidVisibility.PUBLIC,
    });

    await notifee.createChannel({
        id: CHANNELS.endingSoon,
        name: 'Скоро конец урока',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [400, 200, 400, 200, 400, 200],
        visibility: AndroidVisibility.PUBLIC,
    });
}
