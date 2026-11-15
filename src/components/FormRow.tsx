import { colors } from '@/domain/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    label: string;
    children: ReactNode;
    isLast?: boolean;
    // подпись сверху, значение под ней (для многострочной «Темы»)
    isBlock?: boolean;
    onPress?: () => void;
}

export function FormRow({ label, children, isLast = false, isBlock = false, onPress }: Props) {
    const content = (
        <>
            <Text style={isBlock ? styles.blockLabel : styles.label}>{label}</Text>
            <View style={isBlock ? styles.blockValue : styles.value}>{children}</View>
        </>
    );
    const rowStyle = [styles.row, isBlock && styles.blockRow, !isLast && styles.divider];

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                accessibilityRole='button'
                style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
            >
                {content}
            </Pressable>
        );
    }

    return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
    row: {
        minHeight: 50,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    blockRow: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 2,
    },
    divider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    label: { fontSize: 14, color: colors.muted },
    blockLabel: { fontSize: 12, color: colors.muted },
    value: { flex: 1, alignItems: 'flex-end' },
    blockValue: { alignItems: 'stretch' },
    pressed: { opacity: 0.6 },
});
