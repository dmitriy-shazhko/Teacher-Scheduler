---
name: store
description: Zustand-сторы Scheduler, действия saveLesson/removeLesson/copyWeek, refresh как единая точка обновления, алиасы DB-функций, settingsStore, стабильные селекторы и гонка настроек №5. Использовать при изменении состояния, действий над уроками или настроек.
---

# Store — zustand и обновление данных

## Когда применять

- Новое действие над уроками или настройками.
- Меняется `refresh`, загрузка недели/сегодня.
- Компоненту нужны данные или действие из стора.
- Разбирается гонка загрузки настроек (баг №5).
- Нужно понять, почему после изменения не обновились уведомления.

Схему и SQL — в скиле `db-schema`, чистые расчёты — `architecture`.

## Какие AGENTS.md прочитать

Пути от корня проекта.

1. `src/store/AGENTS.md` — **главный**: состояние, действия, `refresh`, `settingsStore`,
   грабли и гонка №5.
2. `src/AGENTS.md` — «стор — единственная точка изменения уроков», зависимости слоёв.
3. `src/db/AGENTS.md` — какие функции БД вызываются и что они возвращают.
4. `src/hooks/AGENTS.md` — `useLessonActions` и правила хуков со стором.
5. `src/notifications/AGENTS.md` — зачем `refresh` зовёт `syncNotifications`.
6. `src/app/AGENTS.md` — как экран читает стор и когда вызывает `loadToday`/`loadWeek`.

## Пошаговый порядок

1. **Сначала функция БД**, если нужны новые данные. Стор не содержит SQL.
2. Добавь поле/действие в тип `State` (`lessonsStore`) или `SettingsState`.
3. Импортируй DB-функции с псевдонимами: `addLesson as dbAddLesson`,
   `copyWeek as dbCopyWeek` — чтобы не путать с действиями стора.
4. Новое изменяющее действие: mutate → `await refresh(db)`.
5. `refresh` — единственное место, где обновляются неделя, «сегодня» и уведомления.
6. `syncNotifications` вызывается **без `await`**, ошибки — `.catch(console.warn)`.
7. Для настроек: `set` в сторе → `await saveSettings`. UI не ждёт диск.
8. В компоненте читай через стабильный селектор, меняй только через действие.
9. Напиши тест (T5), если добавлено нетривиальное поведение.

## Шаблон кода

### `lessonsStore`

```ts
import {
    addLesson as dbAddLesson,
    copyWeek as dbCopyWeek,
    deleteLesson as dbDeleteLesson,
    getLessonsForDate,
    getLessonsForWeek,
    updateLesson as dbUpdateLesson,
} from '@/db/lessons';
import type { Lesson } from '@/domain/types';
import { syncNotifications } from '@/notifications/scheduler';
import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

type State = {
    weekStart: Date | null;
    lessons: Lesson[];
    todayLessons: Lesson[];
    loadWeek: (db: SQLiteDatabase, weekStart: Date) => Promise<void>;
    loadToday: (db: SQLiteDatabase) => Promise<void>;
    removeLesson: (db: SQLiteDatabase, id: number) => Promise<void>;
    saveLesson: (db: SQLiteDatabase, id: number | null, data: Omit<Lesson, 'id'>) => Promise<void>;
    copyWeek: (db: SQLiteDatabase, source: Date, target: Date) => Promise<void>;
};

export const useLessonStore = create<State>((set, get) => {
    const refresh = async (db: SQLiteDatabase) => {
        const { weekStart } = get();

        if (weekStart) await get().loadWeek(db, weekStart);
        await get().loadToday(db);

        // Намеренно без await: UI не должен ждать планировщик.
        syncNotifications(db).catch((e) => console.warn('syncNotifications failed', e));
    };

    return {
        weekStart: null,
        lessons: [],
        todayLessons: [],

        loadWeek: async (db, weekStart) => {
            const lessons = await getLessonsForWeek(db, weekStart);
            set({ weekStart, lessons });
        },

        loadToday: async (db) => {
            const todayLessons = await getLessonsForDate(db, new Date());
            set({ todayLessons });
        },

        removeLesson: async (db, id) => {
            await dbDeleteLesson(db, id);
            await refresh(db);
        },

        saveLesson: async (db, id, data) => {
            if (id === null) await dbAddLesson(db, data);
            else await dbUpdateLesson(db, id, data);
            await refresh(db);
        },

        copyWeek: async (db, source, target) => {
            await dbCopyWeek(db, source, target);
            await refresh(db);
        },
    };
});
```

### `settingsStore`

```ts
export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: DEFAULT_SETTINGS,
    loaded: false,

    loadSettings: async () => {
        const settings = await dbLoadSettings();
        set({ settings, loaded: true });
    },

    updateSettings: async (patch) => {
        const next = { ...get().settings, ...patch };

        set({ settings: next }); // интерфейс обновляется сразу
        await dbSaveSettings(next); // затем запись на диск
    },
}));
```

### Чтение в компоненте

```ts
// стабильный селектор: одно примитивное значение
const lessonEndingMinutes = useSettingsStore((s) => s.settings.lessonEndingMinutes);

// действие — отдельным селектором, не объектом
const removeLesson = useLessonStore((s) => s.removeLesson);
```

## Правила

- Все изменяющие действия принимают `db` аргументом; в сторе нет `useSQLiteContext`
  и глобального соединения.
- Любое новое действие заканчивается `refresh`.
- `refresh` обновляет и открытую неделю (если `weekStart` задан), и «сегодня», и
  уведомления.
- Не хранить в сторе производные данные: текущий/следующий урок считает `domain`.
- Прямые вызовы `addLesson`/`updateLesson`/`deleteLesson`/`copyWeek` из UI запрещены;
  разовые чтения (`getLessonById`) допустимы.
- В компонентах действия берутся из `useLessonActions`, а не из стора напрямую.
- Настройки меняются только через `updateSettings`; kv-store из UI не трогать.
- После `await updateSettings(...)` экран «Настройки» отдельно зовёт
  `syncNotifications(db)` — планировщик читает kv-store сам.

## Гонка №5 — настройки при старте

Проблема: форма нового урока может взять `DEFAULT_SETTINGS`, пока `loadSettings()` ещё
не завершился, или поздняя загрузка может перезаписать выбор пользователя.

Правила до фикса:

- Не полагаться на `loaded` без проверки и не считать `DEFAULT_SETTINGS` финальными.
- Не перезаписывать поля, которые пользователь уже менял, результатом поздней загрузки.
- Если трогаешь эту логику — сначала воспроизведи гонку тестом или явным сценарием,
  потом меняй код.

## Чек-лист перед завершением

- [ ] Новое действие заканчивается `await refresh(db)`.
- [ ] DB-функции импортированы с псевдонимами `db*`.
- [ ] `syncNotifications` вызывается без `await` и с `.catch`.
- [ ] Нет SQL и `useSQLiteContext` внутри стора.
- [ ] В сторе нет вычислений текущего/следующего урока.
- [ ] Селекторы стабильные: примитив или ссылка, без нового объекта на каждый рендер.
- [ ] `settingsStore.updateSettings` сначала `set`, потом запись на диск.
- [ ] UI не импортирует `lessonsStore` ради действий — используется `useLessonActions`.
- [ ] Для нового поведения есть тест или описан ручной сценарий проверки.

## Команды проверки

```bash
npm run typecheck
npm test
npm run lint

npm test -- src/store/lessonsStore.test.ts
```

После изменений, влияющих на уведомления, проверить на телефоне: сохранить урок,
вернуться в шторку, убедиться, что план пересобрался.

## Типичные ошибки

- **Забыть `refresh`.** Неделя и «сегодня» устареют, уведомления не пересоберутся.
- **`await syncNotifications(db)`.** UI зависает на планировщике; ошибка ломает действие.
- **Прямой вызов DB-функции из экрана.** Обходит `refresh` и уведомления.
- **Хранить `current`/`next` в сторе.** Это производные данные, их считает `domain`.
- **Селектор возвращает новый объект.** Лишние ререндеры; используй примитивы или
  `useShallow`.
- **Писать в kv-store из компонента.** Только через `updateSettings`.
- **Забыть `await` перед навигацией.** Экран закроется раньше записи.
- **Изменить `settings` без `loaded`.** Риск гонки №5: настройки ещё не прочитаны.
- **Хранить `db` в сторе.** Соединение приходит аргументом из `useSQLiteContext`.
