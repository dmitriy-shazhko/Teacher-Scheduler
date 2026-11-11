// src/components/LessonCard.tsx
import { colors } from '@/domain/theme';
import { Lesson } from '@/domain/types';
import { useLessonActions } from '@/hooks/useLessonActions';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconButton } from './IconButton';

interface Props {
    lesson: Lesson;
}

export function LessonCard({ lesson }: Props) {
    const { openLesson, confirmRemove } = useLessonActions();
    const onDelete = () => {
        confirmRemove(lesson.id);
    };

    return (
        <Pressable
            onPress={() => openLesson(lesson.id)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        >
            <View style={styles.times}>
                <Text style={[styles.start, lesson.cancelled && styles.struck]}>
                    {lesson.startTime}
                </Text>
                <Text style={styles.end}>{lesson.endTime}</Text>
            </View>

            <View style={[styles.bar, lesson.cancelled && styles.barMuted]} />

            <View style={styles.body}>
                <Text style={styles.title}>
                    {lesson.className} · {lesson.room ? `каб. ${lesson.room}` : 'кабинет не указан'}
                </Text>
                {!!lesson.topic && <Text style={styles.topic}>{lesson.topic}</Text>}
                {lesson.cancelled && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Отменён</Text>
                    </View>
                )}
            </View>

            <IconButton variant='danger' icon='trash-2' label='Удалить' onPress={onDelete} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        marginBottom: 10,
        backgroundColor: colors.card,
        borderRadius: 18,
    },
    times: { width: 54, alignItems: 'center' },
    start: { fontSize: 16, fontWeight: '800', color: colors.text },
    struck: { textDecorationLine: 'line-through', color: colors.muted },
    end: { fontSize: 12, color: colors.muted },
    bar: { width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.primary },
    barMuted: { backgroundColor: colors.barMuted },
    body: { flex: 1 },
    title: { fontSize: 15, fontWeight: '700', color: colors.text },
    topic: { fontSize: 13, color: colors.muted, marginTop: 2 },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.warnBg,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 4,
    },
    badgeText: { fontSize: 11, fontWeight: '700', color: colors.warnText },
});
