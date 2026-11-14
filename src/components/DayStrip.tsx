// src/components/DayStrip.tsx
import { WEEKDAYS, WEEKDAYS_SHORT } from '@/domain/constants';
import { addDays, formatShort } from '@/domain/dates';
import { colors } from '@/domain/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const DOT_SIZE = 5;

interface Props {
    weekStart: Date;
    selected: number;
    todayIndex: number; // -1, если сегодня не на этой неделе
    hasLessons: boolean[]; // по индексу дня: есть ли уроки
    onSelect: (i: number) => void;
}

export function DayStrip({ weekStart, selected, todayIndex, hasLessons, onSelect }: Props) {
    return (
        <View style={styles.row}>
            {WEEKDAYS.map((day, i) => {
                const isSel = i === selected;
                const isToday = i === todayIndex;
                const hasLesson = hasLessons[i];
                const date = addDays(weekStart, i);

                return (
                    <Pressable
                        key={day}
                        onPress={() => onSelect(i)}
                        style={[styles.pill, isToday && styles.today, isSel && styles.selected]}
                        accessibilityRole='button'
                        accessibilityState={{ selected: isSel }}
                        accessibilityLabel={`${day}, ${formatShort(date)}, ${
                            hasLesson ? 'есть уроки' : 'уроков нет'
                        }`}
                    >
                        <Text
                            style={[
                                styles.name,
                                !hasLesson && styles.muted,
                                isSel && styles.onPrimary,
                            ]}
                        >
                            {WEEKDAYS_SHORT[i]}
                        </Text>
                        <Text
                            style={[
                                styles.num,
                                !hasLesson && styles.muted,
                                isSel && styles.onPrimary,
                            ]}
                        >
                            {date.getDate()}
                        </Text>
                        <View style={styles.dotSlot}>
                            {hasLesson && (
                                <View style={[styles.dot, isSel && styles.dotOnPrimary]} />
                            )}
                        </View>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 4 },
    pill: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 6,
        borderRadius: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.transparent,
    },
    today: { backgroundColor: colors.primaryTint, borderColor: colors.primaryBorder },
    selected: { backgroundColor: colors.primary, borderColor: colors.primary },
    name: { fontSize: 12, fontWeight: '700', color: colors.text },
    num: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
    muted: { color: colors.muted },
    onPrimary: { color: colors.onPrimary },
    dotSlot: { width: DOT_SIZE, height: DOT_SIZE, marginTop: 4 },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: colors.primary,
    },
    dotOnPrimary: { backgroundColor: colors.onPrimary },
});
