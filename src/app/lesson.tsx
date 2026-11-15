import { FormCard } from '@/components/FormCard';
import { FormRow } from '@/components/FormRow';
import { PickerField } from '@/components/PickerField';
import { Screen } from '@/components/Screen';
import { TimePickerModal } from '@/components/TimePickerModal';
import { getLessonById } from '@/db/lessons';
import { addMinutesToTime, formatDateRu, parseDate, toDateString } from '@/domain/dates';
import { colors } from '@/domain/theme';
import { useLessonActions } from '@/hooks/useLessonActions';
import { useLessonStore } from '@/store/lessonsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function LessonFormScreen() {
    const db = useSQLiteContext();
    const saveLesson = useLessonStore((s) => s.saveLesson);
    const lessonDuration = useSettingsStore((s) => s.settings.lessonDurationMinutes);
    const { confirmRemove } = useLessonActions();
    const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
    const isEdit = id !== undefined;

    const [lessonDate, setLessonDate] = useState(date ?? toDateString(new Date()));
    const [startTime, setStartTime] = useState('08:30');
    const [endTime, setEndTime] = useState(() => addMinutesToTime('08:30', lessonDuration));
    const [className, setClassName] = useState('');
    const [room, setRoom] = useState('');
    const [topic, setTopic] = useState('');
    const [cancelled, setCancelled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTimeOpen, setIsTimeOpen] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            const lesson = await getLessonById(db, Number(id));
            if (!lesson) return;
            setLessonDate(lesson.date);
            setStartTime(lesson.startTime);
            setEndTime(lesson.endTime);
            setClassName(lesson.className);
            setRoom(lesson.room);
            setTopic(lesson.topic);
            setCancelled(lesson.cancelled);
        })();
    }, [db, id, isEdit]);

    const pickDate = (d: Date) => setLessonDate(toDateString(d));

    const openTime = () => setIsTimeOpen(true);
    const closeTime = () => setIsTimeOpen(false);

    const applyTime = (start: string, end: string) => {
        setStartTime(start);
        setEndTime(end);
        setIsTimeOpen(false);
    };

    const save = async () => {
        if (isSaving) return;
        if (endTime <= startTime) {
            Alert.alert('Неверное время', 'Конец урока должен быть позже начала');
            return;
        }
        if (!className.trim()) {
            Alert.alert('Укажите класс');
            return;
        }

        const data = {
            date: lessonDate,
            startTime,
            endTime,
            className: className.trim(),
            room: room.trim(),
            topic: topic.trim(),
            cancelled,
        };

        setIsSaving(true);
        try {
            await saveLesson(db, isEdit ? Number(id) : null, data);
            router.back();
        } finally {
            setIsSaving(false);
        }
    };

    const remove = () => {
        if (!id) return;
        confirmRemove(Number(id), () => router.back());
    };

    return (
        <Screen title={isEdit ? 'Урок' : 'Новый урок'} onBack={() => router.back()}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
                <FormCard>
                    <PickerField
                        label='Дата'
                        mode='date'
                        value={parseDate(lessonDate)}
                        display={formatDateRu(lessonDate)}
                        onChange={pickDate}
                    />

                    <FormRow label='Время' onPress={openTime}>
                        <Text style={styles.value}>
                            {startTime} – {endTime}
                        </Text>
                    </FormRow>

                    <FormRow label='Класс'>
                        <TextInput
                            style={styles.valueInput}
                            value={className}
                            onChangeText={setClassName}
                            placeholder='7Б'
                            placeholderTextColor={colors.placeholder}
                            accessibilityLabel='Класс'
                        />
                    </FormRow>

                    <FormRow label='Кабинет'>
                        <TextInput
                            style={styles.valueInput}
                            value={room}
                            onChangeText={setRoom}
                            placeholder='214'
                            placeholderTextColor={colors.placeholder}
                            accessibilityLabel='Кабинет'
                        />
                    </FormRow>

                    <FormRow label='Тема' isBlock isLast>
                        <TextInput
                            style={styles.topicInput}
                            value={topic}
                            onChangeText={setTopic}
                            placeholder='Квадратные уравнения'
                            placeholderTextColor={colors.placeholder}
                            accessibilityLabel='Тема'
                            multiline
                        />
                    </FormRow>
                </FormCard>

                {isEdit && (
                    <View style={styles.cancelCard}>
                        <Text style={styles.cancelLabel}>Урок отменён</Text>
                        <Switch
                            value={cancelled}
                            onValueChange={setCancelled}
                            trackColor={{ false: colors.barMuted, true: colors.primary }}
                            thumbColor={colors.card}
                        />
                    </View>
                )}

                <Pressable
                    style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
                    onPress={save}
                    disabled={isSaving}
                >
                    <Text style={styles.saveText}>Сохранить</Text>
                </Pressable>

                {isEdit && (
                    <Pressable
                        style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                        onPress={remove}
                        accessibilityRole='button'
                        accessibilityLabel='Удалить урок'
                    >
                        <Feather name='trash-2' size={18} color={colors.danger} />
                        <Text style={styles.deleteText}>Удалить урок</Text>
                    </Pressable>
                )}
            </ScrollView>

            {isTimeOpen && (
                <TimePickerModal
                    startTime={startTime}
                    endTime={endTime}
                    defaultDuration={lessonDuration}
                    onApply={applyTime}
                    onClose={closeTime}
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: { paddingBottom: 24 },
    value: { fontSize: 14, fontWeight: '700', color: colors.text },
    valueInput: {
        alignSelf: 'stretch',
        padding: 0,
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'right',
    },
    topicInput: {
        padding: 0,
        paddingTop: 2,
        minHeight: 44,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        textAlignVertical: 'top',
    },
    cancelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
        backgroundColor: colors.card,
    },
    cancelLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
    saveButton: {
        height: 50,
        marginTop: 16,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
    deleteButton: {
        height: 50,
        marginTop: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.dangerBorder,
        backgroundColor: colors.dangerSurface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    deleteText: { fontSize: 15, fontWeight: '600', color: colors.danger },
    pressed: { opacity: 0.85 },
});
