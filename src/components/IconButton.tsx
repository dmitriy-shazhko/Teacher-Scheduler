import { colors } from '@/domain/theme';
import { Feather } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable } from 'react-native';

type Variant = 'light' | 'danger' | 'primary';

const THEME = {
    light: { bg: colors.card, fg: colors.primary, radius: 12 },
    danger: { bg: colors.dangerBg, fg: colors.danger, radius: 12 },
    primary: { bg: colors.primary, fg: colors.onPrimary, radius: 22 },
};

interface Props {
    icon: ComponentProps<typeof Feather>['name'];
    label: string;
    onPress: () => void;
    variant?: Variant;
}

export function IconButton({ icon, label, onPress, variant = 'light' }: Props) {
    const t = THEME[variant];
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole='button'
            accessibilityLabel={label}
            style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: t.radius,
                backgroundColor: t.bg,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
            })}
        >
            <Feather name={icon} size={variant === 'primary' ? 22 : 20} color={t.fg} />
        </Pressable>
    );
}
