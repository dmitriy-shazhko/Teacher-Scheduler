# AGENTS_DETAILS — подробности проекта

Файл создан, чтобы основные `AGENTS.md` оставались короткими (≤150 строк). Здесь лежат
детали, вынесенные из корневого `AGENTS.md` и `src/domain/AGENTS.md`. Пока читать по
ссылке; позже подключим отдельными хуками.

## 1. Полные требования владельца

1. Составлять расписание на неделю.
2. Для каждого урока указывать дату, время начала и конца, класс, кабинет, тему.
3. За час до первого урока дня (по умолчанию, настраивается) — уведомление
   «Следующий урок …».
4. За 5 минут до конца урока (по умолчанию, настраивается) — «Скоро конец урока» со
   звуком и вибрацией; везде обратный отсчёт.
5. После окончания урока — уведомление о следующем уроке (если уроки без перемены —
   сразу «Идёт урок»). Состояния сменяют друг друга; в шторке одно уведомление
   приложения; всё работает по системному таймеру без открытия приложения.
6. Тема урока меняется почти каждую неделю; её должно быть легко редактировать.
7. Просматривать расписание прошлых недель.
8. Кнопка «Скопировать неделю»: выбрать предыдущую неделю и скопировать уроки на текущую.
9. Формат даты в интерфейсе — `ДД.ММ.ГГГГ` (например, `25.12.2026`).
10. Экран «Настройки»: за сколько минут до первого урока, за сколько предупреждать о
    конце, длительность урока по умолчанию, статус разрешения, подсказка про батарею.

## 2. Контекст владельца и процесс

- Опыт — React (веб); Kotlin не знает, поэтому выбран React Native.
- Цель двойная: сделать приложение и **научиться писать на React Native**.
- Общение на русском; ОС разработки — Windows (Git Bash, пути вида `src\app\_layout.tsx`).
- Тестирование на реальном Android-телефоне, не в эмуляторе.
- Владелец сам решает, какие функции делать. Утреннее уведомление и блок «Далее:» в
  тексте уведомления он отклонил — не возвращать без запроса.
- Владелец часто улучшает предложенный код сам — перед правками сверяться с реальным
  кодом, а не с ранее выданным примером.
- Перед архитектурой с нативной библиотекой проверять её возможности по документации или
  коротким тестом на телефоне, а не по догадке (так выяснилось, что триггеры с одним
  `id` схлопываются).

## 3. Полный стек и версии

| Задача | Инструмент | Статус |
| --- | --- | --- |
| Каркас | Expo SDK 57 + TypeScript | используется |
| Навигация | `expo-router` | используется |
| Иконки | `@expo/vector-icons` (Feather) | используется |
| БД | `expo-sqlite`, чистый SQL | используется |
| Состояние | `zustand` | используется |
| Настройки | `expo-sqlite/kv-store` (ключ `settings`, JSON) | используется |
| Пикеры | `@react-native-community/datetimepicker` | используется в форме урока |
| Dev-клиент | `expo-dev-client` + EAS Build | собран и установлен |
| Уведомления | `react-native-notify-kit` (форк Notifee), config plugin | используется |
| Разрешение | `expo-notifications` | используется |
| `expo-device` | — | установлен, в коде не используется |
| Фоновая пересборка | `expo-background-task` | планируется (B4.3) |
| Релиз APK | EAS Build, профиль `production` | шаг E |
| Тесты | Jest + `jest-expo`, `@types/jest` | T1–T3 готовы |
| БД в тестах | `better-sqlite3` + адаптер (`sql.js`/`node:sqlite` запасные) | T4 |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | T2 готов |

Версии в `package.json`: Expo `~57.0.26`, RN `0.86.3`, React `19.2.3`, TS `~6.0.3`,
`react-native-notify-kit` `^10.8.1`, `jest-expo` `~57.0.6`.

Известное состояние `npx expo-doctor`: 20/21 из-за патч-версий (`expo`, `expo-router`,
`expo-sqlite`, `expo-linking`, `@expo/ui`). План — `npx expo install --fix` вместе с
ближайшей нативной пересборкой. В CI `expo-doctor` поэтому не включать.

Риск: `react-native-notify-kit` поддерживает один разработчик. Тексты и план состояний
лежат в `src/domain/` и от библиотеки не зависят: при замене переписываются только
`scheduler.ts` и `channels.ts`.

## 4. Все команды и окружение

```bash
npm install
APP_VARIANT=development npx expo start -c --dev-client
npx expo start --dev-client
npx expo start --dev-client -c        # после новых маршрутов / очистка кэша
npx expo start --tunnel               # если Wi-Fi мешает подключению телефона

npx expo install <пакет>
npx expo install --check
npx expo install --fix
npx expo-doctor

npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build:list

npm run typecheck        # tsc --noEmit
npm test                 # jest
npm test -- --ci         # как в CI
npm run test:watch
npm run lint             # expo lint
```

- Dev-сервер и телефон — в одной Wi-Fi сети (или `--tunnel`).
- `APP_VARIANT=development` → имя `Scheduler (Dev)`, scheme `teacherschedule-dev`,
  package `com.dmitriy.teacherschedule.dev`; иначе `Scheduler`, `scheduler`,
  `com.dmitriy.teacherscheduler`.
- Данные SQLite у dev- и production-сборок разные, тестовые уроки не переносятся.
- EAS CLI в npm-проекте запускать как `npx eas-cli@latest …` (или установленным `eas`).

## 5. Архитектура подробнее

### Почему урок = отдельная строка

Рассматривались «повторяющиеся слоты + экземпляры на даты» и «одна таблица уроков с
датами». Выбрана вторая: запрос дня/недели тривиален (`WHERE date = ?`), правка
затрагивает только этот урок, прошлое неизменно, уведомления строятся напрямую, не нужна
логика периодов. Цена — повторение расписания, отсюда кнопка «Скопировать неделю».

### Где живёт состояние

- Локальный `useState` — поля формы урока и `now` на экране «Сегодня».
- Zustand — уроки открытой недели, уроки сегодняшнего дня, настройки.
- Прямое чтение БД допустимо для разовых операций (`getLessonById` в форме,
  `countLessonsForWeek` в окне копирования).
- Все изменения — через стор (`saveLesson`, `removeLesson`, `copyWeek`), чтобы `refresh`
  обновил неделю, «сегодня» и вызвал `syncNotifications`.

### Уведомления

- `syncNotifications(db)` полностью пересобирает план на окно `SCHEDULER_WINDOW_DAYS`
  (сегодня + 7 дней = 8 дат).
- `buildStatusTimeline(lessons, now, settings)` строит шаги `upcoming`/`current`/`ending`.
- У каждого шага уникальный `id`; `timeoutAfter` убирает уведомление к следующему шагу;
  в шторке остаётся одно. Будущее — `createTriggerNotification` (TIMESTAMP,
  `allowWhileIdle`), текущее — `displayNotification`.
- Обратный отсчёт — системный хронометр (`showChronometer`, `chronometerDirection: 'down'`,
  `timestamp` = начало урока для `upcoming`, конец для остальных).
- Очередь вызовов — модульная `lastSync`, чтобы параллельные синхронизации не
  перемешивались.
- Каналы: `status-v2` (HIGH, PUBLIC), `ending-soon-v3` (HIGH, вибрация
  `[400,200,400,200,400,200]`, PUBLIC). Параметры канала неизменяемы после создания на
  устройстве — для изменений нужен новый id.
- Разрешение: `expo-notifications`; порядок init — сначала каналы, потом разрешение
  (Android 13+ показывает диалог только после создания канала).
- Точные будильники (`SCHEDULE_EXACT_ALARM`) не подключены; экономия батареи может
  задерживать уведомления — подсказка на экране «Настройки».

## 6. Типы данных полностью

```ts
export interface Lesson {
    id: number;
    date: string;       // "2026-10-05"
    startTime: string;  // "08:30"
    endTime: string;    // "09:15"
    className: string;
    room: string;
    topic: string;      // пусто, пока не вписана
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

export type StatusKind = 'upcoming' | 'current' | 'ending';

export type StatusStep = {
    id: string;          // `status-<lessonId>-<kind>`
    kind: StatusKind;
    lesson: Lesson;
    next: Lesson | null; // следующий неотменённый урок того же дня
    showAt: Date;
    hideAt: Date;
};

export interface AppSettings {
    firstLessonStartingMinutes: number; // 60
    lessonEndingMinutes: number;        // 5
    lessonDurationMinutes: number;      // 45
}

export type PermissionStatus = 'granted' | 'canAsk' | 'blocked';
```

## 7. Дорожная карта и баги

### Шаг T (сделано частично)

- **T1.** Jest + `jest-expo`, `moduleNameMapper` для `@/`, `globalSetup` с
  `process.env.TZ = 'Europe/Berlin'` (не через npm-скрипт — на Windows иначе), `@types/jest`,
  скрипт `npm test`. Готово.
- **T2.** CI: `push` в `main` и `pull_request`, `concurrency` с отменой старых запусков,
  `actions/checkout@v6`, `actions/setup-node@v6` (Node 20, `cache: npm`), `npm ci`,
  `npm run typecheck`, `npm test -- --ci`, `npm run lint`. `.gitattributes` с
  `* text=auto eol=lf`. Готово. `expo-doctor` не включать, EAS Build не нужен.
- **T3.** Unit-тесты `src/domain/`: `dates` (форматирование, понедельник, DST,
  `addMinutesToTime`, граница `23:59`), `schedule` (границы, отменённые),
  `notificationTexts` (пустые кабинет/тема), `statusTimeline` (основной объём),
  `textFormaters` (`pluralLessons`). Готово.
- **T4.** Интеграционные тесты БД на `better-sqlite3` в памяти + адаптер (~30–40 строк) в
  `test/helpers/` под `runAsync`, `getAllAsync`, `getFirstAsync`, `execAsync`,
  `withTransactionAsync`. Проверить миграцию на пустой базе и повторный запуск,
  `addLesson` → `getLessonById` (cancelled 0/1), `getLessonsForRange` (границы,
  сортировка), `getLessonsForWeek` (пн–вс), `copyWeek` (сдвиг, пропуск отменённых, темы,
  откат транзакции), `deleteLesson`. Если `better-sqlite3` не ставится на Windows —
  `sql.js` (WASM) или `node:sqlite`.
- **T5.** Тесты планировщика и стора: БД в памяти, моки `react-native-notify-kit` и
  `expo-sqlite/kv-store`. Проверить отмену старых триггеров, уникальные `id`, верный
  `timeoutAfter`, показ идущего состояния, очередь параллельных синков, сценарий бага №4.
  Для стора — `saveLesson`/`removeLesson`/`copyWeek` обновляют неделю и «сегодня» и зовут
  `syncNotifications`. Добавить в `syncNotifications` необязательный `now` вместо
  фейковых таймеров.

Тесты не покрывают реальную доставку, каналы, вибрацию, батарею; ручной чек-лист на
телефоне остаётся. E2E (Maestro/Detox) пока не нужны; RNTL можно позже. Порог покрытия
не ставим.

### Баги (сначала падающий тест, потом фикс)

1. **№1 — предупреждение о конце длиннее урока.** Сейчас
   `endingFrom = end - lessonEndingMinutes` не ограничен началом урока: `current`
   пропускается, `ending` начинается до занятия. Ограничить начало `ending` началом урока
   и обеспечить последовательность `current` → `ending`. Уже есть `it.failing` в
   `statusTimeline.test.ts`.
2. **№2 — пересекающиеся уроки.** Форма не запрещает пересечения, поэтому в план могут
   попасть состояния обоих уроков. Вынести проверку в `validateLesson(lesson, otherLessons)`
   в `src/domain/` (конец позже начала, класс не пустой, нет пересечений с активными
   уроками дня), закрыть unit-тестами и валидировать при сохранении.
3. **№4 — ненадёжная пересборка.** `doSync` сначала отменяет старые триггеры; если
   создание новых упадёт, расписание останется без будущих уведомлений. Не оставлять
   расписание пустым при ошибке после отмены.
4. **№5 — загрузка настроек при старте.** Форма нового урока не должна использовать
   значения по умолчанию до загрузки сохранённых настроек; позднее завершение загрузки не
   должно перезаписывать пользовательское изменение.

Отложено: **№3 — урок через полночь.** `ЧЧ:ММ` сравнивается как текст, автоподстановка
конца ограничена `23:59`; после полуночи `00:15` «меньше» начала, урок нельзя сохранить.
Не включать в текущий шаг.

### Остальные шаги

- **B4.2 (отложено):** «нельзя смахнуть» — `android.ongoing: true`; на Android 14+ такое
  уведомление всё равно смахивается, кроме особых случаев. Foreground-сервис — крайний
  вариант, сложный и расходует батарею.
- **B4.3 (опционально):** `expo-background-task` раз в сутки для пересборки окна; проверка
  выживания уведомлений после перезагрузки; удалить старые каналы (`status-v1`,
  `ending-soon-v1/v2`, `next-lesson`, `kit-test*`); вернуться к точным будильникам, если
  будут опоздания.
- **C (готово, осталось по желанию):** подсказка про «Не беспокоить»/беззвучный режим;
  перевести форму урока на `Screen` (сейчас свой `paddingTop: 60`).
- **D — удобства:** экран планирования недели с подсветкой уроков без темы; «Такая же
  тема, как у …»; автоподстановка ранее введённых тем; копирование из будущих недель;
  начало = конец предыдущего урока; копирование урока/дня; тёмная тема; проверка
  восстановления уведомлений после перезагрузки; `try/catch` вокруг `initNotifications`.
- **E — релиз:** APK через EAS Build (`production`), установка, неделя реального
  использования, исправление найденного.

## 8. Тесты domain: полное покрытие

- `now` всегда передаётся параметром; фейковые таймеры нужны только для `timeToDate`.
- Таблицы случаев — `it.each`; фабрика уроков — `makeLesson` из
  `test/helpers/lessons.ts`; даты — локальные `new Date(2026, 9, 5, 8, 30)`.
- Покрыто:
  - `dates.ts`: форматирование, неделя с понедельника (вс = 7), `addMinutesToTime` и
    граница `23:59`, `addDays`/`startOfWeek`/`daysBetween` через переходы на летнее и
    зимнее время (25 и 23 часа);
  - `schedule.ts`: границы `start <= now < end`, ровно в `end` урок прошёл, отменённые
    игнорируются, стык без перемены, порядок массива не важен;
  - `notificationTexts.ts`: пустой кабинет (в том числе пробелы), пустая тема, обрезка
    темы;
  - `statusTimeline.ts`: один урок; уроки подряд без перемены (пропуск `upcoming`);
    перемена; первый урок дня с `firstLessonStartingMinutes`; отменённый; `now` посреди
    урока; граничные настройки (`0`, `lessonEndingMinutes` = длительности); уникальность
    `id`; отсутствие пересечений;
  - `textFormaters.ts`: `pluralLessons` — все три формы на диапазоне 0–122, включая
    исключения 11–14 и 111–114.
- Известные баги фиксируются `it.failing(...)`: пока баг есть, тест зелёный; после
  исправления `.failing` убрать. Сейчас так отмечен баг №1.
- В `src/app/` тестов быть не должно: expo-router сделает их маршрутами.

## 9. Expo и EAS (полные исходные правила)

### Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (currently SDK 57).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v57.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

### Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present). This project uses npm.

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

### Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md
- Typed routes are generated on dev-server start: after adding a screen, run `npx expo start --dev-client -c`.

### Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

### Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
