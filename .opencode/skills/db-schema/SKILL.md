---
name: db-schema
description: Схема SQLite, миграции PRAGMA user_version, LessonRow и rowToLesson, параметризованный SQL, транзакции, copyWeek, настройки в expo-sqlite/kv-store и тесты T4. Использовать при изменении таблиц, запросов, полей урока или хранилища настроек.
---

# DB Schema — SQLite, миграции и kv-store

## Когда применять

- Меняется таблица `lessons`, индекс или `DATABASE_VERSION`.
- Нужен новый SQL-запрос/функция в `src/db/`.
- Меняется поле урока: `Lesson`, `LessonRow`, INSERT/UPDATE.
- Затрагивается `copyWeek`, транзакция или диапазон дат.
- Меняется формат `AppSettings` в kv-store.
- Пишутся интеграционные тесты БД (T4).

Для чистых правил и дат — скил `architecture`; для действий поверх БД — `store`.

## Какие AGENTS.md прочитать

Пути от корня проекта.

1. `src/db/AGENTS.md` — **главный**: схема, миграции, функции, kv-store, T4.
2. `src/AGENTS.md` — правило «SQL только в `src/db/`» и направление зависимостей.
3. `src/domain/AGENTS.md` — формат дат/времени, `toDateString`, `addDays`,
   `daysBetween`, `parseDate`.
4. `test/AGENTS.md` — где лежат тесты БД и как запускать.
5. `AGENTS_DETAILS.md`, раздел 5 «Архитектура подробнее» и шаг T4 — контекст решений.
6. `AGENTS.md` — команды и ограничения Windows.

## Пошаговый порядок

### Новое поле урока

1. Добавь поле в `Lesson` (`src/domain/types.ts`).
2. Подними `DATABASE_VERSION` в `src/db/migrate.ts`.
3. Добавь **новый** блок `if (current < N)` после существующих. Старые блоки не менять.
4. Обнови `LessonRow` и `rowToLesson` в `src/db/lessons.ts`.
5. Обнови SQL и массив параметров в `addLesson` и `updateLesson`.
6. Проверь `copyWeek`: новое поле должно переноситься (сейчас через `...lesson`).
7. Обнови тесты и данные формы/экранов, если поле видно пользователю.
8. Прогони миграцию на пустой базе и повторный запуск.

### Новая функция чтения/записи

1. Определи, нужен ли диапазон (`getLessonsForRange`) или неделя
   (`getLessonsForWeek`). Для планировщика — только диапазон.
2. Прими `db: SQLiteDatabase` первым параметром.
3. Используй `?` для всех значений, `getAllAsync`/`getFirstAsync`/`runAsync`.
4. Верни наружу `Lesson[]`/`Lesson | null`, а не строки БД.
5. Напиши тест рядом: `src/db/<name>.test.ts`.

### Изменение настроек

1. Меняй `AppSettings` и `DEFAULT_SETTINGS` (`src/domain/constants.ts`).
2. Если нужны варианты/границы — обнови `SETTING_OPTIONS` и `SETTING_LIMITS`.
3. `loadSettings` уже подмешивает `DEFAULT_SETTINGS`, поэтому новые поля не будут
   `undefined` у старых пользователей.
4. Миграция kv-store не нужна; JSON и `try/catch` уже в `src/db/settings.ts`.

## Шаблон кода

### Строка БД → тип приложения

```ts
// src/db/lessons.ts
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
```

Правило: `snake_case` живёт только внутри `src/db/`; наружу — camelCase.

### Миграция

```ts
// src/db/migrate.ts
const DATABASE_VERSION = 2; // было 1 — подняли

export async function migrateDb(db: SQLiteDatabase) {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const current = row?.user_version ?? 0;

    if (current >= DATABASE_VERSION) return;

    if (current < 1) {
        // существующий блок не трогаем
    }

    if (current < 2) {
        await db.execAsync(`
            ALTER TABLE lessons ADD COLUMN note TEXT NOT NULL DEFAULT '';
        `);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
```

- Старые блоки не редактируются: у пользователя база могла пройти только их.
- `DATABASE_VERSION` — целое, только вверх.
- Значение версии подставляется в PRAGMA как число, не из пользовательского ввода.

### Параметризованный запрос

```ts
const rows = await db.getAllAsync<LessonRow>(
    `SELECT * FROM lessons
     WHERE date >= ? AND date <= ?
     ORDER BY date, start_time`,
    [toDateString(from), toDateString(to)],
);

return rows.map(rowToLesson);
```

Никакой конкатенации пользовательских значений в SQL — только `?`.

### Транзакция и `copyWeek`

```ts
await db.withTransactionAsync(async () => {
    for (const lesson of source) {
        if (lesson.cancelled) continue; // отменённые не копируем
        const offset = daysBetween(sourceMonday, parseDate(lesson.date));
        await addLesson(db, {
            ...lesson,
            date: toDateString(addDays(targetMonday, offset)),
            cancelled: false,
        });
    }
});
```

Тема, кабинет и время сохраняются; меняются только дата и флаг отмены. Ошибка внутри
транзакции должна откатывать всю неделю.

### Настройки в kv-store

```ts
// src/db/settings.ts
const SETTINGS_KEY = 'settings';

export async function loadSettings(): Promise<AppSettings> {
    try {
        const raw = await Storage.getItem(SETTINGS_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await Storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
```

kv-store хранит только строки; объекты — только через `JSON.stringify`/`JSON.parse`.
Числа по умолчанию не дублируются здесь — они в `DEFAULT_SETTINGS`.

## Тесты T4

- БД — только в памяти, не на устройстве.
- Адаптер под `SQLiteDatabase` кладётся в `test/helpers/` и реализует используемые методы:
  `runAsync`, `getAllAsync`, `getFirstAsync`, `execAsync`, `withTransactionAsync`.
- `better-sqlite3` — предпочтительный вариант; запасные — `sql.js` и `node:sqlite`.
- **Новую зависимость нельзя ставить без согласования с владельцем.**
- Проверять:
    - миграцию на пустой базе и повторный запуск (версия не применяется дважды);
    - `addLesson` → `getLessonById`, включая `cancelled` 0/1;
    - границы и сортировку `getLessonsForRange`;
    - неделю пн–вс и воскресенье в `getLessonsForWeek`;
    - `copyWeek`: сдвиг, пропуск отменённых, сохранение тем, откат при ошибке;
    - `deleteLesson` (физическое удаление).

## Чек-лист перед завершением

- [ ] `DATABASE_VERSION` поднят, новый блок добавлен после старых.
- [ ] Старые миграции не изменены.
- [ ] `Lesson`, `LessonRow`, `rowToLesson`, INSERT и UPDATE согласованы.
- [ ] Все значения передаются через `?`; нет конкатенации.
- [ ] Даты — `ГГГГ-ММ-ДД` через `toDateString`, без `toISOString()`.
- [ ] `copyWeek` переносит новое поле и по-прежнему пропускает отменённые.
- [ ] Настройки не дублируют значения из `DEFAULT_SETTINGS`.
- [ ] Есть тест на миграцию с пустой базы и повторный запуск.
- [ ] SQL не появился в компонентах, экранах или сторе.

## Команды проверки

```bash
npm run typecheck
npm test
npm run lint

npm test -- src/db/lessons.test.ts
npm test -- src/db/migrate.test.ts
```

Миграцию желательно проверить и на телефоне после установки новой dev-сборки, если
менялась схема.

## Типичные ошибки

- **Изменить старый блок миграции.** У части пользователей он уже выполнен; изменения не
  применятся. Всегда новый блок.
- **Забыть `DATABASE_VERSION`.** Новый блок не выполнится.
- **Забыть `LessonRow`/`rowToLesson`.** Поле есть в SQL, но теряется в приложении.
- **CONCAT в SQL.** Риск ошибок и инъекций; только `?`.
- **`cancelled` как boolean в SQLite.** Хранить 0/1, переводить в `boolean` при чтении.
- **Фильтровать отменённые в `getLessonsForWeek`/`getLessonsForRange`.** Это делает
  `buildStatusTimeline`; иначе сломается счётчик недели.
- **`toISOString()` для `date`.** Даёт UTC-дату; использовать `toDateString`.
- **Объект в kv-store без JSON.** Хранилище строковое.
- **SQL в компоненте.** Нарушает слой и обходит `refresh`.
- **Тест на реальной БД устройства.** Только память и адаптер.
