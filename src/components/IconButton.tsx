import { colors } from '@/domain/theme';
import { Feather } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

type Variant = 'light' | 'danger' | 'primary' | 'ghost';

/** Сторона кнопки по умолчанию; иконка и радиус считаются от неё пропорционально. */
const DEFAULT_SIZE = 44;
/** 20 px иконки в кнопке 44 px. */
const ICON_RATIO = 0.45;

// radius задан для DEFAULT_SIZE и масштабируется вместе с size
const THEME = {
    light: { bg: colors.card, fg: colors.primary, radius: 12 },
    danger: { bg: colors.dangerBg, fg: colors.danger, radius: 12 },
    primary: { bg: colors.primary, fg: colors.onPrimary, radius: 22 },
    ghost: { bg: colors.transparent, fg: colors.primary, radius: 22 },
};

interface Props {
    icon: ComponentProps<typeof Feather>['name'];
    label: string;
    onPress: () => void;
    variant?: Variant;
    /** Сторона квадратной кнопки в px, по умолчанию 44. */
    size?: number;
}

export function IconButton({
    icon,
    label,
    onPress,
    variant = 'light',
    size = DEFAULT_SIZE,
}: Props) {
    const t = THEME[variant];
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole='button'
            accessibilityLabel={label}
            style={({ pressed }) => [
                styles.button,
                {
                    width: size,
                    height: size,
                    borderRadius: Math.round(size * (t.radius / DEFAULT_SIZE)),
                    backgroundColor: t.bg,
                    opacity: pressed ? 0.7 : 1,
                },
            ]}
        >
            <Feather name={icon} size={Math.round(size * ICON_RATIO)} color={t.fg} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
