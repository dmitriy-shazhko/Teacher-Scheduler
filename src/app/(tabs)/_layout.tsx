import { colors } from '@/domain/theme';
import { useNotificationSync } from '@/hooks/useNotificationSync';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
    useNotificationSync();

    return (
        <Tabs
            screenOptions={{
                headerShown: false, // заголовок рисует ваш Screen
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.muted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.divider },
            }}
        >
            <Tabs.Screen
                name='today'
                options={{
                    title: 'Сегодня',
                    tabBarIcon: ({ color }) => <Feather name='calendar' size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name='week'
                options={{
                    title: 'Неделя',
                    tabBarIcon: ({ color }) => <Feather name='grid' size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name='settings'
                options={{
                    title: 'Настройки',
                    tabBarIcon: ({ color }) => <Feather name='settings' size={22} color={color} />,
                }}
            />
        </Tabs>
    );
}
