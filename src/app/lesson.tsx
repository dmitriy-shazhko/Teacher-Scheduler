import { PickerField } from '@/components/PickerField';
import { getLessonById } from '@/db/lessons';
import { dateToTime, formatDateRu, parseDate, timeToDate, toDateString } from '@/domain/dates';
import { useLessonStore } from '@/store/lessonsStore';
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
    const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
    const isEdit = id !== undefined;

    const [lessonDate, setLessonDate] = useState(date ?? toDateString(new Date()));
    const [startTime, setStartTime] = useState('08:30');
    const [endTime, setEndTime] = useState('09:15');
    const [className, setClassName] = useState('');
    const [room, setRoom] = useState('');
    const [topic, setTopic] = useState('');
    const [cancelled, setCancelled] = useState(false);

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

        await saveLesson(db, isEdit ? Number(id) : null, data);
        router.back();
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
        >
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Text style={styles.back}>‹ Назад</Text>
                </Pressable>
                <Text style={styles.title}>{isEdit ? 'Урок' : 'Новый урок'}</Text>
            </View>

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
                        onChange={(d) => setStartTime(dateToTime(d))}
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

            <Pressable style={styles.saveButton} onPress={save}>
                <Text style={styles.saveText}>Сохранить</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingTop: 60 },
    header: { marginBottom: 16 },
    back: { color: '#4a4ae0', fontSize: 16, marginBottom: 8 },
    title: { fontSize: 28, fontWeight: 'bold' },
    label: { fontWeight: '600', marginBottom: 4, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
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
    switchLabel: { fontSize: 16 },
    saveButton: {
        backgroundColor: '#4a4ae0',
        padding: 14,
        borderRadius: 8,
        marginTop: 24,
    },
    saveText: { color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 16 },
});
