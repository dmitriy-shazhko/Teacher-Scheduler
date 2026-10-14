import { useNotificationSync } from '@/hooks/useNotificationSync';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
    useNotificationSync();

    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen
                name='today'
                options={{
                    title: 'Сегодня',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='today-outline' size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name='week'
                options={{
                    title: 'Неделя',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='calendar-outline' size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name='settings'
                options={{
                    title: 'Настройки',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='settings-outline' size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
