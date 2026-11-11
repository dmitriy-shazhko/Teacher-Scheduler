// src/components/WeekSwitcher.tsx
import { colors } from '@/domain/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconButton } from './IconButton';

interface Props {
    label: string;
    isCurrent: boolean;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
}

export function WeekSwitcher({ label, isCurrent, onPrev, onNext, onToday }: Props) {
    return (
        <View style={styles.card}>
            <IconButton
                variant='ghost'
                icon='chevron-left'
                label='Предыдущая неделя'
                onPress={onPrev}
            />

            <View style={styles.center}>
                <Text style={styles.label}>{label}</Text>
                {isCurrent ? (
                    <Text style={styles.sub}>Текущая неделя</Text>
                ) : (
                    <Pressable onPress={onToday} hitSlop={8}>
                        <Text style={styles.sub}>К текущей неделе</Text>
                    </Pressable>
                )}
            </View>

            <IconButton
                variant='ghost'
                icon='chevron-right'
                label='Следующая неделя'
                onPress={onNext}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: 18,
        paddingVertical: 0,
        paddingHorizontal: 14,
        marginBottom: 12,
    },
    center: { alignItems: 'center' },
    label: { fontSize: 15, fontWeight: '700', color: colors.text },
    sub: { fontSize: 11, fontWeight: '600', color: colors.primary },
});
