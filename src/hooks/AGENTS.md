# src/hooks — связующие хуки

Хуки соединяют UI со стором, БД и уведомлениями. Бизнес-логику сюда не класть — она в
`src/domain/`; SQL — в `src/db/`.

## `useLessonActions.ts`

Возвращает `{ addLesson(dateStr), openLesson(id), confirmRemove(id) }`.

- `addLesson` — `router.push({ pathname: '/lesson', params: { date } })`.
- `openLesson` — `router.push({ pathname: '/lesson', params: { id: String(id) } })`.
- `confirmRemove` — `Alert.alert` с «Отмена/Удалить», удаление через
  `useLessonStore.removeLesson`.
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
