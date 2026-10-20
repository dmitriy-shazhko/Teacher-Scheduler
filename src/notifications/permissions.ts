import { PermissionStatus } from '@/domain/types';
import * as Notifications from 'expo-notifications';

export async function ensureNotificationPermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();

    if (current.granted) return true;

    if (!current.canAskAgain) return false;

    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
}

export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
    const current = await Notifications.getPermissionsAsync();

    if (current.granted) return 'granted';

    return current.canAskAgain ? 'canAsk' : 'blocked';
}
