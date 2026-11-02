# Teacher Schedule — контекст для агента

Android-приложение расписания для учителя: уроки по конкретным датам, недельный экран,
копирование недели, настройки и одно живое уведомление о текущем/следующем уроке.
Проект учебный: владелец учится React Native — маленькие шаги с объяснениями.

**Документация:**

- `PROJECT.md` — полный журнал решений и требований.
- Вложенные `AGENTS.md`: [src](src/AGENTS.md), [app](src/app/AGENTS.md),
  [components](src/components/AGENTS.md), [db](src/db/AGENTS.md),
  [domain](src/domain/AGENTS.md), [hooks](src/hooks/AGENTS.md),
  [notifications](src/notifications/AGENTS.md), [store](src/store/AGENTS.md),
  [test](test/AGENTS.md), [.github](.github/AGENTS.md).
- `AGENTS_DETAILS.md` — вынесенные подробности: требования, полный стек, все команды,
  дорожная карта, покрытие тестов domain и полные Expo-правила. Позже подключим
  отдельными хуками; пока открывать по ссылке при необходимости.

## Что делает приложение

1. Расписание на неделю; каждый урок — отдельная запись с датой (прошлые недели хранятся).
2. Поля урока: дата, начало, конец, класс, кабинет, тема, флаг «отменён».
3. Одно живое уведомление в шторке: `upcoming` → `current` → `ending` («Скоро конец
   урока», вибрация, обратный отсчёт) — по системному таймеру.
4. Первый урок дня анонсируется за настраиваемое время (по умолчанию 60 минут).
5. «Скопировать неделю» — из одной из 8 прошлых недель.
6. «Настройки»: минуты до первого урока, минуты до конца урока, длительность урока,
   статус разрешения на уведомления, подсказка про батарею.
7. Дата в интерфейсе — `ДД.ММ.ГГГГ`, внутри — `ГГГГ-ММ-ДД`; время — `ЧЧ:ММ`.

Платформа — **Android**; уведомления проверяются на телефоне в **development build**,
не в Expo Go; iOS/веб не цель.

## Стек

- Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6 (strict), `expo-router`, Ionicons.
- `expo-sqlite` (чистый SQL, миграции `PRAGMA user_version`), `zustand`, настройки —
  `expo-sqlite/kv-store` (ключ `settings`, JSON).
- `@react-native-community/datetimepicker` (Android-пикеры), `react-native-notify-kit`
  (форк Notifee) + `expo-notifications` (разрешение), `expo-dev-client` + EAS Build.
- Тесты: Jest + `jest-expo`; CI: GitHub Actions. Не используем Drizzle, react-hook-form,
  zod, date-fns, UI-kit; новые библиотеки — после объяснения и согласования.

## Команды

```bash
npm install                                             # зависимости
APP_VARIANT=development npx expo start -c --dev-client   # dev-сборка + очистка кэша
npx expo start --dev-client                             # dev-сервер для установленного APK
npm run typecheck                                       # tsc --noEmit
npm test                                                # Jest
npm run lint                                            # expo lint
npx expo install <пакет>                                # только так ставить Expo-пакеты
npx expo install --fix                                  # привести версии к SDK
npx eas-cli@latest build --profile development --platform android  # новый APK
```

- JS обновляется без пересборки; **новый нативный пакет требует нового APK**.
- Перед завершением задачи: `npm run typecheck`, `npm run lint`; логику — с тестами.
- `APP_VARIANT=development` меняет имя, scheme (`teacherschedule-dev`) и package (`.dev`); данные SQLite у dev и production разные.

## Структура

```
src/
  app/          только экраны-маршруты (default export)
  components/   переиспользуемые компоненты (named export)
  db/           SQLite, миграции, уроки, kv-store настроек
  domain/       типы, константы, чистые функции дат/расписания/уведомлений
  hooks/        useLessonActions, useNotificationSync, useNotificationPermission
  notifications/ каналы, разрешения, init, планировщик
  store/        zustand: lessonsStore, settingsStore
test/           jest globalSetup, helpers, общие тесты
.github/        CI (typecheck, tests, lint)
```

Алиас `@/` = `src/` (tsconfig + Jest `moduleNameMapper`). Scheme: `scheduler`.
Конфиг собирается из `app.config.ts` + `app.json`.

## Границы слоёв

- `src/app/` — только маршруты и композиция; компоненты и тесты сюда нельзя.
- `src/domain/` — чистые функции и типы, **без React, БД и нативных модулей**. Всё
  тестируемое без телефона живёт здесь; `now` и настройки — параметрами.
- `src/db/` — весь SQL; наружу camelCase-типы. `src/store/` — единственная точка
  изменения уроков; после изменений `refresh` обновляет данные и зовёт `syncNotifications`.
- `src/notifications/` — только планирование, каналы, разрешения; тексты и план — в `domain`.
- `src/components/` — презентация; действия из `useLessonActions`, не через пропсы.
- `src/hooks/` — связующие хуки; `useSQLiteContext()` только внутри `SQLiteProvider`.

## Ключевые решения

- **Один урок = одна строка с конкретной датой.** Нет шаблонов/слотов; поэтому есть
  копирование недели. Отменённые уроки при копировании пропускаются.
- **Даты — строки `ГГГГ-ММ-ДД`, время — `ЧЧ:ММ`.** Сравнение дат строковое; локальное
  время; **никогда `toISOString()`** для дат; неделя с понедельника.
- **Границы урока:** `start <= now < end`; ровно в `end` урок уже прошёл.
- **Одно уведомление-состояние:** шаги `status-<lessonId>-<kind>` с уникальными `id`,
  триггеры на будущее и `timeoutAfter` до следующего шага; текущее показывается сразу.
- **Настройки** — в kv-store, копия в сторе; чистые функции получают их параметром;
  планировщик читает kv-store напрямую (может обогнать загрузку стора).
- **Изменения уроков только через стор** (`saveLesson`, `removeLesson`, `copyWeek`).
- Модель данных (`Lesson`, `StatusStep`, `AppSettings`) и полные типы — в
  `AGENTS_DETAILS.md`, раздел «Типы данных».

## Соглашения

- TypeScript strict; компоненты — именованный экспорт, `default export` только у экранов.
- Импорты через `@/…`; Prettier: одинарные кавычки (в JSX тоже), 4 пробела, ширина 100,
  `;`, trailing comma. `StyleSheet.create` в конце файла, один компонент = один файл.
- Константы — в `src/domain/constants.ts`. Палитра: акцент `#4a4ae0`, фон `#f4f4f8`,
  заголовки `#1c1c28`, класс `#056ccc`, отменённый `#cfcfcf`/`#8f8f8f`, ошибка `#c0392b`.
  Детали и цвета `NowCard` — в `src/components/AGENTS.md`.
- Заголовки/отступы вкладок даёт `Screen`; свой `paddingTop` не добавлять.
- Машинный формат даты внутри, форматирование — только при выводе.
- Настройки читать из `useSettingsStore`, менять только через `updateSettings`.
- Тесты — рядом с кодом в `domain`, `db`, `store`, `notifications`; **не в `src/app/`**.

## Состояние (02.11.2026)

Готово: экраны, форма урока, SQLite/миграции, сторы, настройки, уведомления (каналы,
разрешения, план, планировщик, синхронизация). Шаг T: T1 (Jest + TZ), T2 (CI), T3
(unit-тесты `dates`, `schedule`, `notificationTexts`, `statusTimeline`). Баг №1 отмечен
`it.failing`.

Дальше по порядку: **T4** — тесты БД на `better-sqlite3` (или `sql.js`/`node:sqlite`);
**T5** — тесты планировщика/стора с моками и `syncNotifications(db, now?)`; затем баги
№1 (ending длиннее урока), №2 (пересечения), №4 (пересборка после отмены), №5 (гонка
настроек). Отложено: №3 (урок через полночь), B4.2 (нельзя смахнуть), B4.3 (фоновая
задача/перезагрузка), шаг D (удобства), шаг E (релиз APK). Подробности — в
`AGENTS_DETAILS.md`.

## Expo: не доверять памяти

- Версия SDK — 57; документация: `https://docs.expo.dev/versions/v57.0.0/`, индекс и
  исправления типичных ошибок: `https://docs.expo.dev/llms.txt`.
- Ставить пакеты только `npx expo install`. Перед завершением — lint + typecheck.
- Маршруты — только в `src/app/`; после нового экрана перезапустить
  `npx expo start --dev-client -c` (типы маршрутов генерируются при старте).
- `ios/`/`android/` не редактировать вручную (CNG); настройка — `app.json`/config plugins.
- Нативный пакет → development build (`eas build --profile development`), Expo Go не хватит.
- Полные исходные правила Expo/EAS — в `AGENTS_DETAILS.md`, раздел «Expo и EAS».
