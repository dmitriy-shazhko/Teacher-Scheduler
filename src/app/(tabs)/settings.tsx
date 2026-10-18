import { ScrollView, StyleSheet } from 'react-native';

import { BatteryHint } from '@/components/BatteryHint';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/components/SettingsRow';
import { SettingsSection } from '@/components/SettingsSection';
import { formatDuration } from '@/domain/schedule';
import { useSettingsStore } from '@/store/settingsStore';

export default function SettingsScreen() {
    const settings = useSettingsStore((s) => s.settings);

    return (
        <Screen title='Настройки'>
            <ScrollView contentContainerStyle={styles.content}>
                <SettingsSection title='Уведомления'>
                    <SettingsRow
                        label='Уведомление о первом уроке за'
                        value={formatDuration(settings.firstLessonStartingMinutes)}
                    />
                    <SettingsRow
                        label='Предупредить об окончании урока за'
                        value={formatDuration(settings.lessonEndingMinutes)}
                        isLast
                    />
                </SettingsSection>

                <SettingsSection title='Расписание'>
                    <SettingsRow
                        label='Длительность урока по умолчанию'
                        value={formatDuration(settings.lessonDurationMinutes)}
                        isLast
                    />
                </SettingsSection>

                <BatteryHint />
            </ScrollView>
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
