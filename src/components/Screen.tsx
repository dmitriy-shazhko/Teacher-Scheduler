import { colors } from '@/domain/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_GAP = 28;

interface Props {
    title: string;
    children: ReactNode;
    rightBlock?: ReactNode;
    onBack?: () => void;
}

export function Screen({ title, children, rightBlock, onBack }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + TOP_GAP }]}>
            {onBack && (
                <Pressable onPress={onBack} hitSlop={12} style={styles.back}>
                    <Text style={styles.backText}>‹ Назад</Text>
                </Pressable>
            )}
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
    back: { minHeight: 32, justifyContent: 'center', alignSelf: 'flex-start', marginBottom: 4 },
    backText: { color: colors.primary, fontSize: 13 },
});
