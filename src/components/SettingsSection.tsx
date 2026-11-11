import { colors } from '@/domain/theme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    title: string;
    children: ReactNode;
}

export function SettingsSection({ title, children }: Props) {
    return (
        <View>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.card}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 13,
        color: colors.muted,
        paddingHorizontal: 4,
        paddingBottom: 8,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 14,
        overflow: 'hidden',
    },
});
