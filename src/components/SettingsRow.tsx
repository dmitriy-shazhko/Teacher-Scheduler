import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
    label: string;
    value: string;
    isLast?: boolean;
    onPress?: () => void;
}

export function SettingsRow({ label, value, isLast = false, onPress }: Props) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={[styles.row, !isLast && styles.divider]}
        >
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
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
        borderBottomColor: '#ececf2',
    },
    label: {
        flex: 1,
        fontSize: 16,
        color: '#1c1c28',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4a4ae0',
    },
});
