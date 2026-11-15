import { migrateDb } from '@/db/migrate';
import { initNotifications } from '@/notifications/init';
import { useSettingsStore } from '@/store/settingsStore';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

export default function RootLayout() {
    useEffect(() => {
        initNotifications();
        useSettingsStore.getState().loadSettings();
    }, []);

    return (
        <SQLiteProvider databaseName='schedule.db' onInit={migrateDb}>
            <Stack screenOptions={{ headerShown: false }} />
        </SQLiteProvider>
    );
}
