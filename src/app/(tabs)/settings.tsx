import { Linking, ScrollView, StyleSheet } from 'react-native';

import { BatteryHint } from '@/components/BatteryHint';
import { OptionPickerModal } from '@/components/OptionPickerModal';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/components/SettingsRow';
import { SettingsSection } from '@/components/SettingsSection';
import { COLOR_DANGER, SETTING_LIMITS, SETTING_OPTIONS } from '@/domain/constants';
import { formatDuration } from '@/domain/schedule';
import { AppSettings } from '@/domain/types';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { ensureNotificationPermission } from '@/notifications/permissions';
import { syncNotifications } from '@/notifications/scheduler';
import { useSettingsStore } from '@/store/settingsStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

const FIELD_LABELS: Record<keyof AppSettings, string> = {
    firstLessonStartingMinutes: 'Уведомление о первом уроке за',
    lessonEndingMinutes: 'Предупредить о конце урока за',
    lessonDurationMinutes: 'Длительность урока по умолчанию',
};

export default function SettingsScreen() {
    const db = useSQLiteContext();
    const settings = useSettingsStore((s) => s.settings);
    const updateSettings = useSettingsStore((s) => s.updateSettings);
    const { status, refresh } = useNotificationPermission();
    const [editing, setEditing] = useState<keyof AppSettings | null>(null);

    const handleSelect = async (field: keyof AppSettings, value: number) => {
        setEditing(null);
        await updateSettings({ [field]: value });

        syncNotifications(db).catch((e) => console.warn('syncNotifications failed', e));
    };

    const handlePermission = async () => {
        if (status === 'canAsk') {
            const granted = await ensureNotificationPermission();
            await refresh();
            if (granted) {
                syncNotifications(db).catch((e) => console.warn('syncNotifications failed', e));
            }
        } else if (status === 'blocked') {
            // системный запрос больше не покажется, только ручное включение
            Linking.openSettings();
        }
    };

    const permissionValue = status === null ? '…' : status === 'granted' ? 'Выдано' : 'Не выдано';

    return (
        <Screen title='Настройки'>
            <ScrollView contentContainerStyle={styles.content}>
                <SettingsSection title='Уведомления'>
                    <SettingsRow
                        label={FIELD_LABELS.firstLessonStartingMinutes}
                        value={formatDuration(settings.firstLessonStartingMinutes)}
                        onPress={() => setEditing('firstLessonStartingMinutes')}
                    />
                    <SettingsRow
                        label={FIELD_LABELS.lessonEndingMinutes}
                        value={formatDuration(settings.lessonEndingMinutes)}
                        onPress={() => setEditing('lessonEndingMinutes')}
                        isLast
                    />

                    <SettingsRow
                        label='Разрешение на уведомления'
                        value={permissionValue}
                        valueColor={
                            status === 'canAsk' || status === 'blocked' ? COLOR_DANGER : undefined
                        }
                        onPress={
                            status === 'canAsk' || status === 'blocked'
                                ? handlePermission
                                : undefined
                        }
                        isLast
                    />
                </SettingsSection>

                <SettingsSection title='Расписание'>
                    <SettingsRow
                        label={FIELD_LABELS.lessonDurationMinutes}
                        value={formatDuration(settings.lessonDurationMinutes)}
                        onPress={() => setEditing('lessonDurationMinutes')}
                        isLast
                    />
                </SettingsSection>

                <BatteryHint />
            </ScrollView>

            {editing && (
                <OptionPickerModal
                    title={FIELD_LABELS[editing]}
                    options={SETTING_OPTIONS[editing]}
                    selected={settings[editing]}
                    min={SETTING_LIMITS[editing].min}
                    max={SETTING_LIMITS[editing].max}
                    onSelect={(value) => handleSelect(editing, value)}
                    onClose={() => setEditing(null)}
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 24,
        gap: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1c1c28',
        paddingHorizontal: 4,
        paddingTop: 12,
    },
});
