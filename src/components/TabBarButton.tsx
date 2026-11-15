// src/components/TabBarButton.tsx
import { colors } from '@/domain/theme';
import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { Pressable } from 'react-native';

export function TabBarButton({
    ref: _ref,
    href: _href,
    pressColor: _pressColor,
    pressOpacity: _pressOpacity,
    hoverEffect: _hoverEffect,
    ...props
}: BottomTabBarButtonProps) {
    return <Pressable {...props} android_ripple={{ color: colors.transparent }} />;
}
