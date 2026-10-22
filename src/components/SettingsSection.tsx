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
        color: '#6b6b7a',
        paddingHorizontal: 4,
        paddingBottom: 8,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
    },
});
