import { formatDuration } from '@/domain/schedule';
import { colors } from '@/domain/theme';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface Props {
    title: string;
    options: number[];
    selected: number;
    min: number;
    max: number;
    onSelect: (value: number) => void;
    onClose: () => void;
}

export function OptionPickerModal({
    title,
    options,
    selected,
    min,
    max,
    onSelect,
    onClose,
}: Props) {
    const [isCustom, setIsCustom] = useState(false);
    const [text, setText] = useState('');

    const values = options.includes(selected)
        ? options
        : [...options, selected].sort((a, b) => a - b);

    const parsed = Number(text);
    const isValid = text !== '' && parsed >= min && parsed <= max;
    const showError = text !== '' && !isValid;

    return (
        <Modal visible transparent animationType='fade' onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={styles.sheet}>
                    <Text style={styles.title}>{title}</Text>

                    {isCustom ? (
                        <View>
                            <TextInput
                                style={styles.input}
                                value={text}
                                onChangeText={(t) => setText(t.replace(/\D/g, ''))}
                                keyboardType='number-pad'
                                placeholder='Минут'
                                placeholderTextColor={colors.muted}
                                maxLength={3}
                                autoFocus
                            />
                            <Text style={[styles.hint, showError && styles.hintError]}>
                                От {min} до {max} мин
                            </Text>
                            <View style={styles.buttons}>
                                <Pressable
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => setIsCustom(false)}
                                >
                                    <Text style={styles.cancelText}>Назад</Text>
                                </Pressable>
                                <Pressable
                                    style={[
                                        styles.button,
                                        styles.saveButton,
                                        !isValid && styles.disabled,
                                    ]}
                                    disabled={!isValid}
                                    onPress={() => onSelect(parsed)}
                                >
                                    <Text style={styles.saveText}>Сохранить</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <>
                            {values.map((value) => {
                                const isSelected = value === selected;
                                return (
                                    <Pressable
                                        key={value}
                                        style={styles.option}
                                        onPress={() => onSelect(value)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                isSelected && styles.selectedText,
                                            ]}
                                        >
                                            {formatDuration(value)}
                                        </Text>
                                        {isSelected && <Text style={styles.selectedText}>✓</Text>}
                                    </Pressable>
                                );
                            })}
                            <Pressable style={styles.option} onPress={() => setIsCustom(true)}>
                                <Text style={styles.selectedText}>Своё значение…</Text>
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        backgroundColor: colors.overlay,
    },
    sheet: {
        backgroundColor: colors.card,
        borderRadius: 14,
        paddingVertical: 8,
        overflow: 'hidden',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    option: {
        height: 48,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionText: { fontSize: 16, color: colors.text },
    selectedText: { fontSize: 16, fontWeight: '600', color: colors.primary },
    input: {
        height: 48,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
    },
    hint: { fontSize: 13, color: colors.muted, marginHorizontal: 16, marginTop: 8 },
    hintError: { color: colors.danger },
    buttons: { flexDirection: 'row', gap: 8, padding: 16 },
    button: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: { backgroundColor: colors.divider },
    cancelText: { fontSize: 15, fontWeight: '600', color: colors.text },
    saveButton: { backgroundColor: colors.primary },
    saveText: { fontSize: 15, fontWeight: '600', color: colors.onPrimary },
    disabled: { opacity: 0.4 },
});
