import { Lesson } from '@/domain/types';
import { useLessonActions } from '@/hooks/useLessonActions';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
    lesson: Lesson;
}

export function LessonCard({ lesson }: Props) {
    const { openLesson, confirmRemove } = useLessonActions();

    return (
        <Pressable
            onPress={() => openLesson(lesson.id)}
            onLongPress={() => confirmRemove(lesson.id)}
            style={[styles.card, lesson.cancelled && styles.cancelled]}
        >
            <Text style={[styles.time, lesson.cancelled && styles.cancelledText]}>
                {lesson.startTime}-{lesson.endTime}
            </Text>
            <Text style={[styles.main, lesson.cancelled && styles.cancelledText]}>
                {lesson.className}, кабинет {lesson.room}
            </Text>
            <Text style={lesson.cancelled && styles.cancelledText}>
                {lesson.topic || 'тема не указана'}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    time: {
        fontSize: 16,
        fontWeight: '600',
    },
    main: {
        fontSize: 16,
        marginVertical: 4,
        color: '#056ccc',
        fontWeight: '600',
    },
    cancelled: {
        backgroundColor: '#cfcfcf',
    },
    cancelledText: {
        color: '#8f8f8f',
    },
});
