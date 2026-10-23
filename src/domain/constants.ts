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

export const MONTHS = [
    'янв',
    'фев',
    'мар',
    'апр',
    'мая',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
];

export const SCHEDULER_WINDOW_DAYS = 7;

export const DEFAULT_SETTINGS: AppSettings = {
    firstLessonStartingMinutes: 60,
    lessonEndingMinutes: 5,
    lessonDurationMinutes: 45,
};

export const SETTING_OPTIONS: Record<keyof AppSettings, number[]> = {
    firstLessonStartingMinutes: [10, 15, 20, 30, 45, 60, 90, 120],
    lessonEndingMinutes: [3, 5, 7, 10, 15],
    lessonDurationMinutes: [20, 30, 40, 45, 50, 60, 90, 120],
};

export const SETTING_LIMITS: Record<keyof AppSettings, { min: number; max: number }> = {
    firstLessonStartingMinutes: { min: 1, max: 360 },
    lessonEndingMinutes: { min: 1, max: 360 },
    lessonDurationMinutes: { min: 5, max: 360 },
};

export const COLOR_DANGER = '#c0392b';
