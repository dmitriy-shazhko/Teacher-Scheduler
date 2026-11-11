# test — Jest, часовой пояс и правила тестов

## Конфигурация

`jest.config.js`:

```js
module.exports = {
    preset: 'jest-expo',
    globalSetup: '<rootDir>/test/globalSetup.js',
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
};
```

- Пресет `jest-expo`; алиас `@/` маппится на `src/`.
- `globalSetup.js` — на **JavaScript** (Jest читает его до трансформации TypeScript):
  `process.env.TZ = 'Europe/Berlin'`.
- Скрипты: `npm test`, `npm run test:watch`; типы для Jest включены через
  `"types": ["jest"]` в `tsconfig.json`.

## Часовой пояс

Проект работает в локальном времени, CI — в UTC. Поэтому TZ фиксируется в `globalSetup`,
а не в npm-скрипте (на Windows переменная в скрипте ведёт себя иначе).

- `timezone.test.ts` проверяет, что смещения летом `-120`, зимой `-60` (Europe/Berlin).
- Даты в тестах создавать локально: `new Date(2026, 9, 5, 8, 30)` (месяц с нуля), а не
  ISO-строками.
- Тесты на `addDays`/`startOfWeek`/`daysBetween` включают переходы на летнее/зимнее
  время (25 и 23 часа в сутках), чтобы ловить арифметику «+24 часа».

## Где лежат тесты

- Рядом с кодом: `src/domain/*.test.ts`, `src/db/*.test.ts`, `src/store/*.test.ts`,
  `src/notifications/*.test.ts`.
- Общие/инфраструктурные — в `test/`.
- **В `src/app/` тесты класть нельзя**: expo-router воспримет файл как маршрут.

## Хелперы

`test/helpers/lessons.ts` — `makeLesson(overrides)` с дефолтным уроком
(`2026-10-05`, `08:30–09:15`, `7А`, кабинет `12`, тема «Алгебра»). Использовать его,
чтобы тесты не дублировали поля.

## Как писать тесты

- Бизнес-логика — чистые функции с параметром `now`; фейковые таймеры не нужны (исключение:
  `timeToDate`, где используется текущая дата).
- Табличные случаи — `it.each([...])` с понятным описанием на русском.
- Проверять границы явно: `start <= now < end`, ровно в `end` урок прошёл, отменённые
  игнорируются, стыки без перемены, DST, `23:59`.
- Сначала воспроизводить баг тестом, потом исправлять код. Известные баги — через
  `it.failing(...)`: пока баг есть, тест зелёный; после фикса `.failing` убрать.
  Сейчас так отмечен баг №1 в `src/domain/statusTimeline.test.ts`.
- Не гнаться за процентом покрытия; порог в CI не задан. Тесты на доставку уведомлений,
  каналы и вибрацию не пишем — это ручной чек-лист на телефоне.
- Нативные модули в тестах мокать: `react-native-notify-kit`, `expo-sqlite/kv-store`.
  Планировщику для тестов добавить необязательный `now`.
- Не использовать реальные таймеры/сеть/БД устройства; БД — в памяти.

## Текущее состояние

- T1: Jest + globalSetup + `timezone.test.ts` — готово.
- T3: unit-тесты `dates`, `schedule`, `notificationTexts`, `statusTimeline`,
  `textFormaters` — готово.
- T4 (план): интеграционные тесты БД через `better-sqlite3` + адаптер под
  `SQLiteDatabase` (`runAsync`, `getAllAsync`, `getFirstAsync`, `execAsync`,
  `withTransactionAsync`) в `test/helpers/`. Запасные варианты: `sql.js`, `node:sqlite`.
  Проверять миграции (пустая база + повторный запуск), CRUD, границы диапазона, `copyWeek`
  (сдвиг, пропуск отменённых, темы, откат транзакции), `deleteLesson`.
- T5 (план): тесты планировщика и стора с моками; сценарий бага №4 (падение
  `createTriggerNotification` после отмены старых триггеров), очередь синхронизаций,
  `timeoutAfter`, уникальные `id`.
- Не покрыто тестами: реальная доставка уведомлений, каналы, вибрация, батарея,
  компоненты (RNTL можно добавить позже), E2E (Maestro/Detox пока не нужны).

## Команды

```bash
npm test                 # весь набор
npm test -- --ci         # как в CI
npm run test:watch       # watch
npm run typecheck        # типы тестов тоже проверяются
```

Если тест падает только на Linux/в CI — проверить регистр в путях импорта: на Windows
неверный регистр работает, на Linux падает.
