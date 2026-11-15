import { openDateTimePicker } from '@/components/PickerField';
import { SETTING_OPTIONS } from '@/domain/constants';
import { addMinutesToTime, dateToTime, timeToDate } from '@/domain/dates';
import { timeDiff } from '@/domain/schedule';
import { colors } from '@/domain/theme';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DURATIONS = SETTING_OPTIONS.lessonDurationMinutes;
const OPEN_MS = 240;
const CLOSE_MS = 160;

interface Props {
    startTime: string;
    endTime: string;
    defaultDuration: number;
    onApply: (startTime: string, endTime: string) => void;
    onClose: () => void;
}

export function TimePickerModal({ startTime, endTime, defaultDuration, onApply, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const [draftStart, setDraftStart] = useState(startTime);
    const [draftEnd, setDraftEnd] = useState(endTime);
    const [progress] = useState(() => new Animated.Value(0));
    const isClosing = useRef(false);

    const animateOut = (done: () => void) => {
        if (isClosing.current) return;

        isClosing.current = true;
        Animated.timing(progress, {
            toValue: 0,
            duration: CLOSE_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(done);
    };

    const close = () => animateOut(onClose);
    const apply = () => animateOut(() => onApply(draftStart, draftEnd));
    const translateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [height, 0],
    });

    const duration = timeDiff(draftStart, draftEnd);
    const initialDuration = timeDiff(startTime, endTime);
    const durationOptions = Array.from(new Set([...DURATIONS, defaultDuration, initialDuration]))
        .filter((value) => value > 0)
        .sort((a, b) => a - b);

    const pickStart = (time: string) => {
        setDraftStart(time);
        setDraftEnd(addMinutesToTime(time, duration > 0 ? duration : defaultDuration));
    };

    const pickEnd = (time: string) => setDraftEnd(time);

    const openStartPicker = () =>
        openDateTimePicker('time', timeToDate(draftStart), (d) => pickStart(dateToTime(d)));

    const openEndPicker = () =>
        openDateTimePicker('time', timeToDate(draftEnd), (d) => pickEnd(dateToTime(d)));

    const pickDuration = (value: number) => setDraftEnd(addMinutesToTime(draftStart, value));

    useEffect(() => {
        Animated.timing(progress, {
            toValue: 1,
            duration: OPEN_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [progress]);

    return (
        <Modal visible transparent animationType='none' onRequestClose={close} statusBarTranslucent>
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={close} />

                <Animated.View
                    style={[
                        styles.sheet,
                        { paddingBottom: insets.bottom + 20, transform: [{ translateY }] },
                    ]}
                >
                    <View style={styles.handle} />
                    <Text style={styles.title}>Время урока</Text>

                    <View style={styles.fields}>
                        <Pressable
                            style={styles.field}
                            onPress={openStartPicker}
                            accessibilityRole='button'
                            accessibilityLabel='Изменить начало урока'
                        >
                            <Text style={styles.fieldLabel}>Начало</Text>
                            <Text style={styles.fieldValue}>{draftStart}</Text>
                        </Pressable>

                        <Pressable
                            style={styles.field}
                            onPress={openEndPicker}
                            accessibilityRole='button'
                            accessibilityLabel='Изменить конец урока'
                        >
                            <Text style={styles.fieldLabel}>Конец</Text>
                            <Text style={styles.fieldValue}>{draftEnd}</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.durationLabel}>Длительность, мин</Text>
                    <View style={styles.chips}>
                        {durationOptions.map((value) => {
                            const isSelected = value === duration;

                            return (
                                <Pressable
                                    key={value}
                                    style={[styles.chip, isSelected && styles.chipSelected]}
                                    onPress={() => pickDuration(value)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            isSelected && styles.chipTextSelected,
                                        ]}
                                    >
                                        {value}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Pressable
                        style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
                        onPress={apply}
                    >
                        <Text style={styles.doneText}>Готово</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: colors.overlay,
    },
    sheet: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.barMuted,
        alignSelf: 'center',
        marginBottom: 14,
    },
    title: { fontSize: 17, fontWeight: '700', color: colors.text },
    fields: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 4 },
    field: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    fieldLabel: { fontSize: 12, color: colors.muted },
    fieldValue: { fontSize: 20, fontWeight: '700', color: colors.text },
    durationLabel: { fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
        flexBasis: '22%',
        flexGrow: 1,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryTint,
    },
    chipSelected: { backgroundColor: colors.primary },
    chipText: { fontSize: 15, fontWeight: '700', color: colors.text },
    chipTextSelected: { color: colors.onPrimary },
    doneButton: {
        height: 50,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
    pressed: { opacity: 0.85 },
});
