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
            <Text style={[styles.time]}>
                {lesson.startTime} - {lesson.endTime}
            </Text>
            <Text style={[styles.main]}>
                {lesson.className}, кабинет {lesson.room}
            </Text>
            <Text>{lesson.topic || 'тема не указана'}</Text>
            <Text style={[styles.hint, accent && styles.accentHint]}>{hint}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    accent: {
        borderColor: '#498d1c',
        borderWidth: 2,
    },
    accentLabel: {
        color: '#498d1c',
    },
    accentHint: {
        color: '#a03535',
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#cf9801',
        marginBottom: 20,
    },
    hint: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 20,
    },
    time: {
        fontSize: 24,
        fontWeight: '600',
    },
    main: {
        fontSize: 16,
        marginVertical: 4,
        color: '#056ccc',
        fontWeight: '600',
    },
});
