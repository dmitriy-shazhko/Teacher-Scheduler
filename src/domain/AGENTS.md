# src/domain — типы, даты, расписание и тексты

`src/domain/` — сердце проекта: чистые типы и функции **без React, React Native, БД и
нативных библиотек**. Здесь всё, что можно протестировать без телефона. Если функция
читает стор, БД или `Date.now()` вместо параметра — это ошибка слоя.

## Файлы

| Файл | Содержимое |
| --- | --- |
| `types.ts` | `Lesson`, `CopyLessonsSource`, `CurrentAndNextLessons`, `StatusKind`, `StatusStep`, `AppSettings`, `PermissionStatus` |
| `constants.ts` | `WEEKDAYS`, `MONTHS`, `SCHEDULER_WINDOW_DAYS = 7`, `DEFAULT_SETTINGS`, `SETTING_OPTIONS`, `SETTING_LIMITS`, `COLOR_DANGER` |
| `dates.ts` | Арифметика и форматирование дат/времени в локальном времени |
| `schedule.ts` | `toMinutes`, `getCurrentAndNextLessons`, `getNextLessonOfDay`, `lessonIsPassed`, `formatDuration` |
| `notificationTexts.ts` | `buildEndingText`, `buildNextLessonText`, `buildCurrentLessonText` |
| `statusTimeline.ts` | `buildStatusTimeline(lessons, now, settings)` → `StatusStep[]` |
| `textFormaters.ts` | `pluralLessons(n)` — «1 урок / 2 урока / 5 уроков» |
| `theme.ts` | `colors` — единственная палитра приложения |

Типы:

```ts
interface Lesson {
    id: number;
    date: string;       // "2026-10-05" — ГГГГ-ММ-ДД
    startTime: string;  // "08:30"
    endTime: string;    // "09:15"
    className: string;
    room: string;
    topic: string;      // может быть пустой
    cancelled: boolean;
}

interface AppSettings {
    firstLessonStartingMinutes: number; // 60
    lessonEndingMinutes: number;        // 5
    lessonDurationMinutes: number;      // 45
}
```

## Даты и время — жёсткие правила

- В БД, сторе и типах дата — строка `ГГГГ-ММ-ДД`. Она сортируется как текст и позволяет
  запросы `date >= ? AND date <= ?`.
- Время — строка `ЧЧ:ММ` с ведущим нулём. Для сравнения и разностей переводится в минуты
  от начала суток (`toMinutes`).
- **Никогда не использовать `toISOString()` для дат**: это UTC, вечером можно получить
  вчерашнюю дату. Всё считается в локальном времени.
- Форматирование — только при выводе: `formatDateRu('2026-12-25')` → `'25.12.2026'`.
- Неделя начинается с понедельника; в JS воскресенье = 0, поэтому везде
  `getDay() === 0 ? 7 : getDay()`.
- Месяц в `new Date(y, m, d)` — с нуля.
- Границы урока согласованы везде: текущий при `start <= now < end`; ровно в `end` урок
  уже прошедший (`end <= now`).

### `dates.ts`

| Функция | Результат |
| --- | --- |
| `toDateString(Date)` | `'2026-10-05'` (локально) |
| `parseDate('2026-10-05')` | локальная полночь |
| `addDays(Date, n)` | сдвиг через календарные поля, без «+24 часа» (переживает DST) |
| `startOfWeek(Date)` | понедельник недели |
| `daysBetween(a, b)` | целое число дней (учитывает DST через `Math.round`) |
| `formatShort(Date)` | `'5 окт'` |
| `formatWeek(monday)` | `'5 окт – 11 окт'` |
| `formatDateRu('2026-12-25')` | `'25.12.2026'` |
| `timeToDate('08:30')` | сегодняшняя дата с этим временем (единственное место с `new Date()` без параметра; используется только в UI) |
| `dateToTime(Date)` | `'08:30'` |
| `toDate(date, time)` | локальный `Date` из даты и времени; нужен планировщику |
| `addMinutesToTime('08:30', 45)` | `'09:15'`; максимум `'23:59'`, **через полночь не переходит** |

Известное ограничение: урок, переходящий через полночь, не поддерживается (`00:15` <
`08:30` при строковом сравнении). Отложенный баг №3 — не исправлять без запроса.

## Логика расписания (`schedule.ts`)

- `toMinutes('08:30')` → `510`.
- `getCurrentAndNextLessons(lessons, now)` → `{ current, next, minutesLeft, minutesToNext }`.
  Отменённые игнорируются; `current`: `start <= now < end`; `next`: первый неотменённый с
  `start > now`. `lessons` должны быть уроками **одного дня** с `now`. Входной массив не
  мутируется.
- `getNextLessonOfDay(lessons, current)` — следующий неотменённый урок **того же дня**
  после текущего. Сейчас в UI не используется (покрыт тестами); запас для текстов
  уведомлений и будущих экранов.
- `lessonIsPassed(lesson, now)` — `end <= now`.
- `formatDuration(minutes)` → `'35 мин'`, `'1 ч 15 мин'`, `'2 ч'`.

## Тексты уведомлений (`notificationTexts.ts`)

Чистые функции, возвращают `{ title, body }`:

- `buildEndingText(endTime)` → заголовок «Скоро конец урока», текст «Урок заканчивается в
  {endTime}».
- `buildNextLessonText(lesson | null)` → `null` для `null`; иначе «Следующий урок у
  {className}» и тело `{start}-{end}, {class}, каб. {room}\n{topic}`.
- `buildCurrentLessonText(lesson)` → «Идёт урок у {className}» и то же тело.

Правила текста: кабинет из пробелов не выводится; пустая тема заменяется на
«Тема не указана»; тема обрезается по краям. Блок «Далее:» владелец отклонил — не
добавлять. Уведомления строятся для самого урока (`step.lesson`), а не для `step.next`.

## Тексты интерфейса (`textFormaters.ts`)

- `pluralLessons(n)` → `` `${n} урок` ``, `` `${n} урока` ``, `` `${n} уроков` `` по
  правилам русского языка: 1, 21, 101 → «урок»; 2–4, 22–24, 102–104 → «урока»;
  остальные (0, 5–20, 25–100, 111–114, …) → «уроков».
- Используется в сводке дня на экране «Неделя» (`week.tsx`).
- Имя файла исторически с опечаткой (`Formaters`, не `Formatters`); импорт —
  `@/domain/textFormaters`.

## План состояний (`statusTimeline.ts`)

`buildStatusTimeline(lessons, now, settings): StatusStep[]` — чистая функция, главный
источник правды для планировщика.

`StatusStep`: `id` (`status-<lessonId>-<kind>`), `kind`, `lesson`, `next`, `showAt`,
`hideAt`.

Алгоритм:

1. Отбросить отменённые, отсортировать по `date + startTime`.
2. Для каждого урока взять предыдущий/следующий **того же дня** из активных.
3. `upcomingFrom` = конец предыдущего урока дня либо `start - firstLessonStartingMinutes`
   (для первого урока дня).
4. `endingFrom` = `end - lessonEndingMinutes`.
5. Добавить шаги, только если `showAt < hideAt`:
   - `upcoming`: `upcomingFrom` → `start`;
   - `current`: `start` → `endingFrom`;
   - `ending`: `endingFrom` → `end`.
6. Отфильтровать прошедшие: оставить `hideAt > now`.

Следствия:

- Уроки без перемены: `upcoming` пропускается (сразу `current`).
- `firstLessonStartingMinutes = 0` — у первого урока нет `upcoming`.
- `ending` сейчас **не ограничен началом урока**: при `lessonEndingMinutes` больше
  длительности `ending` начинается раньше урока, а `current` пропадает (баг №1;
  зафиксирован `it.failing` в `statusTimeline.test.ts`).
- Пересекающиеся уроки не обрабатываются: могут появиться два живых уведомления
  (баг №2; валидацию планируется вынести в `validateLesson`).
- `next` сейчас в текстах не используется, но хранится в шаге.

## Константы и настройки

- `DEFAULT_SETTINGS`: `firstLessonStartingMinutes = 60`, `lessonEndingMinutes = 5`,
  `lessonDurationMinutes = 45`.
- `SETTING_OPTIONS`: первый урок `[10, 15, 20, 30, 45, 60, 90, 120]`, конец
  `[3, 5, 7, 10, 15]`, длительность `[20, 30, 40, 45, 50, 60, 90, 120]`.
- `SETTING_LIMITS`: `1–360`, `1–360`, `5–360` минут.
- Оба объекта типизированы `Record<keyof AppSettings, …>`: новая настройка без вариантов
  и границ не пройдёт typecheck.
- `SCHEDULER_WINDOW_DAYS = 7` (окно: сегодня + 7 дней = 8 календарных дат).
- Настройки передаются в чистые функции **параметром**, не читаются из стора/БД.

## Палитра (`theme.ts`)

```ts
export const colors = {
    bg: '#f4f5fb',          // фон экранов
    card: '#ffffff',        // карточки, tab bar
    text: '#1a1a2e',        // заголовки и основной текст
    muted: '#6b7088',       // вторичный текст
    primary: '#4f46e5',     // акцент, активная вкладка, полоса урока
    primaryTint: '#eef0ff', // фон «сегодня» в DayStrip
    primaryBorder: '#c7c9f5',
    divider: '#eceef6',     // разделители, borderTop tab bar
    danger: '#dc2626',      // удаление
    dangerBg: '#fdeeee',
    warnBg: '#fdf0c4',      // бейдж «Отменён»
    warnText: '#92400e',
    barMuted: '#cfd2e0',    // полоса отменённого урока
};
```

- Это **единственный** источник цветов для компонентов: импорт `@/domain/theme`,
  хардкод `'#...'` в новом коде запрещён. Легаси-исключения (`NowCard`, `Settings*`,
  `BatteryHint`, `COLOR_DANGER` в `constants.ts`) переводятся постепенно (TODO п. 1).
- `theme.ts` — просто объект, ни от чего не зависит; `react-native` сюда не импортировать.
- `COLOR_DANGER = '#c0392b'` в `constants.ts` остался для экрана настроек и не совпадает
  с `colors.danger`; новый код берёт `colors.danger`.

## Тесты
Лежат рядом: `dates.test.ts`, `schedule.test.ts`, `notificationTexts.test.ts`,
`statusTimeline.test.ts`, `textFormaters.test.ts`; запуск — `npm test`. Ключевое: `now`
параметром, TZ `Europe/Berlin` из `test/globalSetup.js`, локальные даты, `it.each` и
`makeLesson`.
Известные баги — `it.failing(...)`, после фикса `.failing` убрать (сейчас баг №1).
Полный список покрытия и правила — `../../AGENTS_DETAILS.md`, раздел «Тесты domain».
