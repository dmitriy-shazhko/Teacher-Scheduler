import { colors } from '@/domain/theme';
import { Lesson } from '@/domain/types';
import { useLessonActions } from '@/hooks/useLessonActions';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
    label: string;
    hint: string;
    lesson: Lesson;
    accent?: boolean;
}

export function NowCard({ label, hint, lesson, accent = false }: Props) {
    const { openLesson } = useLessonActions();

    return (
        <Pressable
            onPress={() => openLesson(lesson.id)}
            style={[styles.card, accent && styles.accent]}
        >
            <Text style={[styles.label, accent && styles.accentLabel]}>{label}</Text>
            <Text style={styles.time}>
                {lesson.startTime} - {lesson.endTime}
            </Text>
            <Text style={styles.main}>
                {lesson.className}, кабинет {lesson.room}
            </Text>
            <Text style={styles.topic}>{lesson.topic || 'тема не указана'}</Text>
            <Text style={[styles.hint, accent && styles.accentHint]}>{hint}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 14,
        borderRadius: 10,
        backgroundColor: colors.card,
        marginBottom: 12,
    },
    accent: {
        borderColor: colors.success,
        borderWidth: 2,
    },
    accentLabel: {
        color: colors.success,
    },
    accentHint: {
        color: colors.dangerMuted,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: colors.warning,
        marginBottom: 20,
    },
    hint: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 20,
        color: colors.text,
    },
    time: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.text,
    },
    main: {
        fontSize: 16,
        marginVertical: 4,
        color: colors.info,
        fontWeight: '600',
    },
    topic: {
        fontSize: 16,
        color: colors.text,
    },
});
