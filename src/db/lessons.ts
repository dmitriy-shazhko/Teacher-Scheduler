import type { SQLiteDatabase } from 'expo-sqlite';
import { addDays, daysBetween, parseDate, toDateString } from '../domain/dates';
import type { Lesson } from '../domain/types';

interface LessonRow {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    class_name: string;
    room: string;
    topic: string;
    cancelled: number;
}

function rowToLesson(r: LessonRow): Lesson {
    return {
        id: r.id,
        date: r.date,
        startTime: r.start_time,
        endTime: r.end_time,
        className: r.class_name,
        room: r.room,
        topic: r.topic,
        cancelled: r.cancelled === 1,
    };
}

// уроки одного дня
export async function getLessonsForDate(db: SQLiteDatabase, date: Date): Promise<Lesson[]> {
    const rows = await db.getAllAsync<LessonRow>(
        'SELECT * FROM lessons WHERE date = ? ORDER BY start_time',
        [toDateString(date)],
    );
    return rows.map(rowToLesson);
}

// уроки недели (monday = понедельник этой недели)
export async function getLessonsForWeek(db: SQLiteDatabase, monday: Date): Promise<Lesson[]> {
    const rows = await db.getAllAsync<LessonRow>(
        `SELECT * FROM lessons
     WHERE date >= ? AND date <= ?
     ORDER BY date, start_time`,
        [toDateString(monday), toDateString(addDays(monday, 6))],
    );
    return rows.map(rowToLesson);
}

export async function getLessonsForRange(
    db: SQLiteDatabase,
    from: Date,
    to: Date,
): Promise<Lesson[]> {
    const rows = await db.getAllAsync<LessonRow>(
        'SELECT * FROM lessons WHERE date >= ? AND date <= ? ORDER BY date, start_time',
        [toDateString(from), toDateString(to)],
    );

    return rows.map(rowToLesson);
}

export async function countLessonsForWeek(db: SQLiteDatabase, monday: Date): Promise<number> {
    const row = await db.getFirstAsync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM lessons WHERE date >= ? AND date <= ?',
        [toDateString(monday), toDateString(addDays(monday, 6))],
    );
    return row?.n ?? 0;
}

export async function addLesson(db: SQLiteDatabase, lesson: Omit<Lesson, 'id'>): Promise<void> {
    await db.runAsync(
        `INSERT INTO lessons
       (date, start_time, end_time, class_name, room, topic, cancelled)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            lesson.date,
            lesson.startTime,
            lesson.endTime,
            lesson.className,
            lesson.room,
            lesson.topic,
            lesson.cancelled ? 1 : 0,
        ],
    );
}

export async function deleteLesson(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM lessons WHERE id = ?', [id]);
}

// копирует уроки из недели sourceMonday в неделю targetMonday
// темы не копируются, отменённые уроки пропускаются
export async function copyWeek(
    db: SQLiteDatabase,
    sourceMonday: Date,
    targetMonday: Date,
): Promise<void> {
    const source = await getLessonsForWeek(db, sourceMonday);

    await db.withTransactionAsync(async () => {
        for (const lesson of source) {
            if (lesson.cancelled) continue;
            const offset = daysBetween(sourceMonday, parseDate(lesson.date));
            await addLesson(db, {
                ...lesson,
                date: toDateString(addDays(targetMonday, offset)),
                cancelled: false,
            });
        }
    });
}

export async function getLessonById(db: SQLiteDatabase, id: number): Promise<Lesson | null> {
    const row = await db.getFirstAsync<LessonRow>('SELECT * FROM lessons WHERE id = ?', [id]);
    return row ? rowToLesson(row) : null;
}

export async function updateLesson(
    db: SQLiteDatabase,
    id: number,
    lesson: Omit<Lesson, 'id'>,
): Promise<void> {
    await db.runAsync(
        `UPDATE lessons
     SET date = ?, start_time = ?, end_time = ?, class_name = ?,
         room = ?, topic = ?, cancelled = ?
     WHERE id = ?`,
        [
            lesson.date,
            lesson.startTime,
            lesson.endTime,
            lesson.className,
            lesson.room,
            lesson.topic,
            lesson.cancelled ? 1 : 0,
            id,
        ],
    );
}
