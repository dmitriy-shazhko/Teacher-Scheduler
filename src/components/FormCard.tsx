import { colors } from '@/domain/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
    children: ReactNode;
}

export function FormCard({ children }: Props) {
    return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
});
