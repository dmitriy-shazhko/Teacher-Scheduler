# src/store — Zustand-состояние

Два стора: `lessonsStore` (уроки) и `settingsStore` (настройки). Сторы — единственная
точка изменения данных для UI.

## `lessonsStore.ts`

Состояние:

- `weekStart: Date | null` — понедельник открытой недели;
- `lessons: Lesson[]` — уроки открытой недели;
- `todayLessons: Lesson[]` — уроки сегодняшнего дня.

Действия (все принимают `db: SQLiteDatabase`):

- `loadWeek(db, weekStart)` — читает неделю и сохраняет `weekStart` + `lessons`;
- `loadToday(db)` — читает сегодняшний день в `todayLessons`;
- `removeLesson(db, id)` — удаляет, затем `refresh`;
- `saveLesson(db, id | null, data)` — `addLesson` при `id === null`, иначе
  `updateLesson`, затем `refresh`;
- `copyWeek(db, source, target)` — копирует и вызывает `refresh`.

Внутренний `refresh(db)`:

1. перезагружает открытую неделю (если `weekStart` задан);
2. перезагружает «сегодня»;
3. **без `await`** вызывает `syncNotifications(db)` с `.catch(e => console.warn(...))`.

Правила:

- Любое изменение уроков — только через эти действия. Прямой вызов
  `addLesson`/`updateLesson`/`deleteLesson`/`copyWeek` из `src/db/lessons.ts` в экранах и
  компонентах запрещён (разовые чтения — можно, например `getLessonById`).
- Импорты функций БД — с псевдонимами (`addLesson as dbAddLesson`,
  `copyWeek as dbCopyWeek`), чтобы не путать с действиями стора.
- `refresh` — единственное место, где обновляются и неделя, и «сегодня», и уведомления.
  Новое изменяющее действие должно заканчиваться им.
- `syncNotifications` запускается намеренно без ожидания (UI не должен ждать
  планировщик), ошибки только логируются.
- Не хранить в сторе производные данные (текущий/следующий урок считает `domain`).

## `settingsStore.ts`

Состояние: `settings: AppSettings`, `loaded: boolean`.

- `settings` инициализируется `DEFAULT_SETTINGS` (из `domain/constants`).
- `loadSettings()` — читает из kv-store через `db/settings.loadSettings`, ставит
  `loaded: true`. Вызывается один раз при старте в корневом `_layout.tsx`.
- `updateSettings(patch)` — сначала `set` в сторе (интерфейс обновляется сразу), затем
  `saveSettings` на диск. Порядок важен: UI не ждёт запись.
- Ошибка записи не откатывает состояние; чтение при следующем старте подмешает
  `DEFAULT_SETTINGS`.

Правила:

- В компонентах читать через селектор `useSettingsStore((s) => s.settings.xxx)`.
- Менять только через `updateSettings`; не писать в kv-store напрямую из UI.
- После `await updateSettings(...)` экран «Настройки» вызывает `syncNotifications(db)`,
  чтобы планировщик пересобрал план с новыми значениями (`syncNotifications` читает
  kv-store сам).
- Все изменяющие данные функции — async; не забывать `await` перед навигацией/закрытием
  окна, если следующий шаг зависит от записи.
- Гонка «загрузка настроек при старте vs. форма нового урока» — известный баг №5; пока
  не исправлен, не полагаться на `loaded` без проверки.

## Грабли

- Селекторы стора должны быть стабильными (не создавать новый объект в селекторе без
  `useShallow`), иначе лишние ререндеры.
- `useSQLiteContext()` доступен только внутри `SQLiteProvider`; в сторе соединение не
  хранится — `db` передаётся аргументом.
- Не импортировать `lessonsStore` в компоненты ради действий: для этого есть
  `useLessonActions` (навигация + подтверждение удаления).
