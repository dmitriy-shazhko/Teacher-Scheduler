import { colors } from '@/domain/theme';
import { Feather } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

type Variant = 'light' | 'danger' | 'primary' | 'ghost';

const THEME = {
    light: { bg: colors.card, fg: colors.primary, radius: 12, iconSize: 20 },
    danger: { bg: colors.dangerBg, fg: colors.danger, radius: 12, iconSize: 20 },
    primary: { bg: colors.primary, fg: colors.onPrimary, radius: 22, iconSize: 22 },
    ghost: { bg: colors.transparent, fg: colors.primary, radius: 22, iconSize: 24 },
};

interface Props {
    icon: ComponentProps<typeof Feather>['name'];
    label: string;
    onPress: () => void;
    variant?: Variant;
}

export function IconButton({ icon, label, onPress, variant = 'light' }: Props) {
    const t = THEME[variant];
    const isGhost = variant === 'ghost';
    return (
        <Pressable
            onPress={onPress}
            hitSlop={isGhost ? 12 : undefined}
            accessibilityRole='button'
            accessibilityLabel={label}
            style={({ pressed }) => [
                isGhost ? styles.ghost : styles.box,
                { borderRadius: t.radius, backgroundColor: t.bg, opacity: pressed ? 0.7 : 1 },
            ]}
        >
            <Feather name={icon} size={t.iconSize} color={t.fg} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    box: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ghost: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
