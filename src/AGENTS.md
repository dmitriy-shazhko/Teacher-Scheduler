# src — слои и правила

Код приложения разделён на слои. Направление зависимостей — сверху вниз; обратные
импорты и циклические связи не допускаются.

```
src/app/          экраны-маршруты (композиция)
   ↓
src/components/   презентационные компоненты
src/hooks/        связующие хуки
   ↓
src/store/        zustand-состояние и действия
   ↓
src/db/           SQLite и kv-store        src/notifications/   планировщик и каналы
   ↓                                          ↓
src/domain/       чистые типы и функции (ни от чего не зависит, кроме своих файлов)
```

Разрешённые зависимости:

- `domain` → только `domain` (и стандартный JS). **Никаких** `react`, `react-native`,
  `expo-*`, `zustand`, `notifee`.
- `db` → `domain` + `expo-sqlite`.
- `notifications` → `domain` + `db/settings` + `react-native-notify-kit` +
  `expo-notifications`.
- `store` → `db`, `domain`, `notifications`.
- `hooks` → `store`, `notifications`, `domain`, `expo-router`, `react-native`.
- `components` → `domain`, `hooks`, `react-native` (без прямого SQL и без стора, если
  можно обойтись хуком/пропсами).
- `app` → всё вышеперечисленное, но только композиция и навигация.

## Правила

- **`src/app/` — только маршруты.** Каждый файл там становится экраном. Компоненты,
  хуки, утилиты и тесты — снаружи.
- **`src/domain/` — чистота.** Любая бизнес-логика (границы урока, тексты уведомлений,
  план состояний, форматирование) должна тестироваться без телефона. `now` и настройки
  приходят параметрами, а не читаются из глобального состояния.
- **`src/db/` — единственное место SQL.** Снаружи отдаются camelCase-объекты
  (`Lesson`), внутри строки БД — `snake_case`; перевод в `rowToLesson`.
- **`src/store/` — единственная точка изменения уроков.** Ни экран, ни компонент не
  вызывают `addLesson`/`updateLesson`/`deleteLesson`/`copyWeek` напрямую; все изменения
  идут через `saveLesson`, `removeLesson`, `copyWeek`, чтобы `refresh` обновил данные и
  пересобрал уведомления.
- **`src/notifications/` не содержит текстов и расчёта состояний** — только вызовы
  библиотеки, каналы, триггеры. Тексты и план — в `domain`.
- **Компоненты не принимают колбэки деловых действий через пропсы** (`LessonCard`,
  `NowCard`): навигация и удаление берутся из `useLessonActions()`. Презентационные
  колбэки (например, `onSelect` у `DayStrip`) — можно.
- **Настройки** читаются в компонентах через `useSettingsStore`, меняются через
  `updateSettings`; в чистые функции передаются параметром. Планировщик читает их
  напрямую из kv-store (`loadSettings`), чтобы не зависеть от загрузки стора.
- **Импорты:** алиас `@/` = `src/`. Использовать `@/domain/...`, `@/db/...` и т. д.
  Внутри одного каталога допустимы относительные (`./channels`).
- **Экспорты:** компоненты и функции — именованные; `default export` — только экраны
  в `src/app/` (требование expo-router).
- **Константы** (дни недели, месяцы, окно планировщика, настройки по умолчанию, варианты
  и лимиты настроек) — в `src/domain/constants.ts`; **цвета** — в `src/domain/theme.ts`
  (`colors`), это единственный источник палитры.
- **Тесты** (`*.test.ts`) лежат рядом с кодом в `domain`, `db`, `store`, `notifications`
  или в `test/`. В `src/app/` тестов быть не должно.
- **Стили** — `StyleSheet.create` в конце файла, один компонент = один файл.
  Не наследовать цвет текста от родителя (в RN это не работает) — красить каждый `<Text>`.

## Порядок добавления функции

1. Типы и чистые функции — `src/domain/` (+ unit-тест).
2. Если нужны данные — функция в `src/db/` (SQL только там) (+ интеграционный тест).
3. Действие в `src/store/` с обновлением данных и `syncNotifications`.
4. Если функция влияет на уведомления — правка `src/domain/statusTimeline.ts` /
   `notificationTexts.ts` и `src/notifications/scheduler.ts`.
5. Компоненты — `src/components/`, экран — `src/app/`.
6. `npm run typecheck`, `npm test`, `npm run lint`; проверка на телефоне, если затронуты
   уведомления, навигация или нативные модули.

## Документация по слоям

- Экраны и навигация — [src/app/AGENTS.md](app/AGENTS.md)
- Компоненты и палитра — [src/components/AGENTS.md](components/AGENTS.md)
- SQLite и настройки — [src/db/AGENTS.md](db/AGENTS.md)
- Типы, даты, расписание, тексты, план состояний — [src/domain/AGENTS.md](domain/AGENTS.md)
- Хуки — [src/hooks/AGENTS.md](hooks/AGENTS.md)
- Уведомления — [src/notifications/AGENTS.md](notifications/AGENTS.md)
- Zustand-сторы — [src/store/AGENTS.md](store/AGENTS.md)
