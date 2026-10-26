import { Lesson } from './types';

export interface NotificationText {
    title: string;
    body: string;
}

function topicOrFallback(topic: string): string {
    const trimmed = topic.trim();

    return trimmed === '' ? 'Тема не указана' : trimmed;
}

function lessonHeadline(lesson: Lesson): string {
    const room = lesson.room.trim() ? `, каб. ${lesson.room.trim()}` : '';
    return `${lesson.startTime}-${lesson.endTime}, ${lesson.className}${room}`;
}

export function buildEndingText(endTime: string): NotificationText {
    return {
        title: 'Скоро конец урока',
        body: `Урок заканчивается в ${endTime}`,
    };
}

export function buildNextLessonText(next: Lesson | null): NotificationText | null {
    if (!next) return null;

    return {
        title: `Следующий урок у ${next.className}`,
        body: `${lessonHeadline(next)}\n${topicOrFallback(next.topic)}`,
    };
}

export function buildCurrentLessonText(current: Lesson): NotificationText {
    return {
        title: `Идёт урок у ${current.className}`,
        body: `${lessonHeadline(current)}\n${topicOrFallback(current.topic)}`,
    };
}
