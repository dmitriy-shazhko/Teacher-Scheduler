import { CopyLessonsModal } from '@/components/CopyLessonsModal';
import { DayStrip } from '@/components/DayStrip';
import { IconButton } from '@/components/IconButton';
import { LessonCard } from '@/components/LessonCard';
import { LessonSectionHeader, LessonSectionTone } from '@/components/LessonSectionHeader';
import { Screen } from '@/components/Screen';
import { WeekSwitcher } from '@/components/WeekSwitcher';
import { countLessonsForWeek } from '@/db/lessons';
import { MONTHS, WEEKDAYS } from '@/domain/constants';
import {
    addDays,
    formatWeek,
    nearestWeekdayIndex,
    startOfWeek,
    toDateString,
} from '@/domain/dates';
import { dayTimeRange, splitDayLessons, weekLessonDays } from '@/domain/schedule';
import { pluralLessons } from '@/domain/textFormaters';
import { colors } from '@/domain/theme';
import { CopyLessonsSource, Lesson } from '@/domain/types';
import { useLessonActions } from '@/hooks/useLessonActions';
import { useLessonStore } from '@/store/lessonsStore';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, SectionList, StyleSheet, Text, View } from 'react-native';

interface DaySection {
    key: 'active' | 'passed' | 'cancelled';
    title: string;
    tone: LessonSectionTone;
    data: Lesson[];
}

export default function WeekScreen() {
    const db = useSQLiteContext();
    const loadWeek = useLessonStore((s) => s.loadWeek);
    const lessons = useLessonStore((s) => s.lessons);
    const copyWeek = useLessonStore((s) => s.copyWeek);
    const { addLesson } = useLessonActions();

    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [copyOpen, setCopyOpen] = useState(false);
    const [sources, setSources] = useState<CopyLessonsSource[]>([]);
    const [isCopying, setIsCopying] = useState(false);
    const [now, setNow] = useState(() => new Date());
    const [selected, setSelected] = useState(() =>
        Math.min((new Date().getDay() + 6) % 7, WEEKDAYS.length - 1),
    );
    const todayStr = toDateString(now);
    const todayIndex = WEEKDAYS.findIndex(
        (_, i) => toDateString(addDays(weekStart, i)) === todayStr,
    );
    const isCurrentWeek = toDateString(weekStart) === toDateString(startOfWeek(now));

    const day = addDays(weekStart, selected);
    const dayStr = toDateString(day);
    const dayLessons = lessons.filter((l) => l.date === dayStr);
    const dayRange = dayTimeRange(dayLessons);
    const hasLessonsByDay = weekLessonDays(lessons, weekStart);

    const { active, passed, cancelled } = splitDayLessons(dayLessons, now);
    const allSections: DaySection[] = [
        { key: 'active', title: 'Активные уроки', tone: 'accent', data: active },
        { key: 'passed', title: 'Прошедшие уроки', tone: 'muted', data: passed },
        { key: 'cancelled', title: 'Отменённые уроки', tone: 'cancelled', data: cancelled },
    ];
    const sections = allSections.filter((s) => s.data.length > 0);

    const summary = dayRange
        ? `${pluralLessons(dayLessons.length)} · ${dayRange.start} – ${dayRange.end}`
        : 'Уроков нет';

    const load = useCallback(() => loadWeek(db, weekStart), [db, weekStart, loadWeek]);

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
        if (isCopying) return;
        setIsCopying(true);
        try {
            const copiedDates = await copyWeek(db, source, weekStart);
            setCopyOpen(false);
            // показываем день, где появились уроки, ближайший к сегодняшнему
            const nearest = nearestWeekdayIndex(copiedDates, new Date());
            if (nearest >= 0) setSelected(nearest);
        } finally {
            setIsCopying(false);
        }
    };

    const pickSource = (source: Date) => {
        if (isCopying) return;
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

    const toNextWeek = () => shiftWeek(1);
    const toPrevWeek = () => shiftWeek(-1);

    useFocusEffect(
        useCallback(() => {
            load();

            // минута сменилась — пересчитываем «прошедшие/активные»;
            // смена суток тоже приходит этим обновлением
            const clock = setInterval(() => {
                const current = new Date();

                setNow((prev) =>
                    Math.floor(current.getTime() / 60_000) === Math.floor(prev.getTime() / 60_000)
                        ? prev
                        : current,
                );
            }, 1000);

            return () => clearInterval(clock);
        }, [load]),
    );

    return (
        <Screen
            title='Неделя'
            rightBlock={<IconButton icon='copy' label='Копировать неделю' onPress={openCopy} />}
        >
            <WeekSwitcher
                label={formatWeek(weekStart)}
                isCurrent={isCurrentWeek}
                onPrev={toPrevWeek}
                onNext={toNextWeek}
                onToday={setCurrentWeek}
            />

            <DayStrip
                weekStart={weekStart}
                selected={selected}
                todayIndex={todayIndex}
                hasLessons={hasLessonsByDay}
                onSelect={setSelected}
            />

            <View style={styles.dayHeader}>
                <View>
                    <Text style={styles.dayTitle}>
                        {WEEKDAYS[selected]}, {day.getDate()} {MONTHS[day.getMonth()]}
                    </Text>
                    <Text style={styles.daySub}>{summary}</Text>
                </View>
                <IconButton
                    variant='primary'
                    icon='plus'
                    label='Добавить урок'
                    onPress={() => addLesson(dayStr)}
                />
            </View>

            <View style={styles.listBox}>
                {dayLessons.length === 0 ? (
                    <Text style={styles.empty}>В этот день уроков нет</Text>
                ) : (
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item, section }) => (
                            <LessonCard lesson={item} passed={section.key === 'passed'} />
                        )}
                        renderSectionHeader={({ section }) => (
                            <LessonSectionHeader
                                title={section.title}
                                count={section.data.length}
                                tone={section.tone}
                            />
                        )}
                        stickySectionHeadersEnabled={false}
                        contentContainerStyle={styles.list}
                    />
                )}
            </View>

            <CopyLessonsModal
                targetWeekStart={weekStart}
                sources={sources}
                isOpen={copyOpen}
                isBusy={isCopying}
                onClose={() => setCopyOpen(false)}
                pickSource={pickSource}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 10,
    },
    dayTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    daySub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    listBox: { flex: 1 },
    list: { paddingBottom: 16 },
    empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
});
