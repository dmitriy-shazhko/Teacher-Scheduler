import { colors } from '@/domain/theme';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

export function BatteryHint() {
    const openSettings = () => {
        Linking.openSettings();
    };

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Уведомления приходят с опозданием?</Text>
            <Text style={styles.text}>
                Телефон может ограничивать фоновую работу приложения. Отключите ограничения батареи
                для Schedule.
            </Text>
            <Pressable style={styles.button} onPress={openSettings}>
                <Text style={styles.buttonText}>Открыть настройки приложения</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.warnBg,
        borderRadius: 14,
        padding: 16,
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.warnText,
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.warnText,
    },
    button: {
        marginTop: 4,
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.onPrimary,
    },
});
