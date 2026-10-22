import { formatShort, toDateString } from '@/domain/dates';
import { Lesson } from '@/domain/types';
import { useLessonActions } from '@/hooks/useLessonActions';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LessonCard } from './LessonCard';

interface Props {
    name: string;
    day: Date;
    lessons: Lesson[];
}

export function DayCard({ name, day, lessons }: Props) {
    const { addLesson } = useLessonActions();
    const dateStr = toDateString(day);

    return (
        <View key={dateStr} style={styles.dayBlock}>
            <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>
                    {name}, {formatShort(day)}
                </Text>
                <Pressable onPress={() => addLesson(dateStr)} hitSlop={12}>
                    <Text style={styles.plus}>＋</Text>
                </Pressable>
            </View>
            {lessons.length === 0 ? (
                <Text style={styles.empty}>Нет уроков</Text>
            ) : (
                lessons.map((l) => <LessonCard key={l.id} lesson={l} />)
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    dayBlock: { marginBottom: 12 },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    dayTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
    empty: { color: '#888', marginBottom: 4 },
    plus: { fontSize: 24, color: '#4a4ae0' },
});
