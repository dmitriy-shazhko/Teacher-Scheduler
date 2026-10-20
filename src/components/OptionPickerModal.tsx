import { formatDuration } from '@/domain/schedule';
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sheet: {
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 8,
        overflow: 'hidden',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1c1c28',
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
    optionText: { fontSize: 16, color: '#1c1c28' },
    selectedText: { fontSize: 16, fontWeight: '600', color: '#4a4ae0' },
    input: {
        height: 48,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#d8d8e2',
        borderRadius: 10,
    },
    hint: { fontSize: 13, color: '#6b6b7a', marginHorizontal: 16, marginTop: 8 },
    hintError: { color: '#c0392b' },
    buttons: { flexDirection: 'row', gap: 8, padding: 16 },
    button: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: { backgroundColor: '#ececf2' },
    cancelText: { fontSize: 15, fontWeight: '600', color: '#1c1c28' },
    saveButton: { backgroundColor: '#4a4ae0' },
    saveText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    disabled: { opacity: 0.4 },
});
