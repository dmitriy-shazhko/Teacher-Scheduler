import { AppSettings, Lesson, StatusKind, StatusStep } from '@/domain/types';
import { toDate } from './dates';

function byStart(a: Lesson, b: Lesson): number {
    return (a.date + a.startTime).localeCompare(b.date + b.startTime);
}

export function buildStatusTimeline(
    lessons: Lesson[],
    now: Date,
    settings: AppSettings,
): StatusStep[] {
    const { firstLessonStartingMinutes, lessonEndingMinutes } = settings;
    const active = lessons.filter((l) => !l.cancelled).sort(byStart);
    const steps: StatusStep[] = [];

    active.forEach((lesson, index) => {
        const before = active[index - 1];
        const after = active[index + 1];
        const prev = before && before.date === lesson.date ? before : null;
        const next = after && after.date === lesson.date ? after : null;

        const start = toDate(lesson.date, lesson.startTime);
        const end = toDate(lesson.date, lesson.endTime);
        const endingFrom = new Date(end.getTime() - lessonEndingMinutes * 60_000);

        const upcomingFrom = prev
            ? toDate(prev.date, prev.endTime)
            : new Date(start.getTime() - firstLessonStartingMinutes * 60_000);

        const add = (kind: StatusKind, showAt: Date, hideAt: Date) => {
            if (showAt < hideAt) {
                steps.push({
                    id: `status-${lesson.id}-${kind}`,
                    kind,
                    lesson,
                    next,
                    showAt,
                    hideAt,
                });
            }
        };

        add('upcoming', upcomingFrom, start);
        add('current', start, endingFrom);
        add('ending', endingFrom, end);
    });

    return steps.filter((s) => s.hideAt > now);
}
