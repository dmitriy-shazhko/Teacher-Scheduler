import { CurrentAndNextLessons, Lesson } from './types';

function toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);

    return h * 60 + m;
}

export function lessonIsPassed(lesson: Lesson, now: Date): boolean {
    const nowMin = now.getHours() * 60 + now.getMinutes();

    return toMinutes(lesson.endTime) <= nowMin;
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
