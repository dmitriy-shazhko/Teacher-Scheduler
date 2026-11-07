import { colors } from '@/domain/theme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_GAP = 28;

interface Props {
    title: string;
    rightBlock?: ReactNode;
    children: ReactNode;
}

export function Screen({ title, children, rightBlock }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + TOP_GAP }]}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {rightBlock}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: colors.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
});
