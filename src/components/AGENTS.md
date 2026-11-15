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
| `LessonCard.tsx` | `lesson: Lesson`, `passed?` | Карточка урока строкой: колонка времени (начало 16 px bold, конец 12 px), цветная полоса слева, класс + `каб. N` (или «кабинет не указан»), тема, если есть. Нажатие — `openLesson(id)`, корзина `IconButton variant='danger'` — `confirmRemove(id)`. Приглушение (`dimmed = passed` или `lesson.cancelled`): время `colors.muted`, класс `mutedStrong`, полоса `barMuted`. Отменённый вдобавок: начало зачёркнуто, бейдж «Отменён». `passed` ставит «Неделя» для секции «Прошедшие уроки». `key` задаёт родитель |
| `LessonSectionHeader.tsx` | `title`, `count`, `tone?: 'accent' \| 'muted' \| 'warn'` | Заголовок секции списка уроков (13 px bold) с бейджем-счётчиком справа. `accent` — `colors.primary`/`primaryTint`, `muted` — `mutedStrong`/`mutedTint`, `warn` — `warnText`/`warnBg`. Используется на «Неделе» («Активные / Прошедшие / Отменённые уроки») |
| `NowCard.tsx` | `label`, `hint`, `lesson`, `accent?` | Крупная карточка текущего/следующего урока, нажатие — `openLesson`. `accent` — зелёная рамка/подпись `colors.success` |
| `DayCard.tsx` | `name`, `day: Date`, `lessons: Lesson[]` | Легаси: заголовок «Понедельник, 5 окт», «＋» и список `LessonCard`. Экран «Неделя» им больше не пользуется (`DayStrip` + список выбранного дня); удалить, когда пропадёт последний потребитель |
| `IconButton.tsx` | `icon`, `label`, `onPress`, `variant?: 'light' \| 'danger' \| 'primary' \| 'ghost'`, `size?: number` | Кнопка-иконка (Feather); `label` уходит в `accessibilityLabel`. `size` — сторона квадрата, по умолчанию 44; иконка = `round(size * 0.45)` (20 при 44), радиус масштабируется от 12/22. `light` — карточка + акцент, `danger` — красная на `dangerBg`, `primary` — белая на акценте, `ghost` — прозрачный фон (тот же квадрат, для иконок внутри карточек, `WeekSwitcher`). Использовать вместо самодельных `Pressable` с иконкой |
| `DayStrip.tsx` | `weekStart: Date`, `selected: number`, `todayIndex: number`, `hasLessons: boolean[]`, `onSelect(i)` | Ряд из 7 пилюль «Пн / 5» с точкой под числом: точка `primary` — в этот день есть уроки, прозрачная — уроков нет (текст дня тогда `muted`). Сегодня — `primaryTint` + рамка, выбранный день — `primary` с белым текстом и белой точкой; `todayIndex = -1`, если сегодня не на этой неделе |
| `WeekSwitcher.tsx` | `label`, `isCurrent`, `onPrev`, `onNext`, `onToday` | Карточка-переключатель недель высотой 44: ‹ › — `IconButton variant='ghost'` (44 px, карточка без `paddingVertical`), подпись `formatWeek`; в текущей неделе — «Текущая неделя», иначе кликабельное «К текущей неделе» |
| `CopyLessonsModal.tsx` | `isOpen`, `targetWeekStart`, `sources`, `isBusy`, `onClose`, `pickSource` | Модальное окно выбора недели-источника; показывает диапазон и количество уроков; на время копирования строки неактивны и приглушены |
| `FormCard.tsx` | `children` | Белая карточка формы: радиус 18, горизонтальные поля 16, вертикальные 4 (как в шаблонах экрана урока) |
| `FormRow.tsx` | `label`, `children`, `isLast?`, `isBlock?`, `onPress?` | Строка карточки формы: подпись `muted` слева, значение справа, разделитель `hairline` кроме последней. `isBlock` — подпись сверху, значение под ней (тема). С `onPress` строка становится `Pressable` (дата, время) |
| `PickerField.tsx` | `label`, `mode: 'date' \| 'time'`, `value: Date`, `display`, `onChange`, `isLast?` | Строка `FormRow` с системным Android-пикером (`DateTimePickerAndroid.open`); на форме урока используется для даты. Экспортирует `openDateTimePicker(mode, value, onChange)` — общий хелпер для мест со своими зонами нажатия (`TimePickerModal`) |
| `TimePickerModal.tsx` | `startTime`, `endTime`, `defaultDuration`, `onApply(start, end)`, `onClose` | Нижний лист «Время урока» (макет pick-time): карточки «Начало/Конец» — нажатие открывает системный пикер времени (`openDateTimePicker`, значения хранятся строками `ЧЧ:ММ`), кнопки длительности и «Готово». При смене начала конец сдвигается на текущую длительность (или `defaultDuration`). Кнопки — `SETTING_OPTIONS.lessonDurationMinutes` плюс дефолт из настроек и фактическая длительность урока, если их нет в списке (иначе подсветить нечего); активна та, что равна `timeDiff(draftStart, draftEnd)`. Подложка появляется сразу, шторка выезжает сама (`Animated.Value` + `translateY`, `animationType='none'`), закрытие — с обратной анимацией `CLOSE_MS`. Рендерится условно (`{isTimeOpen && <TimePickerModal/>}`), поэтому черновик времени живёт в локальном состоянии |
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
| `mutedStrong` / `mutedTint` | `#5b607a` / `#e4e6f5` | заголовок и бейдж секции «Прошедшие уроки» (`LessonSectionHeader`) |
| `placeholder` | `#a9adc1` | подсказки незаполненных полей (`TextInput` на форме урока) — светлее `muted` |
| `primary` | `#4f46e5` | акцент: кнопки, активная вкладка, полоса урока, ссылки |
| `onPrimary` | `#ffffff` | текст/иконка на акцентном фоне |
| `primaryTint` / `primaryBorder` | `#eef0ff` / `#c7c9f5` | «сегодня» в `DayStrip`, фон строк в `CopyLessonsModal` |
| `divider` | `#eceef6` | разделители, border tab bar, вторичная кнопка |
| `border` | `#d8d8e2` | рамки полей ввода (`PickerField`, `TextInput`) |
| `danger` / `dangerBg` | `#dc2626` / `#fdeeee` | удаление (корзина), «Не выдано», ошибка ввода |
| `dangerBorder` / `dangerSurface` | `#f4a5a5` / `#fff5f5` | рамка и фон кнопки «Удалить урок» на форме урока |
| `dangerMuted` | `#a03535` | красная подсказка в акцентной `NowCard` |
| `warnBg` / `warnText` | `#fdf0c4` / `#92400e` | бейдж «Отменён», `BatteryHint` |
| `success` | `#498d1c` | зелёный акцент текущего урока (`NowCard`) |
| `warning` | `#cf9801` | подпись `NowCard` («Текущий / Следующий урок») |
| `info` | `#056ccc` | класс и кабинет в `NowCard` |
| `barMuted` | `#cfd2e0` | полоса отменённого урока |
| `transparent` | `transparent` | прозрачный фон `IconButton variant='ghost'` |
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
  кнопок-иконок — `IconButton`, а не новый `Pressable`. Нужен другой габарит — проп
  `size` (по умолчанию 44); иконка внутри карточки без фона — `variant='ghost'`.
- Иконки — `Feather` из `@expo/vector-icons`; `Ionicons` в проекте больше не используется.
- Вложенный `Pressable` (корзина внутри карточки урока) допустим: жест забирает внутренний.
  После правок такого места проверять на телефоне, что не срабатывают оба обработчика
  (иначе откроются и `Alert`, и форма урока).
- Цвета — только из `@/domain/theme` (`colors`).
- Скругления задавать **числом**, а не процентом: `borderRadius: '50%'` на Android
  игнорируется и элемент остаётся квадратным. Для круга — радиус, равный половине
  стороны (`DOT_SIZE / 2` в `DayStrip`).
- На Android прозрачный фон + смена его на цветной теряет `borderRadius` (RN #52415):
  вид с `backgroundColor: 'transparent'` не создаётся нативно, и при первом цветном фоне
  радиус уже не передаётся. Поэтому точка в `DayStrip` монтируется только когда есть
  уроки (высоту держит `dotSlot`), а не «перекрашивается» из прозрачной.
- Не помещать бизнес-логику в компоненты: расчёты — в `src/domain/`, данные — из стора,
  действия — из `useLessonActions`.
- Компоненты не должны импортировать `src/db/` и выполнять SQL.
