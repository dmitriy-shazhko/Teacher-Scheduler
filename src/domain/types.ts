export interface Lesson {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    className: string;
    room: string;
    topic: string;
    cancelled: boolean;
}

export interface CopyLessonsSource {
    start: Date;
    count: number;
}

export interface CurrentAndNextLessons {
    current: Lesson | null;
    next: Lesson | null;
    minutesLeft: number | null;
    minutesToNext: number | null;
}
