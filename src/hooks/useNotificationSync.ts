import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncNotifications } from '@/notifications/scheduler';

export function useNotificationSync(): void {
    const db = useSQLiteContext();

    useEffect(() => {
        const run = () => {
            syncNotifications(db).catch((e) => console.warn('syncNotifications failed', e));
        };

        run(); // при запуске

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') run(); // при возврате из фона
        });

        return () => subscription.remove();
    }, [db]);
}
