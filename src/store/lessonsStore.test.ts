import { getLessonsForDate, getLessonsForWeek } from '@/db/lessons';
import { Lesson } from '@/domain/types';
import { syncNotifications } from '@/notifications/scheduler';
import type { SQLiteDatabase } from 'expo-sqlite';

import { makeLesson } from '../../test/helpers/lessons';
import { useLessonStore } from './lessonsStore';

jest.mock('@/db/lessons', () => ({
    addLesson: jest.fn(),
    copyWeek: jest.fn(),
    deleteLesson: jest.fn(),
    getLessonsForDate: jest.fn(),
    getLessonsForWeek: jest.fn(),
    updateLesson: jest.fn(),
}));

jest.mock('@/notifications/scheduler', () => ({
    syncNotifications: jest.fn(() => Promise.resolve()),
}));

const mockedGetWeek = jest.mocked(getLessonsForWeek);
const mockedGetDate = jest.mocked(getLessonsForDate);
const mockedSync = jest.mocked(syncNotifications);

// соединение не нужно: все функции БД замоканы
const db = {} as SQLiteDatabase;

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
        resolve = r;
    });

    return { promise, resolve };
}

describe('lessonsStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useLessonStore.setState({ weekStart: null, lessons: [], todayLessons: [] });
    });

    describe('loadWeek', () => {
        it('оставляет уроки последней запрошенной недели, если ответы пришли наоборот', async () => {
            const mondayA = new Date(2026, 9, 5);
            const mondayB = new Date(2026, 9, 12);
            const first = deferred<Lesson[]>();
            const second = deferred<Lesson[]>();
            mockedGetWeek.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

            const loadA = useLessonStore.getState().loadWeek(db, mondayA);
            const loadB = useLessonStore.getState().loadWeek(db, mondayB);

            // новая неделя ответила раньше, старая — позже
            const lessonB = makeLesson({ id: 2, date: '2026-10-12' });
            second.resolve([lessonB]);
            await loadB;

            first.resolve([makeLesson({ id: 1, date: '2026-10-05' })]);
            await loadA;

            expect(useLessonStore.getState().weekStart).toEqual(mondayB);
            expect(useLessonStore.getState().lessons).toEqual([lessonB]);
        });

        it('сохраняет уроки и понедельник открытой недели', async () => {
            const monday = new Date(2026, 9, 5);
            const lesson = makeLesson();
            mockedGetWeek.mockResolvedValue([lesson]);

            await useLessonStore.getState().loadWeek(db, monday);

            expect(mockedGetWeek).toHaveBeenCalledWith(db, monday);
            expect(useLessonStore.getState().weekStart).toEqual(monday);
            expect(useLessonStore.getState().lessons).toEqual([lesson]);
        });
    });

    describe('loadToday', () => {
        it('читает день, переданный экраном', async () => {
            const day = new Date(2026, 10, 15, 9, 0);
            const lesson = makeLesson({ date: '2026-11-15' });
            mockedGetDate.mockResolvedValue([lesson]);

            await useLessonStore.getState().loadToday(db, day);

            expect(mockedGetDate).toHaveBeenCalledWith(db, day);
            expect(useLessonStore.getState().todayLessons).toEqual([lesson]);
        });

        it('без параметра читает сегодняшний день', async () => {
            mockedGetDate.mockResolvedValue([]);
            const before = new Date();

            await useLessonStore.getState().loadToday(db);

            const passed = mockedGetDate.mock.calls[0][1] as Date;
            expect(passed.getTime()).toBeGreaterThanOrEqual(before.getTime());
        });
    });

    describe('refresh после сохранения', () => {
        it('перезагружает неделю и «сегодня» и запускает синхронизацию уведомлений', async () => {
            const monday = new Date(2026, 9, 5);
            useLessonStore.setState({ weekStart: monday });
            mockedGetWeek.mockResolvedValue([]);
            mockedGetDate.mockResolvedValue([]);

            await useLessonStore
                .getState()
                .saveLesson(db, null, { ...makeLesson(), date: '2026-10-05' });

            expect(mockedGetWeek).toHaveBeenCalledWith(db, monday);
            expect(mockedGetDate).toHaveBeenCalledTimes(1);
            expect(mockedSync).toHaveBeenCalledWith(db);
        });
    });
});
