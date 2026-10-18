import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_GAP = 28;

interface Props {
    title: string;
    children: ReactNode;
}

export function Screen({ title, children }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + TOP_GAP }]}>
            <Text style={styles.title}>{title}</Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: '#f4f4f8',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1c1c28',
        marginBottom: 12,
    },
});
