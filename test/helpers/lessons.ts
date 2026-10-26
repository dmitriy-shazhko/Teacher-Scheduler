import type { Lesson } from '@/domain/types';

export function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
    return {
        id: 1,
        date: '2026-10-05',
        startTime: '08:30',
        endTime: '09:15',
        className: '7А',
        room: '12',
        topic: 'Алгебра',
        cancelled: false,
        ...overrides,
    };
}
