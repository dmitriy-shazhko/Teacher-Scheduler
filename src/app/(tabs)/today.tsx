import { LessonCard } from '@/components/LessonCard';
import { LessonSectionHeader, LessonSectionTone } from '@/components/LessonSectionHeader';
import { NowCard } from '@/components/NowCard';
import { Screen } from '@/components/Screen';
import { formatDateFull, parseDate, toDateString } from '@/domain/dates';
import {
    formatDuration,
    getCurrentAndNextLessons,
    lessonIsPassed,
    lessonProgress,
    sortDayLessons,
} from '@/domain/schedule';
import { colors } from '@/domain/theme';
import { Lesson } from '@/domain/types';
import { useNow } from '@/hooks/useNow';
import { useLessonStore } from '@/store/lessonsStore';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { SectionList, StyleSheet, Text } from 'react-native';

interface DaySection {
    key: 'next' | 'later';
    title: string;
    tone: LessonSectionTone;
    note?: string;
    data: Lesson[];
}

export default function TodayScreen() {
    const db = useSQLiteContext();
    const lessons = useLessonStore((s) => s.todayLessons);
    const loadToday = useLessonStore((s) => s.loadToday);
    const now = useNow();

    const { current, next, minutesLeft, minutesToNext } = useMemo(
        () => getCurrentAndNextLessons(lessons, now),
        [lessons, now],
    );

    const main = current ?? next;
    const mainMinutes = current ? minutesLeft : minutesToNext;
    const mainProgress = current ? lessonProgress(current, now) : 0;

    const upcoming = sortDayLessons(
        lessons.filter((l) => !l.cancelled && !lessonIsPassed(l, now) && l.id !== main?.id),
    );
    const nextLesson = upcoming[0] ?? null;
    const afterMain = getCurrentAndNextLessons(upcoming, now);

    const allSections: DaySection[] = [
        {
            key: 'next',
            title: 'Следующий',
            tone: 'accent',
            note:
                afterMain.minutesToNext !== null
                    ? `через ${formatDuration(afterMain.minutesToNext)}`
                    : undefined,
            data: nextLesson ? [nextLesson] : [],
        },
        { key: 'later', title: 'Позже', tone: 'muted', data: upcoming.slice(1) },
    ];
    const sections = allSections.filter((s) => s.data.length > 0);
    const today = toDateString(now);
    const loadedDay = useRef(today);

    useFocusEffect(
        useCallback(() => {
            loadToday(db);
        }, [db, loadToday]),
    );

    useEffect(() => {
        if (loadedDay.current === today) return;

        loadedDay.current = today;
        // грузим именно тот день, который показан в заголовке, а не «сейчас» из стора
        loadToday(db, parseDate(today));
    }, [db, loadToday, today]);

    return (
        <Screen title='Сегодня'>
            <Text style={styles.date}>{formatDateFull(now)}</Text>

            {lessons.length === 0 ? (
                <Text style={styles.empty}>Сегодня уроков нет</Text>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, section }) => (
                        <LessonCard lesson={item} highlighted={section.key === 'next'} />
                    )}
                    renderSectionHeader={({ section }) => (
                        <LessonSectionHeader
                            title={section.title}
                            count={section.data.length}
                            note={section.note}
                            tone={section.tone}
                        />
                    )}
                    ListHeaderComponent={
                        main && mainMinutes !== null ? (
                            <NowCard
                                lesson={main}
                                state={current ? 'active' : 'soon'}
                                minutes={mainMinutes}
                                progress={mainProgress}
                            />
                        ) : (
                            <Text style={styles.empty}>Уроков сегодня больше нет</Text>
                        )
                    }
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.list}
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    date: {
        color: colors.muted,
        fontSize: 14,
        marginBottom: 14,
    },
    empty: {
        color: colors.muted,
        fontSize: 18,
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 18,
    },
    list: {
        paddingBottom: 16,
    },
});
