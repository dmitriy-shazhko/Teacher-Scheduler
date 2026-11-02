# src/db — SQLite, миграции и настройки

Здесь весь доступ к данным. Наружу отдаются camelCase-типы (`Lesson`), внутри БД —
`snake_case`; перевод делает `rowToLesson` в `lessons.ts`.

## Подключение

- База `schedule.db` открывается в корневом layout:
  `<SQLiteProvider databaseName='schedule.db' onInit={migrateDb}>`.
- В компонентах/хуках — только `useSQLiteContext()` (внутри провайдера).
- Функции принимают `db: SQLiteDatabase` первым параметром; глобального соединения нет.
- Все значения в SQL подставляются через `?` (никакой конкатенации пользовательских
  данных).
- Имена файлов: `lessons.ts` (уроки), `migrate.ts` (схема), `settings.ts` (kv-store).

## Схема и миграции (`migrate.ts`)

Версионирование — `PRAGMA user_version`, текущая `DATABASE_VERSION = 1`.

```sql
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
```

Правила изменения схемы:

1. Поднять `DATABASE_VERSION`.
2. Добавить новый блок `if (current < N) { ... }` **после** существующих; старые блоки
   не менять.
3. В конце `migrateDb` выставляется `PRAGMA user_version = DATABASE_VERSION`.
4. Проверить миграцию на пустой базе и повторный запуск (тест T4).

`date` — `ГГГГ-ММ-ДД`, `start_time`/`end_time` — `ЧЧ:ММ`; благодаря формату сравнение
строковое и работают запросы `date >= ? AND date <= ?`. `cancelled` хранится как 0/1.

## Функции (`lessons.ts`)

| Функция | Назначение |
| --- | --- |
| `getLessonsForDate(db, date: Date)` | Уроки одного дня, `ORDER BY start_time` |
| `getLessonsForWeek(db, monday: Date)` | Уроки недели пн–вс включительно, `ORDER BY date, start_time` |
| `countLessonsForWeek(db, monday)` | Количество уроков недели (для окна копирования) |
| `getLessonsForRange(db, from: Date, to: Date)` | Уроки диапазона включительно; используется планировщиком |
| `getLessonById(db, id)` | Один урок или `null` |
| `addLesson(db, lesson: Omit<Lesson, 'id'>)` | INSERT |
| `updateLesson(db, id, lesson)` | UPDATE только этой записи |
| `deleteLesson(db, id)` | Физическое удаление |
| `copyWeek(db, sourceMonday, targetMonday)` | Копирование недели в транзакции |

Важные детали:

- `getLessonsForWeek`/`getLessonsForRange` **не фильтруют отменённые** — это делает
  `buildStatusTimeline`. `countLessonsForWeek` тоже считает все уроки, включая отменённые.
- Для планировщика нужен `getLessonsForRange` (окно 8 календарных дат), а не
  `getLessonsForWeek`: неделя может кончиться в середине окна.
- `copyWeek` копирует со сдвигом по дню недели (`daysBetween`), **пропускает отменённые**,
  темы сохраняет, выполняет всё в `withTransactionAsync`.
- `deleteLesson` удаляет физически; «отменённый» урок остаётся в БД с `cancelled = 1`.
- При добавлении поля: обновить `LessonRow`, `rowToLesson`, SQL в `addLesson`/
  `updateLesson`, тип `Lesson`, миграцию и тесты.

## Настройки (`settings.ts`)

- Хранилище — `expo-sqlite/kv-store` (другая БД, не `schedule.db`), ключ `settings`.
- Хранится JSON-строка `AppSettings`.
- `loadSettings()`: `JSON.parse` в `try/catch`, поверх результата —
  `{ ...DEFAULT_SETTINGS, ...parsed }`, чтобы новые поля не были `undefined`; при ошибке
  или пустом значении — значения по умолчанию.
- `saveSettings(settings)`: `JSON.stringify` + запись.
- `kv-store` хранит только строки; объекты — только через JSON.
- Миграции для kv-store не нужны, нативная пересборка при изменении настроек не нужна.
- Настройки по умолчанию задаются в `src/domain/constants.ts` (`DEFAULT_SETTINGS`), не
  дублировать числа здесь.

## Тесты (T4, план)

- `better-sqlite3` в памяти + тонкий адаптер (~30–40 строк) в `test/helpers/` под методы
  `SQLiteDatabase`: `runAsync`, `getAllAsync`, `getFirstAsync`, `execAsync`,
  `withTransactionAsync`.
- Запасные варианты, если `better-sqlite3` не ставится на Windows: `sql.js` (WASM) или
  встроенный `node:sqlite`.
- Проверять: миграцию на пустой базе и повторный запуск; `addLesson` → `getLessonById`
  (включая `cancelled` 0/1); границы и сортировку `getLessonsForRange`; пн–вс
  `getLessonsForWeek`; `copyWeek` (сдвиг, пропуск отменённых, сохранение тем, откат
  транзакции при ошибке); `deleteLesson`.
- Тесты — `src/db/*.test.ts`; в `src/app/` тестов быть не должно.

## Грабли

- Данные dev-сборки и Expo Go/production — **разные приложения**, тестовые уроки не
  переносятся.
- `PRAGMA journal_mode = 'wal'` уже включён в первой миграции.
- Не использовать `toISOString()` при формировании `date`: только `toDateString`.
- Не выполнять SQL из компонентов и не обходить стор при изменениях.
