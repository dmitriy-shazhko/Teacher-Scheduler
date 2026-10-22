import { setupChannels } from './channels';
import { ensureNotificationPermission } from './permissions';

export async function initNotifications() {
    await setupChannels();
    await ensureNotificationPermission();
}
