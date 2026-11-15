# src/hooks — связующие хуки

Хуки соединяют UI со стором, БД и уведомлениями. Бизнес-логику сюда не класть — она в
`src/domain/`; SQL — в `src/db/`.

## `useLessonActions.ts`

Возвращает `{ addLesson(dateStr), openLesson(id), confirmRemove(id) }`.

- `addLesson` — `router.push({ pathname: '/lesson', params: { date } })`.
- `openLesson` — `router.push({ pathname: '/lesson', params: { id: String(id) } })`.
- `confirmRemove` — `Alert.alert` с «Отмена/Удалить», удаление через
  `useLessonStore.removeLesson`; необязательный `onDone` вызывается после удаления (форма
  урока передаёт `() => router.back()`).
- Используется в `LessonCard`, `NowCard` и на экране «Неделя» (кнопка «＋»), чтобы не
  тащить колбэки через пропсы.
- Требует `useSQLiteContext()` — вызывать только внутри `SQLiteProvider`.

## `useNotificationSync.ts`

- Через `useSQLiteContext()` вызывает `syncNotifications(db)`:
  - при монтировании (запуск приложения);
  - при возврате приложения в `active` (`AppState.addEventListener('change', ...)`).
- Ошибки — `.catch(e => console.warn('syncNotifications failed', e))`.
- Подписка снимается при размонтировании.
- Вызывается ровно один раз — в `(tabs)/_layout.tsx`, внутри `SQLiteProvider`. В корневом
  `_layout.tsx` нельзя: там `SQLiteProvider` только рендерится, контекста ещё нет.
- Не заменять на `useFocusEffect`: нужен именно старт приложения и возврат из фона.

## `useNotificationPermission.ts`

Возвращает `{ status, refresh }`, где `status`:
`null` (ещё не прочитан) | `'granted'` | `'canAsk'` | `'blocked'`.

- Читает `getNotificationPermissionStatus()` при монтировании и при возврате в `active`
  (`AppState`), потому что разрешение могли изменить в системных настройках.
- Сам разрешение **не запрашивает**: запрос делает `ensureNotificationPermission()` по
  нажатию на экране «Настройки».
- `refresh()` — принудительное перечитывание после системного запроса.
- `blocked` означает `canAskAgain === false`: системный диалог больше не появится, только
  `Linking.openSettings()`.

## `useNow.ts`

Возвращает актуальное `Date` для экранов «Сегодня» и «Неделя».

- Отсчёт ведётся, пока вкладка в фокусе (`useFocusEffect`): `setNow(new Date())`
  вызывается **сразу при входе на вкладку**, поэтому экран не открывается с временем
  момента ухода (вкладки не размонтируются и не перезагружают данные).
- Дальше — `setTimeout` до ближайшей границы минуты, затем цепочкой раз в минуту:
  урок перестаёт быть текущим ровно в `ЧЧ:ММ`, опроса каждую секунду нет.
- `AppState` → `active` дополнительно вызывает `tick()`: в фоне Android замораживает
  JS-таймеры, после разблокировки время иначе осталось бы старым.
- `setTimeout` и подписка на `AppState` снимаются в cleanup `useFocusEffect`.
- Собственный `useState` + `setInterval` на экране не держать — это и был баг: при
  возврате на «Сегодня» ещё секунду показывался уже закончившийся урок.
- Смену суток экран ловит сам по `toDateString(now)` (например, `useEffect` с `useRef`
  на предыдущий день в `today.tsx`), хук про календарь ничего не знает.

## Правила

- Хуки с `useSQLiteContext()` — только внутри `SQLiteProvider`.
- Не вызывать `syncNotifications` из эффектов, привязанных к фокусу вкладки: он сработает
  раньше, чем закончится предыдущая синхронизация, и покажет пустой список при
  диагностике. Очередь вызовов есть в самом планировщике, но лишние вызовы не нужны.
- `useFocusEffect` (в экранах) требует `useCallback`; таймеры очищать в возвращаемой
  функции.
- `AppState`-подписки всегда снимать в cleanup.
- Асинхронные функции в `useEffect` не передавать напрямую — вызывать внутри
  `useEffect(() => { fn(); }, [])` или через IIFE.
- Хуки не должны содержать тексты уведомлений и расчёты состояний — только вызовы
  `src/notifications/` и `src/domain/`.
