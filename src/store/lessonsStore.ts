import {
    addLesson,
    copyWeek as dbCopyWeek,
    deleteLesson,
    getLessonsForDate,
    getLessonsForWeek,
    updateLesson,
} from '@/db/lessons';
import { Lesson } from '@/domain/types';
import { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

type State = {
    weekStart: Date | null;
    lessons: Lesson[];
    todayLessons: Lesson[];
    loadWeek: (db: SQLiteDatabase, weekStart: Date) => Promise<void>;
    loadToday: (db: SQLiteDatabase) => Promise<void>;
    removeLesson: (db: SQLiteDatabase, id: number) => Promise<void>;
    saveLesson: (db: SQLiteDatabase, id: number | null, data: Omit<Lesson, 'id'>) => Promise<void>;
    copyWeek: (db: SQLiteDatabase, source: Date, target: Date) => Promise<void>;
};

export const useLessonStore = create<State>((set, get) => {
    const refresh = async (db: SQLiteDatabase) => {
        const { weekStart } = get();
        if (weekStart) await get().loadWeek(db, weekStart);
        await get().loadToday(db);
    };

    return {
        weekStart: null,
        lessons: [],
        todayLessons: [],

        loadWeek: async (db, weekStart) => {
            const lessons = await getLessonsForWeek(db, weekStart);

            set({ weekStart, lessons });
        },

        loadToday: async (db) => {
            const todayLessons = await getLessonsForDate(db, new Date());

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
            await dbCopyWeek(db, source, target);
            await refresh(db);
        },
    };
});
