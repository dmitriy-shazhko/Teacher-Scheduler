import { AppSettings } from './types';

export const WEEKDAYS = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье',
];
export const REFRESH_LESSONS_MS = 30000;
export const SCHEDULER_WINDOW_DAYS = 7;

export const FIRST_LESSON_STARTING = 60;
export const LESSON_ENDING_MINUTES = 5;

export const DEFAULT_SETTINGS: AppSettings = {
    firstLessonStartingMinutes: 60,
    lessonEndingMinutes: 5,
    lessonDurationMinutes: 45,
};
