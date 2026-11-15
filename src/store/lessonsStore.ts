import {
    addLesson,
    copyWeek as dbCopyWeek,
    deleteLesson,
    getLessonsForDate,
    getLessonsForWeek,
    updateLesson,
} from '@/db/lessons';
import { Lesson } from '@/domain/types';
import { syncNotifications } from '@/notifications/scheduler';
import { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

type State = {
    weekStart: Date | null;
    lessons: Lesson[];
    todayLessons: Lesson[];
    loadWeek: (db: SQLiteDatabase, weekStart: Date) => Promise<void>;
    loadToday: (db: SQLiteDatabase, now?: Date) => Promise<void>;
    removeLesson: (db: SQLiteDatabase, id: number) => Promise<void>;
    saveLesson: (db: SQLiteDatabase, id: number | null, data: Omit<Lesson, 'id'>) => Promise<void>;
    copyWeek: (db: SQLiteDatabase, source: Date, target: Date) => Promise<string[]>;
};

export const useLessonStore = create<State>((set, get) => {
    let weekRequestId = 0;

    const refresh = async (db: SQLiteDatabase, now = new Date()) => {
        const { weekStart } = get();
        if (weekStart) await get().loadWeek(db, weekStart);
        await get().loadToday(db, now);
        syncNotifications(db).catch((e) => console.warn('syncNotifications failed', e));
    };

    return {
        weekStart: null,
        lessons: [],
        todayLessons: [],

        loadWeek: async (db, weekStart) => {
            const requestId = ++weekRequestId;
            const lessons = await getLessonsForWeek(db, weekStart);

            // пока ждали БД, могли запросить другую неделю — её ответ и оставляем
            if (requestId !== weekRequestId) return;

            set({ weekStart, lessons });
        },

        loadToday: async (db, now = new Date()) => {
            const todayLessons = await getLessonsForDate(db, now);

            set({ todayLessons });
        },

        removeLesson: async (db, id) => {
            await deleteLesson(db, id);
            await refresh(db);
        },

        saveLesson: async (db, id, lessonData) => {
            if (id === null) await addLesson(db, lessonData);
            else await updateLesson(db, id, lessonData);
            await refresh(db);
        },

        copyWeek: async (db, source, target) => {
            const copiedDates = await dbCopyWeek(db, source, target);
            await refresh(db);

            return copiedDates;
        },
    };
});
