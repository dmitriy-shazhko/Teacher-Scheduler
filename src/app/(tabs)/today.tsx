import { LessonCard } from '@/components/LessonCard';
import { NowCard } from '@/components/NowCard';
import { REFRESH_LESSONS_MS } from '@/domain/constants';
import { formatDateRu, toDateString } from '@/domain/dates';
import { formatDuration, getCurrentAndNextLessons, lessonIsPassed } from '@/domain/schedule';
import { useLessonStore } from '@/store/lessonsStore';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

export default function TodayScreen() {
    const db = useSQLiteContext();
    const lessons = useLessonStore((s) => s.todayLessons);
    const loadToday = useLessonStore((s) => s.loadToday);
    const [now, setNow] = useState(() => new Date());

    const { current, next, minutesLeft, minutesToNext } = useMemo(
        () => getCurrentAndNextLessons(lessons, now),
        [lessons, now],
    );

    const others = lessons.filter(
        (l) => l.id !== current?.id && l.id !== next?.id && !l.cancelled && !lessonIsPassed(l, now),
    );
    const cancelledLessons = lessons.filter((l) => l.cancelled);
    const passedLessons = lessons.filter((l) => !l.cancelled && lessonIsPassed(l, now));

    const sections = [
        { title: 'Остальные уроки', data: others },
        { title: 'Прошедшие уроки', data: passedLessons },
        { title: 'Отмененные уроки', data: cancelledLessons },
    ].filter((s) => s.data.length > 0);

    const header = (
        <View>
            {current && minutesLeft !== null && (
                <NowCard
                    accent
                    label='Текущий урок'
                    hint={`осталось ${formatDuration(minutesLeft)} до конца урока`}
                    lesson={current}
                />
            )}
            {next && minutesToNext !== null && (
                <NowCard
                    label='Следующий урок'
                    hint={`осталось ${formatDuration(minutesToNext)} до начала урока`}
                    lesson={next}
                />
            )}
            {!current && !next && lessons.length > 0 && (
                <Text style={styles.done}>Уроков сегодня больше нет</Text>
            )}
        </View>
    );

    useFocusEffect(
        useCallback(() => {
            const tick = () => {
                setNow(new Date());
                loadToday(db);
            };

            tick();

            const timer = setInterval(tick, REFRESH_LESSONS_MS);

            return () => clearInterval(timer);
        }, [db, loadToday]),
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Сегодня</Text>
            <Text style={styles.date}>{formatDateRu(toDateString(now))}</Text>

            {lessons.length === 0 ? (
                <Text style={styles.empty}>Сегодня уроков нет</Text>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <LessonCard lesson={item} />}
                    renderSectionHeader={({ section }) => (
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                    )}
                    ListHeaderComponent={header}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    date: {
        color: '#888',
        marginBottom: 16,
    },
    empty: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
    done: {
        color: '#888',
        fontSize: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
});
