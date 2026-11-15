import { colors } from '@/domain/theme';
import { StyleSheet, Text, View } from 'react-native';

export type LessonSectionTone = 'accent' | 'muted' | 'warn';

interface Props {
    title: string;
    count: number;
    tone?: LessonSectionTone;
}

// цвета заголовка и счётчика по смыслу секции: активные — акцент,
// прошедшие — приглушённые, отменённые — предупреждение
const TONES: Record<LessonSectionTone, { text: string; badge: string }> = {
    accent: { text: colors.primary, badge: colors.primaryTint },
    muted: { text: colors.mutedStrong, badge: colors.mutedTint },
    warn: { text: colors.warnText, badge: colors.warnBg },
};

export function LessonSectionHeader({ title, count, tone = 'accent' }: Props) {
    const t = TONES[tone];

    return (
        <View style={styles.row}>
            <Text style={[styles.title, { color: t.text }]}>{title}</Text>
            <View style={[styles.badge, { backgroundColor: t.badge }]}>
                <Text style={[styles.count, { color: t.text }]}>{count}</Text>
            </View>
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
