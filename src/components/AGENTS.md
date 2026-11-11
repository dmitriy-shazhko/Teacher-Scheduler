# src/components — компоненты и визуальные правила

Все компоненты — **именованный экспорт**, один компонент = один файл, стили через
`StyleSheet.create` в конце того же файла. Пропсами передаются данные и презентационные
колбэки (`onSelect`, `onPrev`, `pickSource`); деловые действия (`openLesson`,
`confirmRemove`, `addLesson`) компоненты берут сами из `useLessonActions()` — владелец не
любит prop drilling.

## Состав

| Компонент | Пропсы | Поведение |
| --- | --- | --- |
| `Screen.tsx` | `title`, `children`, `rightBlock?`, `onBack?` | Каркас экрана: фон `colors.bg`, поля 16, `paddingTop = insets.top + TOP_GAP` (28), заголовок 28 px bold. `rightBlock` — элемент справа от заголовка (обычно `IconButton`); `onBack` рисует над заголовком «‹ Назад» |
| `LessonCard.tsx` | `lesson: Lesson` | Карточка урока строкой: колонка времени (начало 16 px bold, конец 12 px), цветная полоса слева, класс + `каб. N` (или «кабинет не указан»), тема, если есть. Нажатие — `openLesson(id)`, корзина `IconButton variant='danger'` — `confirmRemove(id)`. Отменённый: начало зачёркнуто, полоса `colors.barMuted`, бейдж «Отменён». `key` задаёт родитель |
| `NowCard.tsx` | `label`, `hint`, `lesson`, `accent?` | Крупная карточка текущего/следующего урока, нажатие — `openLesson`. `accent` — зелёная рамка/подпись `colors.success` |
| `DayCard.tsx` | `name`, `day: Date`, `lessons: Lesson[]` | Легаси: заголовок «Понедельник, 5 окт», «＋» и список `LessonCard`. Экран «Неделя» им больше не пользуется (`DayStrip` + список выбранного дня); удалить, когда пропадёт последний потребитель |
| `IconButton.tsx` | `icon`, `label`, `onPress`, `variant?: 'light' \| 'danger' \| 'primary'` | Квадратная кнопка-иконка 44×44 (Feather); `label` уходит в `accessibilityLabel`. `light` — карточка + акцент, `danger` — красная на `dangerBg`, `primary` — белая на акценте. Использовать вместо самодельных `Pressable` с иконкой |
| `DayStrip.tsx` | `weekStart: Date`, `selected: number`, `todayIndex: number`, `onSelect(i)` | Ряд из 7 пилюль «Пн / 5»: сегодня — `primaryTint` + рамка, выбранный день — `primary` с белым текстом; `todayIndex = -1`, если сегодня не на этой неделе |
| `WeekSwitcher.tsx` | `label`, `isCurrent`, `onPrev`, `onNext`, `onToday` | Карточка-переключатель недель: ‹ ›, подпись `formatWeek`; в текущей неделе — «Текущая неделя», иначе кликабельное «К текущей неделе» |
| `CopyLessonsModal.tsx` | `isOpen`, `targetWeekStart`, `sources`, `isBusy`, `onClose`, `pickSource` | Модальное окно выбора недели-источника; показывает диапазон и количество уроков; на время копирования строки неактивны и приглушены |
| `PickerField.tsx` | `label`, `mode: 'date' \| 'time'`, `value: Date`, `display`, `onChange` | Системный Android-пикер через `DateTimePickerAndroid.open` |
| `SettingsSection.tsx` | `title`, `children` | Заголовок секции + белая карточка со скруглением 14 |
| `SettingsRow.tsx` | `label`, `value`, `valueColor?`, `isLast?`, `onPress?` | Строка «подпись — значение»; без `onPress` неактивна; разделитель, кроме последней |
| `OptionPickerModal.tsx` | `title`, `options`, `selected`, `min`, `max`, `onSelect`, `onClose` | Список вариантов с галочкой + «Своё значение…» (цифры, ≤3 знаков, проверка `min..max`); сохранение неактивно при ошибке |
| `BatteryHint.tsx` | — | Карточка `colors.warnBg`/`colors.warnText` про ограничения батареи и кнопка `Linking.openSettings()` |

## Палитра

Все новые компоненты берут цвета из `@/domain/theme` (`colors`), хардкод `'#...'` не
добавлять.

| Ключ | Цвет | Где |
| --- | --- | --- |
| `bg` | `#f4f5fb` | фон экранов (`Screen`, форма урока) |
| `card` | `#ffffff` | карточки, tab bar, окна `Modal` |
| `text` | `#1a1a2e` | заголовки и основной текст |
| `muted` | `#6b7088` | вторичный текст, подписи, пустые состояния |
| `primary` | `#4f46e5` | акцент: кнопки, активная вкладка, полоса урока, ссылки |
| `onPrimary` | `#ffffff` | текст/иконка на акцентном фоне |
| `primaryTint` / `primaryBorder` | `#eef0ff` / `#c7c9f5` | «сегодня» в `DayStrip`, фон строк в `CopyLessonsModal` |
| `divider` | `#eceef6` | разделители, border tab bar, вторичная кнопка |
| `border` | `#d8d8e2` | рамки полей ввода (`PickerField`, `TextInput`) |
| `danger` / `dangerBg` | `#dc2626` / `#fdeeee` | удаление (корзина), «Не выдано», ошибка ввода |
| `dangerMuted` | `#a03535` | красная подсказка в акцентной `NowCard` |
| `warnBg` / `warnText` | `#fdf0c4` / `#92400e` | бейдж «Отменён», `BatteryHint` |
| `success` | `#498d1c` | зелёный акцент текущего урока (`NowCard`) |
| `warning` | `#cf9801` | подпись `NowCard` («Текущий / Следующий урок») |
| `info` | `#056ccc` | класс и кабинет в `NowCard` |
| `barMuted` | `#cfd2e0` | полоса отменённого урока |
| `overlay` | `rgba(0, 0, 0, 0.4)` | подложка `Modal` |

Все компоненты и экраны переведены на `theme.ts`; `COLOR_DANGER` из `constants.ts`
удалён — используйте `colors.danger`.

## Правила

- **Цвет текста в RN не наследуется.** Красить каждый `<Text>` (исключение — `<Text>`
  внутри `<Text>`). Поэтому в `NowCard` стили стоят на каждом текстовом элементе.
- Любой текст — внутри `<Text>`; нельзя оставлять `;` или числа между JSX-элементами
  (`{x && <Comp/>}` при `x === 0` рисует `0` и падает).
- **`Modal`**: подложка (`StyleSheet.absoluteFill`) и само окно — соседние элементы, а не
  вложенные, иначе нажатие на окно закрывает его. Обязателен `onRequestClose` для
  системной кнопки «Назад» на Android.
- **`key`** ставить на элемент в массиве у родителя (например, `<LessonCard key=...>`), а
  не внутри компонента.
- Не вкладывать вертикальные списки друг в друга; для секций — `SectionList` или
  `ListHeaderComponent`/`ListFooterComponent`.
- Заголовок и safe-area отступы вкладкам даёт `Screen`; собственный `paddingTop` не
  добавлять.
- Карточки кликабельны через `Pressable`; для мелких кнопок использовать `hitSlop`, для
  кнопок-иконок — `IconButton`, а не новый `Pressable`.
- Иконки — `Feather` из `@expo/vector-icons`; `Ionicons` в проекте больше не используется.
- Вложенный `Pressable` (корзина внутри карточки урока) допустим: жест забирает внутренний.
  После правок такого места проверять на телефоне, что не срабатывают оба обработчика
  (иначе откроются и `Alert`, и форма урока).
- Цвета — только из `@/domain/theme` (`colors`).
- Не помещать бизнес-логику в компоненты: расчёты — в `src/domain/`, данные — из стора,
  действия — из `useLessonActions`.
- Компоненты не должны импортировать `src/db/` и выполнять SQL.
