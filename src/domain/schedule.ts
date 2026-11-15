import { WEEKDAYS } from './constants';
import { addDays, toDateString } from './dates';
import { CurrentAndNextLessons, DayLessonGroups, Lesson } from './types';

export function toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);

    return h * 60 + m;
}

// разница между временами в минутах: '08:30', '09:15' -> 45
export function timeDiff(from: string, to: string): number {
    return toMinutes(to) - toMinutes(from);
}

export function lessonIsPassed(lesson: Lesson, now: Date): boolean {
    const nowMin = now.getHours() * 60 + now.getMinutes();

    return toMinutes(lesson.endTime) <= nowMin;
}

// сколько процентов урока прошло (0–100); вне урока — 0 или 100
export function lessonProgress(lesson: Lesson, now: Date): number {
    const start = toMinutes(lesson.startTime);
    const end = toMinutes(lesson.endTime);
    const nowMin = now.getHours() * 60 + now.getMinutes();

    if (end <= start || nowMin <= start) return 0;
    if (nowMin >= end) return 100;

    return Math.round(((nowMin - start) / (end - start)) * 100);
}

export function getCurrentAndNextLessons(lessons: Lesson[], now: Date): CurrentAndNextLessons {
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const active = lessons
        .filter((l) => !l.cancelled)
        .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

    const current =
        active.find((l) => nowMin >= toMinutes(l.startTime) && toMinutes(l.endTime) > nowMin) ??
        null;

    const next = active.find((l) => toMinutes(l.startTime) > nowMin) ?? null;

    return {
        current,
        next,
        minutesLeft: current ? toMinutes(current.endTime) - nowMin : null,
        minutesToNext: next ? toMinutes(next.startTime) - nowMin : null,
    };
}

export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} мин`;

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
}

export function getNextLessonOfDay(lessons: Lesson[], current: Lesson): Lesson | null {
    const currentStart = toMinutes(current.startTime);

    const candidates = lessons
        .filter(
            (l) => l.date === current.date && !l.cancelled && toMinutes(l.startTime) > currentStart,
        )
        .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

    return candidates[0] ?? null;
}

// по индексу дня недели (0 = понедельник) — есть ли в этот день уроки недели
// отменённые уроки тоже дают отметку: они остаются в списке дня
export function weekLessonDays(lessons: Lesson[], weekStart: Date): boolean[] {
    const dates = new Set(lessons.map((l) => l.date));

    return WEEKDAYS.map((_, i) => dates.has(toDateString(addDays(weekStart, i))));
}

// деление уроков дня на секции списка: отменённые — отдельно, остальные —
// прошедшие и активные. День в прошлом прошедший целиком, день в будущем ещё не
// начался, сегодняшний считается по границе end <= now. Внутри каждой группы —
// порядок по времени начала; входной массив не меняется.
export function splitDayLessons(lessons: Lesson[], now: Date): DayLessonGroups {
    const today = toDateString(now);
    const byStart = (a: Lesson, b: Lesson) => toMinutes(a.startTime) - toMinutes(b.startTime);

    const active: Lesson[] = [];
    const passed: Lesson[] = [];
    const cancelled: Lesson[] = [];

    for (const lesson of lessons) {
        if (lesson.cancelled) {
            cancelled.push(lesson);
        } else if (lesson.date < today || (lesson.date === today && lessonIsPassed(lesson, now))) {
            passed.push(lesson);
        } else {
            active.push(lesson);
        }
    }

    return {
        active: active.sort(byStart),
        passed: passed.sort(byStart),
        cancelled: cancelled.sort(byStart),
    };
}

// порядок списка дня: сначала активные уроки, отменённые — после них;
// внутри каждой группы — по времени начала. Входной массив не меняется.
export function sortDayLessons(lessons: Lesson[]): Lesson[] {
    return [...lessons].sort((a, b) => {
        if (a.cancelled !== b.cancelled) return a.cancelled ? 1 : -1;

        return toMinutes(a.startTime) - toMinutes(b.startTime);
    });
}

// диапазон дня для сводки: самый ранний старт и самый поздний конец;
// отменённые уроки учитываются, порядок массива не важен
export function dayTimeRange(lessons: Lesson[]): { start: string; end: string } | null {
    if (lessons.length === 0) return null;

    let start = lessons[0].startTime;
    let end = lessons[0].endTime;

    for (const lesson of lessons) {
        if (lesson.startTime < start) start = lesson.startTime;
        if (lesson.endTime > end) end = lesson.endTime;
    }

    return { start, end };
}
