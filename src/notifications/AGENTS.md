# src/notifications — каналы, разрешения и планировщик

Слой отвечает **только** за интеграцию с нативными уведомлениями. Тексты и план
состояний — в `src/domain/` (`notificationTexts.ts`, `statusTimeline.ts`). Библиотека
планирования — `react-native-notify-kit` (форк Notifee, API совместимо); разрешение —
`expo-notifications`. Работает **только в development build**, не в Expo Go.

## Файлы

| Файл | Назначение |
| --- | --- |
| `channels.ts` | `CHANNELS` и `setupChannels()` |
| `permissions.ts` | `ensureNotificationPermission()`, `getNotificationPermissionStatus()` |
| `init.ts` | `initNotifications()`: сначала каналы, потом разрешение |
| `scheduler.ts` | `syncNotifications(db)` и внутренний `doSync` |

## Инициализация

`initNotifications()` вызывается в `useEffect` корневого `src/app/_layout.tsx`.

Порядок строгий:

1. `setupChannels()` — создать каналы;
2. `ensureNotificationPermission()` — запросить системное разрешение.

На Android 13+ диалог `POST_NOTIFICATIONS` показывается только после создания канала.
`Notifications.setNotificationHandler(...)` задан в `_layout.tsx` на уровне модуля.

## Каналы (`channels.ts`)

| Ключ | id канала | Важность | Особенности |
| --- | --- | --- | --- |
| `status` | `status-v2` | HIGH | `visibility: PUBLIC` |
| `endingSoon` | `ending-soon-v3` | HIGH | `vibration: true`, `vibrationPattern: [400, 200, 400, 200, 400, 200]`, `visibility: PUBLIC` |

- Настройки канала **неизменяемы** после создания на устройстве (важность, звук,
  вибрация, видимость). Для новых параметров нужен **новый id** канала
  (`status-v3`, `ending-soon-v4`), а не правка существующего.
- Старые каналы (`status-v1`, `ending-soon-v1/v2`, `next-lesson`, `kit-test*`) могут
  остаться на телефоне; удаление — вручную через `notifee.deleteChannel`, не критично.
- Создание каналов только для Android (`Platform.OS === 'android'`).

## Разрешения (`permissions.ts`)

- `ensureNotificationPermission()`: если уже выдано — `true`; если `canAskAgain === false`
  — `false`; иначе системный запрос, вернуть `granted`.
- `getNotificationPermissionStatus()` → `'granted' | 'canAsk' | 'blocked'` без запроса.
- Разрешение системное, одно на приложение; меняется вне приложения — статус нужно
  перечитывать при возврате в foreground (`useNotificationPermission`).

## Планировщик (`scheduler.ts`)

Главный принцип: **`syncNotifications(db)` полностью пересобирает план** из БД на
скользящее окно. Вызывается после любых изменений уроков, при старте/возврате из фона,
после смены настроек и выдачи разрешения.

`doSync`:

1. `notifee.cancelTriggerNotifications()` — отменить все запланированные триггеры.
2. `now = new Date()`, `loadSettings()` (из kv-store, не из стора), `getLessonsForRange(
   db, now, addDays(now, SCHEDULER_WINDOW_DAYS))` — сегодня + 7 дней (8 дат).
3. `buildStatusTimeline(lessons, now, settings)`.
4. `running = showAt <= now`, `future = showAt > now`.
5. Показанные уведомления, которых нет в новом плане, отменить
   (`getDisplayedNotifications` + `cancelDisplayedNotification`).
6. `running` показать сразу через `displayNotification` с
   `timeoutAfter = hideAt - now`.
7. `future` запланировать через `createTriggerNotification` (`TriggerType.TIMESTAMP`,
   `alarmManager: { allowWhileIdle: true }`) с `timeoutAfter = hideAt - showAt`.

Детали уведомления (`toNotification`):

- `id` шага — `status-<lessonId>-<kind>`, **уникальный**. Триггеры с одинаковым `id`
  схлопываются в один (проверено), поэтому общий id для цепочки использовать нельзя.
- `timeoutAfter` убирает показанное уведомление само к началу следующего состояния —
  в шторке остаётся одно уведомление.
- `onlyAlertOnce: true` — при пересборке не вибрировать повторно.
- `showChronometer: true`, `chronometerDirection: 'down'`, `timestamp`: начало урока для
  `upcoming`, конец урока для `current`/`ending` (системный обратный отсчёт `мм:сс`).
- Канал: `ending` → `CHANNELS.endingSoon`, остальные → `CHANNELS.status`.
- `textFor`: `current` → `buildCurrentLessonText`, `ending` → `buildEndingText`,
  `upcoming` → `buildNextLessonText(step.lesson)`.

Очередь: `syncNotifications` выстраивает вызовы через модульную переменную `lastSync`,
чтобы параллельные синхронизации не перемешивали отмену и планирование. Возвращает
промис текущего запуска.

Точки вызова:

- `lessonsStore.refresh` — после сохранения/удаления/копирования, без `await`;
- `useNotificationSync` — старт приложения и возврат из фона (в `(tabs)/_layout.tsx`);
- экран «Настройки» — после `await updateSettings` и после выдачи разрешения;
- (опционально, не сделано) фоновая задача раз в сутки — B4.3.

## Известные проблемы и ограничения

- **Баг №4:** `doSync` сначала отменяет все старые триггеры и только потом создаёт новые.
  Если создание упадёт (например, `createTriggerNotification`), расписание останется без
  будущих уведомлений. План фикса — тест + безопасная пересборка.
- **Пересекающиеся уроки** дают два одновременных состояния — обещание «одно уведомление»
  выполняется только для непересекающегося расписания (баг №2).
- `ending` может начинаться раньше начала урока, если `lessonEndingMinutes` больше
  длительности (баг №1; план — ограничить начало `ending` началом урока).
- **Android 12+:** точное срабатывание требует разрешения на точные будильники
  (`SCHEDULE_EXACT_ALARM`); сейчас не подключено — работает после снятия ограничений
  батареи. Вернуться, если будут опоздания.
- **Экономия батареи** может откладывать/подавлять уведомления; подсказка есть на экране
  «Настройки» (`BatteryHint`).
- **Android 14+** позволяет смахивать `ongoing`-уведомления (кроме плеера/звонка/VPN),
  поэтому «нельзя смахнуть» (B4.2) отложено; foreground-сервис без явной необходимости не
  делать.
- **Обратный отсчёт** возможен только системным хронометром в шапке; поминутный текст
  внутри без foreground-сервиса не сделать.
- Уведомление в несуществующий канал на Android 8+ не показывается: проверять
  `notifee.getChannels()` и что каналы созданы раньше планирования.
- Предупреждение `[notifee] no background event handler has been set` на планировщик не
  влияет; обработчик `onBackgroundEvent` нужен только для кнопок и регистрируется на
  верхнем уровне модуля.
- Для диагностики: `notifee.getTriggerNotificationIds()`, `notifee.getChannels()`.
  Не вешать диагностику на `useFocusEffect` в layout — сработает раньше синхронизации.
- После перезагрузки телефона запланированные уведомления нужно проверить вручную
  (B4.3); при необходимости пересобирать план при первом запуске.
- В релизе обернуть `initNotifications` в `try/catch`, чтобы сбой уведомлений не ронял
  приложение.

## Тесты (T5, план)

- Мокать `react-native-notify-kit` и `expo-sqlite/kv-store` через `jest.mock`/`__mocks__`.
- Проверять: отмену старых триггеров, уникальные `id`, правильный `timeoutAfter`, показ
  идущего состояния, сериализацию параллельных `syncNotifications`, сценарий бага №4
  (падение `createTriggerNotification` после отмены).
- Для детерминированного «сейчас» добавить в `syncNotifications`/`doSync` необязательный
  параметр `now` вместо фейковых таймеров.
- Реальную доставку, каналы, вибрацию и батарею тесты не покрывают — остаётся ручной
  чек-лист на телефоне.
