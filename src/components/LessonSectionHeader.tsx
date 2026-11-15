import { colors } from '@/domain/theme';
import { StyleSheet, Text, View } from 'react-native';

export type LessonSectionTone = 'accent' | 'muted' | 'cancelled';

interface Props {
    title: string;
    count?: number;
    note?: string;
    tone?: LessonSectionTone;
}

// цвета заголовка и счётчика по смыслу секции: активные — акцент,
// прошедшие — приглушённые, отменённые — красные (как в макете week)
const TONES: Record<LessonSectionTone, { text: string; badge: string }> = {
    accent: { text: colors.primary, badge: colors.primaryTint },
    muted: { text: colors.mutedStrong, badge: colors.mutedTint },
    cancelled: { text: colors.cancelled, badge: colors.cancelledBg },
};

export function LessonSectionHeader({ title, count, note, tone = 'accent' }: Props) {
    const t = TONES[tone];
    const badge = note ?? count;

    return (
        <View style={styles.row}>
            <Text style={[styles.title, { color: t.text }]}>{title}</Text>
            {badge !== undefined && (
                <View style={[styles.badge, { backgroundColor: t.badge }]}>
                    <Text style={[styles.count, { color: t.text }]}>{badge}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        marginBottom: 6,
    },
    title: { fontSize: 13, fontWeight: '700' },
    badge: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 1,
    },
    count: { fontSize: 12 },
});
