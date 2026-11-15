import { formatDuration } from '@/domain/schedule';
import { colors } from '@/domain/theme';
import { Lesson } from '@/domain/types';
import { useLessonActions } from '@/hooks/useLessonActions';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type NowCardState = 'active' | 'soon';

interface Props {
    lesson: Lesson;
    state: NowCardState;
    minutes: number;
    progress?: number;
}

const STATE_STYLES: Record<
    NowCardState,
    { badge: string; badgeText: string; dot: string; label: string }
> = {
    active: {
        badge: colors.currentBg,
        badgeText: colors.currentText,
        dot: colors.currentDot,
        label: 'Идёт сейчас',
    },
    soon: {
        badge: colors.soonBg,
        badgeText: colors.soonText,
        dot: colors.soonDot,
        label: 'Скоро начнётся',
    },
};

export function NowCard({ lesson, state, minutes, progress = 0 }: Props) {
    const { openLesson } = useLessonActions();
    const status = STATE_STYLES[state];
    const fillWidth = `${Math.max(0, Math.min(100, progress))}%` as `${number}%`;

    return (
        <Pressable
            onPress={() => openLesson(lesson.id)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
        >
            <View style={[styles.badge, { backgroundColor: status.badge }]}>
                <View style={[styles.dot, { backgroundColor: status.dot }]} />
                <Text style={[styles.badgeText, { color: status.badgeText }]}>{status.label}</Text>
            </View>

            <Text style={styles.time}>
                {lesson.startTime} – {lesson.endTime}
            </Text>

            <View style={styles.roomRow}>
                <Feather name='map-pin' size={16} color={colors.text} />
                <Text style={styles.roomText}>
                    <Text style={styles.strong}>{lesson.className}</Text>
                    {lesson.room ? ` · каб. ${lesson.room}` : ' · кабинет не указан'}
                </Text>
            </View>

            <Text style={styles.topic}>{lesson.topic || 'Тема не указана'}</Text>

            {state === 'active' && (
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: fillWidth }]} />
                </View>
            )}

            <Text style={[styles.hint, state === 'active' && styles.hintActive]}>
                {state === 'active'
                    ? `Осталось ${formatDuration(minutes)}`
                    : `Начнётся через ${formatDuration(minutes)}`}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 18,
        borderRadius: 24,
        backgroundColor: colors.card,
        marginBottom: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: { fontSize: 12, fontWeight: '600' },
    dot: { width: 8, height: 8, borderRadius: 4 },
    time: {
        fontSize: 36,
        fontWeight: '800',
        color: colors.text,
        marginTop: 14,
        marginBottom: 8,
    },
    roomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    roomText: { fontSize: 14, color: colors.text },
    strong: { fontWeight: '700' },
    topic: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginTop: 6,
        marginBottom: 14,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.mutedTint,
    },
    progressFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.currentDot,
    },
    hint: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    hintActive: {
        marginTop: 10,
    },
});
