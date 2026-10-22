import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDb(db: SQLiteDatabase) {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const current = row?.user_version ?? 0;

    if (current >= DATABASE_VERSION) return;

    if (current < 1) {
        await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        class_name TEXT NOT NULL,
        room TEXT NOT NULL,
        topic TEXT NOT NULL DEFAULT '',
        cancelled INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_lessons_date ON lessons(date);
    `);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
