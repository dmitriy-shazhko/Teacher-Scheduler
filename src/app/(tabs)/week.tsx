import { CopyLessonsModal } from '@/components/CopyLessonsModal';
import { DayCard } from '@/components/DayCard';
import { countLessonsForWeek } from '@/db/lessons';
import { WEEKDAYS } from '@/domain/constants';
import { addDays, formatWeek, startOfWeek, toDateString } from '@/domain/dates';
import { CopyLessonsSource } from '@/domain/types';
import { useLessonStore } from '@/store/lessonsStore';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WeekScreen() {
    const db = useSQLiteContext();
    const loadWeek = useLessonStore((s) => s.loadWeek);
    const lessons = useLessonStore((s) => s.lessons);
    const copyWeek = useLessonStore((s) => s.copyWeek);

    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [copyOpen, setCopyOpen] = useState(false);
    const [sources, setSources] = useState<CopyLessonsSource[]>([]);

    const load = useCallback(() => loadWeek(db, weekStart), [db, weekStart]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const shiftWeek = (n: number) => setWeekStart(addDays(weekStart, 7 * n));
    const setCurrentWeek = () => setWeekStart(startOfWeek(new Date()));

    // окно копирования: ищем предыдущие 8 недель, где есть уроки
    const openCopy = async () => {
        const found: CopyLessonsSource[] = [];
        for (let i = 1; i <= 8; i++) {
            const start = addDays(weekStart, -7 * i);
            const count = await countLessonsForWeek(db, start);
            if (count > 0) found.push({ start, count });
        }
        setSources(found);
        setCopyOpen(true);
    };

    const doCopy = async (source: Date) => {
        await copyWeek(db, source, weekStart);
        setCopyOpen(false);
    };

    const pickSource = (source: Date) => {
        if (lessons.length === 0) {
            doCopy(source);
            return;
        }
        Alert.alert(
            'На этой неделе уже есть уроки',
            'Добавить скопированные уроки к существующим?',
            [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Добавить', onPress: () => doCopy(source) },
            ],
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Неделя</Text>

            <View style={styles.weekSwitcher}>
                <Pressable onPress={() => shiftWeek(-1)} hitSlop={12}>
                    <Text style={styles.arrow}>‹</Text>
                </Pressable>
                <Text style={styles.weekLabel}>{formatWeek(weekStart)}</Text>
                <Pressable onPress={() => shiftWeek(1)} hitSlop={12}>
                    <Text style={styles.arrow}>›</Text>
                </Pressable>
            </View>

            <View style={styles.buttonsRow}>
                <Pressable style={[styles.button, styles.flex]} onPress={setCurrentWeek}>
                    <Text style={styles.buttonText}>Текущая неделя</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.flex]} onPress={openCopy}>
                    <Text style={styles.buttonText}>Скопировать неделю</Text>
                </Pressable>
            </View>

            <ScrollView>
                {WEEKDAYS.map((name, i) => {
                    const day = addDays(weekStart, i);
                    const dateStr = toDateString(day);
                    const dayLessons = lessons.filter((l) => l.date === dateStr);

                    return <DayCard key={dateStr} name={name} day={day} lessons={dayLessons} />;
                })}
            </ScrollView>

            <CopyLessonsModal
                targetWeekStart={weekStart}
                sources={sources}
                isOpen={copyOpen}
                onClose={() => setCopyOpen(false)}
                pickSource={pickSource}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, paddingTop: 60 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
    weekSwitcher: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    arrow: { fontSize: 32, paddingHorizontal: 12 },
    weekLabel: { fontSize: 18, fontWeight: '600' },
    buttonsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    flex: { flex: 1 },
    button: { backgroundColor: '#4a4ae0', padding: 12, borderRadius: 8 },
    buttonText: { color: 'white', fontWeight: '600', textAlign: 'center' },
    dayBlock: { marginBottom: 12 },
    dayTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
    empty: { color: '#888', marginBottom: 4 },
    card: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#eef',
        marginBottom: 8,
    },
    time: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    topic: { color: '#555', marginTop: 2 },
});
