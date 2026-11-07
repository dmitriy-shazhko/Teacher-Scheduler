// src/components/DayStrip.tsx
import { WEEKDAYS, WEEKDAYS_SHORT } from '@/domain/constants';
import { addDays } from '@/domain/dates';
import { colors } from '@/domain/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    weekStart: Date;
    selected: number;
    todayIndex: number; // -1, если сегодня не на этой неделе
    onSelect: (i: number) => void;
}

export function DayStrip({ weekStart, selected, todayIndex, onSelect }: Props) {
    return (
        <View style={styles.row}>
            {WEEKDAYS.map((day, i) => {
                const isSel = i === selected;
                const isToday = i === todayIndex;

                return (
                    <Pressable
                        key={day}
                        onPress={() => onSelect(i)}
                        style={[styles.pill, isToday && styles.today, isSel && styles.selected]}
                    >
                        <Text style={[styles.name, isSel && styles.onPrimary]}>
                            {WEEKDAYS_SHORT[i]}
                        </Text>
                        <Text style={[styles.num, isSel && styles.onPrimary]}>
                            {addDays(weekStart, i).getDate()}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 6 },
    pill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    today: { backgroundColor: colors.primaryTint, borderColor: colors.primaryBorder },
    selected: { backgroundColor: colors.primary, borderColor: colors.primary },
    name: { fontSize: 12, fontWeight: '700', color: colors.text },
    num: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
    onPrimary: { color: '#fff' },
});
