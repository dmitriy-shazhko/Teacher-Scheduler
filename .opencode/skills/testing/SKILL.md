---
name: testing
description: Тесты Scheduler на Jest + jest-expo, TZ Europe/Berlin, makeLesson, локальные даты, it.each, it.failing, моки нативных модулей, тесты БД T4 и планировщика T5. Использовать при добавлении или починке любого теста.
---

# Testing — Jest, TZ и правила тестов

## Когда применять

- Новая логика в `domain`, `db`, `store`, `notifications`.
- Воспроизведение бага перед исправлением.
- T4 (БД) или T5 (планировщик/стор).
- Тест падает только в CI/Linux.
- Нужно решить, где вообще должен лежать тест.

## Какие AGENTS.md прочитать

Пути от корня проекта.

1. `test/AGENTS.md` — **главный**: конфигурация, TZ, `makeLesson`, `it.each`,
   `it.failing`, моки, где нельзя класть тесты.
2. `src/AGENTS.md` — правило «тесты рядом с кодом, в `src/app/` нельзя».
3. `src/domain/AGENTS.md` — `now`, даты, границы, текущее покрытие.
4. AGENTS.md слоя, который тестируешь: `src/db`, `src/store`, `src/notifications`,
   `src/hooks`.
5. `AGENTS_DETAILS.md`, раздел 8 «Тесты domain» и шаги T4/T5 — полный контекст.

## Пошаговый порядок

1. **Выбери место.** Рядом с кодом: `src/domain/*.test.ts`, `src/db/*.test.ts`,
   `src/store/*.test.ts`, `src/notifications/*.test.ts`. Инфраструктура — `test/`.
   **В `src/app/` тестов быть не может** — expo-router сделает файл маршрутом.
2. **Сначала тест, потом фикс.** Для бага напиши падающий сценарий. Если баг известен и
   пока не исправляется — `it.failing`.
3. **Детерминизм.** `now` — параметром; локальные даты `new Date(2026, 9, 5, 8, 30)`;
   никаких реальных таймеров, сети и БД устройства.
4. **Данные — через `makeLesson`** из `test/helpers/lessons.ts`, переопределяй только
   нужные поля.
5. **Границы — явно.** `start <= now < end`, ровно в `end` урок прошёл, отменённые,
   стык без перемены, DST, `23:59`.
6. **Табличные случаи — `it.each`** с понятным русским описанием.
7. **Нативные модули — мокать** (`react-native-notify-kit`, `expo-sqlite/kv-store`).
8. **Прогони точечно, затем весь набор.** После фикса бага убери `.failing`.
9. Проверь `npm run typecheck`: типы тестов тоже проверяются.

## Шаблон кода

### Unit-тест чистой функции

```ts
// src/domain/schedule.test.ts
import { getCurrentAndNextLessons } from '@/domain/schedule';
import { makeLesson } from '../../test/helpers/lessons';

const at = (h: number, m: number) => new Date(2026, 9, 5, h, m);

describe('getCurrentAndNextLessons', () => {
    it('внутри урока текущий — он сам', () => {
        const lesson = makeLesson({ startTime: '08:30', endTime: '09:15' });

        const result = getCurrentAndNextLessons([lesson], at(8, 40));

        expect(result.current).toBe(lesson);
        expect(result.next).toBeNull();
    });
});
```

### Табличные случаи

```ts
it.each([
    ['до начала', at(8, 0), null],
    ['ровно в начале', at(8, 30), 1],
    ['за минуту до конца', at(9, 14), 1],
    ['ровно в конце', at(9, 15), null],
])('%s', (_title, now, expectedId) => {
    const lessons = [makeLesson({ id: 1 })];

    const { current } = getCurrentAndNextLessons(lessons, now);

    expect(current?.id ?? null).toBe(expectedId);
});
```

### Известный баг

```ts
// Пока баг №1 не исправлен, тест зелёный и документирует проблему.
it.failing('ending не должен начинаться раньше урока', () => {
    const settings = {
        firstLessonStartingMinutes: 60,
        lessonEndingMinutes: 60,
        lessonDurationMinutes: 45,
    };

    const steps = buildStatusTimeline([makeLesson()], at(7, 0), settings);

    expect(steps.find((s) => s.kind === 'ending')?.showAt).toEqual(at(8, 30));
});
```

После исправления `.failing` убрать и убедиться, что тест проходит как обычный `it`.

### Моки нативных модулей

```ts
jest.mock('expo-sqlite/kv-store', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => undefined),
    },
}));

jest.mock('react-native-notify-kit', () => ({
    __esModule: true,
    default: {
        cancelTriggerNotifications: jest.fn(async () => undefined),
        createTriggerNotification: jest.fn(async () => undefined),
        displayNotification: jest.fn(async () => undefined),
        getDisplayedNotifications: jest.fn(async () => []),
        cancelDisplayedNotification: jest.fn(async () => undefined),
    },
    TriggerType: { TIMESTAMP: 0 },
    AndroidVisibility: { PUBLIC: 1 },
}));
```

Мокай только используемые методы. Для T5 добавь в `syncNotifications`/`doSync`
необязательный `now`, а не подменяй системные часы.

### Тест БД (T4)

```ts
// src/db/lessons.test.ts — форма, когда появится адаптер
import { addLesson, getLessonById } from '@/db/lessons';
import { createTestDb } from '../../test/helpers/sqlite';

it('добавляет урок и читает его обратно', async () => {
    const db = createTestDb();
    await migrateDb(db);

    await addLesson(db, {
        date: '2026-10-05',
        startTime: '08:30',
        endTime: '09:15',
        className: '7А',
        room: '12',
        topic: 'Алгебра',
        cancelled: false,
    });

    const lesson = await getLessonById(db, 1);
    expect(lesson?.cancelled).toBe(false);
});
```

Адаптер под `SQLiteDatabase` (`runAsync`, `getAllAsync`, `getFirstAsync`, `execAsync`,
`withTransactionAsync`) кладётся в `test/helpers/`. Предпочтителен `better-sqlite3`,
запасные — `sql.js` и `node:sqlite`. **Новую зависимость нельзя ставить без согласования
с владельцем.**

## Что обязательно проверять

- `dates`: форматирование, понедельник, DST (25/23 часа), `addMinutesToTime`, `23:59`.
- `schedule`: границы, отменённые, стык без перемены, порядок массива не важен.
- `notificationTexts`: пустые кабинет/тема, обрезка темы.
- `statusTimeline`: шаги, уникальные `id`, граничные настройки, отсутствие пересечений.
- БД: миграция с нуля и повторно, CRUD, диапазон, неделя пн–вс, `copyWeek`, удаление.
- Планировщик/стор: отмена старых триггеров, `timeoutAfter`, очередь синков, баг №4.

## Чек-лист перед завершением

- [ ] Тест лежит рядом с кодом или в `test/`, но не в `src/app/`.
- [ ] Используется `makeLesson`, а не копия всех полей урока.
- [ ] Даты локальные, `now` передан параметром, реальных таймеров нет.
- [ ] Проверены границы и отменённые уроки, а не только «счастливый путь».
- [ ] Табличные случаи оформлены через `it.each`.
- [ ] Нативные модули замоканы; мок минимальный.
- [ ] Для известного бага стоит `it.failing`, после фикса он убран.
- [ ] Тест проверяет поведение, а не внутреннюю реализацию.
- [ ] `npm test` и `npm run typecheck` проходят.

## Команды проверки

```bash
npm test
npm test -- --ci              # как в CI
npm run test:watch            # во время работы
npm run typecheck
npm test -- src/domain/statusTimeline.test.ts
```

Если тест падает только на Linux/в CI, сначала проверь регистр букв в путях импорта:
Windows прощает неверный регистр, Linux — нет.

## Типичные ошибки

- **Тест в `src/app/`.** Файл станет маршрутом и сломает приложение.
- **ISO-строки для дат.** Используй `new Date(2026, 9, 5, 8, 30)`; месяц с нуля.
- **`Date.now()` внутри тестируемой функции.** Передавай `now`; иначе тест зависит от
  времени запуска.
- **Реальные таймеры и сеть.** Тесты должны быть быстрыми и детерминированными.
- **Тест БД на устройстве.** Только память и адаптер.
- **Мок всего модуля «на всякий случай».** Мокай используемые методы и проверяй вызовы.
- **`it.failing` после исправления.** Он начнёт падать; убери модификатор.
- **Проверка реализации вместо поведения.** Тест не должен ломаться от безопасного
  рефакторинга.
- **Забыть `await` у асинхронного мока/действия.** Тест пройдёт до завершения работы.
- **Ставить `better-sqlite3` без согласования.** Сначала объяснить и спросить.
