import {
    dayTimeRange,
    formatDuration,
    getCurrentAndNextLessons,
    getNextLessonOfDay,
    lessonIsPassed,
    sortDayLessons,
    timeDiff,
    toMinutes,
    weekLessonDays,
} from '@/domain/schedule';
import { makeLesson } from '../../test/helpers/lessons';

// Время в понедельник 5 октября 2026
const at = (h: number, m: number) => new Date(2026, 9, 5, h, m);

describe('toMinutes', () => {
    it.each([
        ['00:00', 0],
        ['08:30', 510],
        ['09:05', 545],
        ['23:59', 1439],
    ])('%s → %i мин', (time, expected) => {
        expect(toMinutes(time)).toBe(expected);
    });
});

describe('timeDiff', () => {
    it.each([
        ['08:30', '09:15', 45],
        ['08:30', '08:30', 0],
        ['09:15', '08:30', -45],
        ['23:50', '23:59', 9],
    ])('%s → %s = %i мин', (from, to, expected) => {
        expect(timeDiff(from, to)).toBe(expected);
    });
});

describe('lessonIsPassed', () => {
    const lesson = makeLesson({ startTime: '08:30', endTime: '09:15' });

    it.each([
        ['до начала', at(8, 0), false],
        ['посреди урока', at(8, 45), false],
        ['за минуту до конца', at(9, 14), false],
        ['ровно в момент конца', at(9, 15), true],
        ['через минуту после конца', at(9, 16), true],
        ['намного позже', at(15, 0), true],
    ])('%s', (_title, now, expected) => {
        expect(lessonIsPassed(lesson, now)).toBe(expected);
    });
});

describe('getCurrentAndNextLessons', () => {
    const l1 = makeLesson({ id: 1, startTime: '08:30', endTime: '09:15' });
    const l2 = makeLesson({ id: 2, startTime: '09:25', endTime: '10:10' });
    const l3 = makeLesson({ id: 3, startTime: '10:20', endTime: '11:05' });
    const lessons = [l1, l2, l3];

    it.each([
        ['до первого урока', at(8, 0), null, l1, null, 30],
        ['ровно в начало первого урока', at(8, 30), l1, l2, 45, 55],
        ['за минуту до конца урока', at(9, 14), l1, l2, 1, 11],
        ['ровно в конец урока (он уже прошёл)', at(9, 15), null, l2, null, 10],
        ['на перемене', at(9, 20), null, l2, null, 5],
        ['на последнем уроке', at(10, 30), l3, null, 35, null],
        ['после всех уроков', at(12, 0), null, null, null, null],
    ])('%s', (_title, now, current, next, minutesLeft, minutesToNext) => {
        const result = getCurrentAndNextLessons(lessons, now);

        expect(result.current).toBe(current);
        expect(result.next).toBe(next);
        expect(result.minutesLeft).toBe(minutesLeft);
        expect(result.minutesToNext).toBe(minutesToNext);
    });

    it('пустой список — всё null', () => {
        expect(getCurrentAndNextLessons([], at(9, 0))).toEqual({
            current: null,
            next: null,
            minutesLeft: null,
            minutesToNext: null,
        });
    });

    it('отменённые уроки игнорируются', () => {
        const cancelled = { ...l2, cancelled: true };

        const result = getCurrentAndNextLessons([l1, cancelled, l3], at(9, 20));

        expect(result.next).toBe(l3);
        expect(result.minutesToNext).toBe(60);
    });

    it('отменённый урок не становится текущим', () => {
        const cancelled = { ...l1, cancelled: true };

        expect(getCurrentAndNextLessons([cancelled], at(8, 45)).current).toBeNull();
    });

    it('уроки подряд без перемены: в момент стыка текущий — следующий урок', () => {
        const a = makeLesson({ id: 10, startTime: '08:30', endTime: '09:15' });
        const b = makeLesson({ id: 11, startTime: '09:15', endTime: '10:00' });

        const result = getCurrentAndNextLessons([a, b], at(9, 15));

        expect(result.current).toBe(b);
        expect(result.next).toBeNull();
    });

    it('порядок входного массива не важен и сам массив не меняется', () => {
        const shuffled = [l3, l1, l2];

        const result = getCurrentAndNextLessons(shuffled, at(9, 20));

        expect(result.next).toBe(l2);
        expect(shuffled).toEqual([l3, l1, l2]);
    });
});

describe('formatDuration', () => {
    it.each([
        [0, '0 мин'],
        [5, '5 мин'],
        [59, '59 мин'],
        [60, '1 ч'],
        [61, '1 ч 1 мин'],
        [90, '1 ч 30 мин'],
        [120, '2 ч'],
    ])('%i мин → %s', (minutes, expected) => {
        expect(formatDuration(minutes)).toBe(expected);
    });
});

describe('getNextLessonOfDay', () => {
    const current = makeLesson({ id: 1, startTime: '09:25', endTime: '10:10' });

    it('возвращает ближайший следующий урок того же дня независимо от порядка в массиве', () => {
        const near = makeLesson({ id: 2, startTime: '10:20', endTime: '11:05' });
        const far = makeLesson({ id: 3, startTime: '12:00', endTime: '12:45' });

        expect(getNextLessonOfDay([far, current, near], current)).toBe(near);
    });

    it('не берёт уроки другого дня', () => {
        const otherDay = makeLesson({
            id: 2,
            date: '2026-10-06',
            startTime: '10:20',
            endTime: '11:05',
        });

        expect(getNextLessonOfDay([current, otherDay], current)).toBeNull();
    });

    it('пропускает отменённые уроки', () => {
        const cancelled = makeLesson({
            id: 2,
            startTime: '10:20',
            endTime: '11:05',
            cancelled: true,
        });
        const after = makeLesson({ id: 3, startTime: '11:15', endTime: '12:00' });

        expect(getNextLessonOfDay([current, cancelled, after], current)).toBe(after);
    });

    it('не берёт более ранние уроки', () => {
        const earlier = makeLesson({ id: 2, startTime: '08:30', endTime: '09:15' });

        expect(getNextLessonOfDay([earlier, current], current)).toBeNull();
    });

    it('null, если уроков после текущего нет', () => {
        expect(getNextLessonOfDay([current], current)).toBeNull();
    });
});

describe('weekLessonDays', () => {
    const monday = new Date(2026, 9, 5); // пн 5 – вс 11 октября 2026

    it('пустая неделя — отметок нет', () => {
        expect(weekLessonDays([], monday)).toEqual([
            false,
            false,
            false,
            false,
            false,
            false,
            false,
        ]);
    });

    it('отмечает дни недели, где есть уроки', () => {
        const lessons = [
            makeLesson({ id: 1, date: '2026-10-05' }),
            makeLesson({ id: 2, date: '2026-10-07' }),
            makeLesson({ id: 3, date: '2026-10-11' }),
        ];

        expect(weekLessonDays(lessons, monday)).toEqual([
            true,
            false,
            true,
            false,
            false,
            false,
            true,
        ]);
    });

    it('несколько уроков в одном дне дают одну отметку', () => {
        const lessons = [
            makeLesson({ id: 1, date: '2026-10-06' }),
            makeLesson({ id: 2, date: '2026-10-06' }),
            makeLesson({ id: 3, date: '2026-10-06' }),
        ];

        expect(weekLessonDays(lessons, monday)).toEqual([
            false,
            true,
            false,
            false,
            false,
            false,
            false,
        ]);
    });

    it('игнорирует уроки соседних недель', () => {
        const lessons = [
            makeLesson({ id: 1, date: '2026-10-04' }), // воскресенье прошлой недели
            makeLesson({ id: 2, date: '2026-10-12' }), // понедельник следующей
        ];

        expect(weekLessonDays(lessons, monday)).toEqual([
            false,
            false,
            false,
            false,
            false,
            false,
            false,
        ]);
    });

    it('отменённый урок тоже отмечает день', () => {
        const lessons = [makeLesson({ id: 1, date: '2026-10-08', cancelled: true })];

        expect(weekLessonDays(lessons, monday)).toEqual([
            false,
            false,
            false,
            true,
            false,
            false,
            false,
        ]);
    });

    it('работает на неделе через границу года', () => {
        const lessons = [
            makeLesson({ id: 1, date: '2026-12-31' }),
            makeLesson({ id: 2, date: '2027-01-01' }),
        ];

        expect(weekLessonDays(lessons, new Date(2026, 11, 28))).toEqual([
            false,
            false,
            false,
            true,
            true,
            false,
            false,
        ]);
    });
});

describe('sortDayLessons', () => {
    const early = makeLesson({ id: 1, startTime: '08:30', endTime: '09:15' });
    const late = makeLesson({ id: 2, startTime: '12:00', endTime: '12:45' });
    const cancelledEarly = makeLesson({
        id: 3,
        startTime: '09:25',
        endTime: '10:10',
        cancelled: true,
    });
    const cancelledLate = makeLesson({
        id: 4,
        startTime: '10:20',
        endTime: '11:05',
        cancelled: true,
    });

    it('ставит отменённые уроки после активных', () => {
        const result = sortDayLessons([cancelledLate, early, cancelledEarly, late]);

        expect(result.map((l) => l.id)).toEqual([1, 2, 3, 4]);
    });

    it('внутри групп сохраняет порядок по времени начала', () => {
        const result = sortDayLessons([late, early, cancelledLate, cancelledEarly]);

        expect(result.map((l) => l.startTime)).toEqual(['08:30', '12:00', '09:25', '10:20']);
    });

    it('один отменённый урок уходит в конец, даже если он первый по времени', () => {
        const result = sortDayLessons([cancelledEarly, late]);

        expect(result.map((l) => l.id)).toEqual([2, 3]);
    });

    it('входной массив не меняется', () => {
        const lessons = [cancelledLate, late, early];

        sortDayLessons(lessons);

        expect(lessons).toEqual([cancelledLate, late, early]);
    });

    it('пустой список — пустой результат', () => {
        expect(sortDayLessons([])).toEqual([]);
    });
});

describe('dayTimeRange', () => {
    it('пустой список — null', () => {
        expect(dayTimeRange([])).toBeNull();
    });

    it('самый ранний старт и самый поздний конец независимо от порядка', () => {
        const lessons = [
            makeLesson({ id: 1, startTime: '10:20', endTime: '11:05' }),
            makeLesson({ id: 2, startTime: '08:30', endTime: '09:15' }),
        ];

        expect(dayTimeRange(lessons)).toEqual({ start: '08:30', end: '11:05' });
    });

    it('учитывает отменённые уроки', () => {
        const lessons = [
            makeLesson({ id: 1, startTime: '08:30', endTime: '09:15' }),
            makeLesson({
                id: 2,
                startTime: '09:25',
                endTime: '14:00',
                cancelled: true,
            }),
        ];

        expect(dayTimeRange(lessons)).toEqual({ start: '08:30', end: '14:00' });
    });
});
