import { PermissionStatus } from '@/domain/types';
import { getNotificationPermissionStatus } from '@/notifications/permissions';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useNotificationPermission() {
    const [status, setStatus] = useState<PermissionStatus | null>(null);

    const refresh = useCallback(async () => {
        setStatus(await getNotificationPermissionStatus());
    }, []);

    useEffect(() => {
        let cancelled = false;

        const sync = async () => {
            const next = await getNotificationPermissionStatus();
            if (!cancelled) setStatus(next);
        };

        void sync();

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void sync();
        });

        return () => {
            cancelled = true;
            subscription.remove();
        };
    }, []);

    return { status, refresh };
}
