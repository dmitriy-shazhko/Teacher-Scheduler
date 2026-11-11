import { colors } from '@/domain/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
    label: string;
    value: string;
    valueColor?: string;
    isLast?: boolean;
    onPress?: () => void;
}

export function SettingsRow({ label, value, valueColor, isLast = false, onPress }: Props) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={[styles.row, !isLast && styles.divider]}
        >
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    divider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    label: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
    },
});
