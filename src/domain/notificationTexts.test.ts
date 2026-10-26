import {
    buildCurrentLessonText,
    buildEndingText,
    buildNextLessonText,
    type NotificationText,
} from '@/domain/notificationTexts';
import type { Lesson } from '@/domain/types';
import { makeLesson } from '../../test/helpers/lessons';

type Builder = (lesson: Lesson) => NotificationText | null;

describe('buildEndingText', () => {
    it('подставляет время окончания урока', () => {
        expect(buildEndingText('09:15')).toEqual({
            title: 'Скоро конец урока',
            body: 'Урок заканчивается в 09:15',
        });
    });
});

describe('buildNextLessonText', () => {
    it('null, если следующего урока нет', () => {
        expect(buildNextLessonText(null)).toBeNull();
    });
});

const builders: [string, Builder, string][] = [
    ['buildNextLessonText', buildNextLessonText, 'Следующий урок у'],
    ['buildCurrentLessonText', buildCurrentLessonText, 'Идёт урок у'],
];

describe.each(builders)('%s', (_name, build, titlePrefix) => {
    const lesson = makeLesson({
        startTime: '08:30',
        endTime: '09:15',
        className: '7А',
        room: '12',
        topic: 'Дроби',
    });

    it('полный текст: время, класс, кабинет и тема', () => {
        expect(build(lesson)).toEqual({
            title: `${titlePrefix} 7А`,
            body: '08:30-09:15, 7А, каб. 12\nДроби',
        });
    });

    it.each([
        ['пустая строка', ''],
        ['только пробелы', '   '],
    ])('кабинет: %s — строка без «каб.»', (_title, room) => {
        expect(build({ ...lesson, room })?.body).toBe('08:30-09:15, 7А\nДроби');
    });

    it.each([
        ['пустая строка', ''],
        ['только пробелы', '   '],
    ])('тема: %s — «Тема не указана»', (_title, topic) => {
        expect(build({ ...lesson, topic })?.body).toBe('08:30-09:15, 7А, каб. 12\nТема не указана');
    });

    it('тема обрезается по краям', () => {
        expect(build({ ...lesson, topic: '  Дроби  ' })?.body).toBe(
            '08:30-09:15, 7А, каб. 12\nДроби',
        );
    });
});
