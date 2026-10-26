import { buildStatusTimeline } from '@/domain/statusTimeline';
import type { AppSettings, StatusStep } from '@/domain/types';
import { makeLesson } from '../../test/helpers/lessons';

const settings: AppSettings = {
    firstLessonStartingMinutes: 10,
    lessonEndingMinutes: 5,
    lessonDurationMinutes: 45,
};

const at = (h: number, m: number) => new Date(2026, 9, 5, h, m);
const kinds = (steps: StatusStep[]) => steps.map((s) => s.kind);
const ids = (steps: StatusStep[]) => steps.map((s) => s.id);

function expectNoOverlaps(steps: StatusStep[]) {
    const sorted = [...steps].sort((a, b) => a.showAt.getTime() - b.showAt.getTime());

    for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].showAt.getTime()).toBeGreaterThanOrEqual(sorted[i - 1].hideAt.getTime());
    }
}

const l1 = makeLesson({ id: 1, startTime: '08:30', endTime: '09:15' });
const l2 = makeLesson({ id: 2, startTime: '09:25', endTime: '10:10' });
const l3 = makeLesson({ id: 3, startTime: '10:20', endTime: '11:05' });

describe('шаги одного урока', () => {
    it('три шага подряд без разрывов', () => {
        const steps = buildStatusTimeline([l1], at(7, 0), settings);

        expect(steps.map((s) => [s.id, s.kind, s.showAt, s.hideAt])).toEqual([
            ['status-1-upcoming', 'upcoming', at(8, 20), at(8, 30)],
            ['status-1-current', 'current', at(8, 30), at(9, 10)],
            ['status-1-ending', 'ending', at(9, 10), at(9, 15)],
        ]);
    });

    it('в шагах лежат ссылки на сам урок и на следующий урок дня', () => {
        const steps = buildStatusTimeline([l1, l2], at(7, 0), settings);

        const first = steps.filter((s) => s.lesson === l1);
        const second = steps.filter((s) => s.lesson === l2);

        expect(first).toHaveLength(3);
        expect(first.every((s) => s.next === l2)).toBe(true);
        expect(second.every((s) => s.next === null)).toBe(true);
    });
});

describe('несколько уроков', () => {
    it('с переменой: перед вторым уроком upcoming идёт с конца первого', () => {
        const steps = buildStatusTimeline([l1, l2], at(7, 0), settings);

        expect(ids(steps)).toEqual([
            'status-1-upcoming',
            'status-1-current',
            'status-1-ending',
            'status-2-upcoming',
            'status-2-current',
            'status-2-ending',
        ]);

        const upcoming = steps.find((s) => s.id === 'status-2-upcoming');
        expect(upcoming?.showAt).toEqual(at(9, 15));
        expect(upcoming?.hideAt).toEqual(at(9, 25));
    });

    it('без перемены: у второго урока нет upcoming', () => {
        const back = makeLesson({ id: 2, startTime: '09:15', endTime: '10:00' });

        const steps = buildStatusTimeline([l1, back], at(7, 0), settings);

        expect(ids(steps)).toEqual([
            'status-1-upcoming',
            'status-1-current',
            'status-1-ending',
            'status-2-current',
            'status-2-ending',
        ]);
    });

    it('отменённый урок пропускается: upcoming третьего идёт с конца первого', () => {
        const cancelled = { ...l2, cancelled: true };

        const steps = buildStatusTimeline([l1, cancelled, l3], at(7, 0), settings);

        expect(steps.some((s) => s.id.startsWith('status-2-'))).toBe(false);
        expect(steps.filter((s) => s.lesson === l1).every((s) => s.next === l3)).toBe(true);

        const upcoming = steps.find((s) => s.id === 'status-3-upcoming');
        expect(upcoming?.showAt).toEqual(at(9, 15));
    });

    it('уроки разных дней не влияют друг на друга', () => {
        const tomorrow = makeLesson({
            id: 2,
            date: '2026-10-06',
            startTime: '08:30',
            endTime: '09:15',
        });

        const steps = buildStatusTimeline([l1, tomorrow], at(7, 0), settings);

        const upcoming = steps.find((s) => s.id === 'status-2-upcoming');
        expect(upcoming?.showAt).toEqual(new Date(2026, 9, 6, 8, 20));
        expect(steps.every((s) => s.next === null)).toBe(true);
    });

    it('порядок входного массива не важен, сам массив не меняется', () => {
        const input = [l3, l1, l2];

        const steps = buildStatusTimeline(input, at(7, 0), settings);

        expect(steps.filter((s) => s.kind === 'upcoming').map((s) => s.lesson.id)).toEqual([
            1, 2, 3,
        ]);
        expect(input).toEqual([l3, l1, l2]);
    });

    it('id всех шагов уникальны', () => {
        const steps = buildStatusTimeline([l1, l2, l3], at(7, 0), settings);

        expect(new Set(ids(steps)).size).toBe(steps.length);
    });

    it('шаги дня не пересекаются', () => {
        expectNoOverlaps(buildStatusTimeline([l1, l2, l3], at(7, 0), settings));
    });
});

describe('фильтрация по текущему времени', () => {
    it.each([
        ['до всего', at(7, 0), ['upcoming', 'current', 'ending']],
        ['посреди upcoming', at(8, 25), ['upcoming', 'current', 'ending']],
        ['ровно в начало урока: upcoming уже скрыт', at(8, 30), ['current', 'ending']],
        ['посреди урока', at(8, 45), ['current', 'ending']],
        ['ровно в начало ending: current уже скрыт', at(9, 10), ['ending']],
        ['посреди ending', at(9, 12), ['ending']],
        ['ровно в конец урока: ничего не осталось', at(9, 15), []],
        ['после урока', at(12, 0), []],
    ])('%s', (_title, now, expected) => {
        expect(kinds(buildStatusTimeline([l1], now, settings))).toEqual(expected);
    });

    it('прошедшие уроки отбрасываются, будущие остаются', () => {
        const tomorrow = makeLesson({
            id: 2,
            date: '2026-10-06',
            startTime: '08:30',
            endTime: '09:15',
        });

        const steps = buildStatusTimeline([l1, tomorrow], at(12, 0), settings);

        expect(ids(steps)).toEqual(['status-2-upcoming', 'status-2-current', 'status-2-ending']);
    });
});

describe('пустые входы', () => {
    it('нет уроков', () => {
        expect(buildStatusTimeline([], at(9, 0), settings)).toEqual([]);
    });

    it('все уроки отменены', () => {
        const cancelled = { ...l1, cancelled: true };

        expect(buildStatusTimeline([cancelled], at(7, 0), settings)).toEqual([]);
    });
});

describe('граничные настройки', () => {
    it('firstLessonStartingMinutes = 0: у первого урока нет upcoming, у второго есть', () => {
        const steps = buildStatusTimeline([l1, l2], at(7, 0), {
            ...settings,
            firstLessonStartingMinutes: 0,
        });

        expect(ids(steps)).not.toContain('status-1-upcoming');
        expect(ids(steps)).toContain('status-2-upcoming');
    });

    it('lessonEndingMinutes = 0: шага ending нет, current идёт до конца урока', () => {
        const steps = buildStatusTimeline([l1], at(7, 0), { ...settings, lessonEndingMinutes: 0 });

        expect(kinds(steps)).toEqual(['upcoming', 'current']);
        expect(steps[1].hideAt).toEqual(at(9, 15));
    });

    it('lessonEndingMinutes равен длительности урока: current пропадает, ending на весь урок', () => {
        const steps = buildStatusTimeline([l1], at(7, 0), { ...settings, lessonEndingMinutes: 45 });

        expect(kinds(steps)).toEqual(['upcoming', 'ending']);
        expect(steps[1].showAt).toEqual(at(8, 30));
        expect(steps[1].hideAt).toEqual(at(9, 15));
    });
});

describe('известные баги', () => {
    // TODO
    // Баг №1: предупреждение о конце урока длиннее самого урока.
    // Сейчас ending начинается раньше начала урока и перекрывает upcoming.
    // После исправления тест упадёт с сообщением о том, что failing-тест прошёл:
    // тогда убери `.failing`.
    it.failing('lessonEndingMinutes длиннее урока: шаги не пересекаются', () => {
        const steps = buildStatusTimeline([l1], at(7, 0), { ...settings, lessonEndingMinutes: 60 });

        expectNoOverlaps(steps);
    });
});
