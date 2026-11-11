import { PickerField } from '@/components/PickerField';
import { Screen } from '@/components/Screen';
import { getLessonById } from '@/db/lessons';
import {
    addMinutesToTime,
    dateToTime,
    formatDateRu,
    parseDate,
    timeToDate,
    toDateString,
} from '@/domain/dates';
import { colors } from '@/domain/theme';
import { useLessonStore } from '@/store/lessonsStore';
import { useSettingsStore } from '@/store/settingsStore';
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

    // при редактировании подгружаем урок из базы
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

    return (
        <Screen title={isEdit ? 'Урок' : 'Новый урок'} onBack={() => router.back()}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
                <PickerField
                    label='Дата'
                    mode='date'
                    value={parseDate(lessonDate)}
                    display={formatDateRu(lessonDate)}
                    onChange={(d) => setLessonDate(toDateString(d))}
                />

                <View style={styles.row}>
                    <View style={styles.flex}>
                        <PickerField
                            label='Начало'
                            mode='time'
                            value={timeToDate(startTime)}
                            display={startTime}
                            onChange={(d) => {
                                const start = dateToTime(d);
                                setStartTime(start);
                                setEndTime(addMinutesToTime(start, lessonDuration));
                            }}
                        />
                    </View>
                    <View style={styles.flex}>
                        <PickerField
                            label='Конец'
                            mode='time'
                            value={timeToDate(endTime)}
                            display={endTime}
                            onChange={(d) => setEndTime(dateToTime(d))}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.flex}>
                        <Text style={styles.label}>Класс</Text>
                        <TextInput
                            style={styles.input}
                            value={className}
                            onChangeText={setClassName}
                            placeholder='7Б'
                        />
                    </View>
                    <View style={styles.flex}>
                        <Text style={styles.label}>Кабинет</Text>
                        <TextInput
                            style={styles.input}
                            value={room}
                            onChangeText={setRoom}
                            placeholder='214'
                        />
                    </View>
                </View>

                <Text style={styles.label}>Тема</Text>
                <TextInput
                    style={[styles.input, styles.multiline]}
                    value={topic}
                    onChangeText={setTopic}
                    placeholder='Квадратные уравнения'
                    multiline
                />

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Урок отменён</Text>
                    <Switch value={cancelled} onValueChange={setCancelled} />
                </View>

                <Pressable style={styles.saveButton} onPress={save} disabled={isSaving}>
                    <Text style={styles.saveText}>Сохранить</Text>
                </Pressable>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: { paddingBottom: 16 },
    label: { fontWeight: '600', marginBottom: 4, marginTop: 12, color: colors.text },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: colors.text,
    },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 12 },
    flex: { flex: 1 },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    switchLabel: { fontSize: 16, color: colors.text },
    saveButton: {
        backgroundColor: colors.primary,
        padding: 14,
        borderRadius: 8,
        marginTop: 24,
    },
    saveText: { color: colors.onPrimary, fontWeight: '600', textAlign: 'center', fontSize: 16 },
});
