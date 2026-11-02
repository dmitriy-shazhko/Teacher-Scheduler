---
name: component
description: Компоненты и экраны Scheduler — именованный экспорт, пропсы-данные, useLessonActions, именованные обработчики нажатий вместо inline-колбэков, палитра, StyleSheet в конце файла, грабли React Native, шаблон компонента и правило «экран только в src/app». Использовать при любой работе с UI.
---

# Component — компоненты и экраны

## Когда применять

- Новый компонент в `src/components/`.
- Новый экран или изменение маршрута в `src/app/`.
- Правка вёрстки, стилей, палитры.
- Нужно добавить кнопку/нажатие на карточку.
- Экран читает стор, но не ясно, где брать действия.

Расчёты — скил `architecture`, данные стора — `store`, тесты — `testing`.

## Какие AGENTS.md прочитать

Пути от корня проекта.

1. `src/components/AGENTS.md` — **главный**: состав компонентов, палитра, правила RN.
2. `src/app/AGENTS.md` — маршруты, `Screen`, `useFocusEffect`, форма урока, грабли.
3. `src/AGENTS.md` — зависимости слоёв, экспорты, стили, запрет SQL в компонентах.
4. `src/hooks/AGENTS.md` — `useLessonActions` и правила хуков.
5. `src/domain/AGENTS.md` — какие расчёты уже есть и что нельзя дублировать в UI.
6. `AGENTS.md` — палитра кратко и команды.

## Пошаговый порядок

1. **Реши, это компонент или экран.**
    - Переиспользуемая карточка/модалка/поле → `src/components/`, именованный экспорт.
    - Маршрут → `src/app/`, только `export default`, файл сразу становится экраном.
2. **Проверь существующие компоненты.** Не создавай второй `LessonCard`/`Screen`;
   найди аналог и переиспользуй.
3. **Данные — пропсами.** Никакого SQL, прямых чтений БД и бизнес-логики в JSX.
   Расчёты — из `src/domain/`, данные — из стора через родителя или селектор.
4. **Действия — через `useLessonActions()`**, не колбэками через пропсы и не импортом
   `lessonsStore` ради `removeLesson`. Обработчик с аргументом сначала объявляется
   отдельной функцией (`handlePress`), а в JSX передаётся ссылка — без стрелки в теге.
5. **Экран-вкладка оборачивается в `Screen`.** Свой `paddingTop` не добавлять.
6. **Стили — `StyleSheet.create` в конце файла.** Один компонент = один файл.
7. **Проверь грабли RN** из раздела ниже.
8. **После нового маршрута перезапусти dev-сервер** (`npx expo start --dev-client -c`):
   типы маршрутов генерируются при старте.
9. Прогони typecheck/lint; UI и навигацию проверь на телефоне.

## Шаблон кода

### Компонент

```tsx
// src/components/LessonCard.tsx
import { useLessonActions } from '@/hooks/useLessonActions';
import type { Lesson } from '@/domain/types';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
    lesson: Lesson;
}

export function LessonCard({ lesson }: Props) {
    const { openLesson, confirmRemove } = useLessonActions();

    const handlePress = () => openLesson(lesson.id);
    const handleLongPress = () => confirmRemove(lesson.id);

    return (
        <Pressable
            onPress={handlePress}
            onLongPress={handleLongPress}
            style={[styles.card, lesson.cancelled && styles.cancelled]}
        >
            <Text style={[styles.time, lesson.cancelled && styles.cancelledText]}>
                {lesson.startTime}-{lesson.endTime}
            </Text>
            <Text style={[styles.main, lesson.cancelled && styles.cancelledText]}>
                {lesson.className}, кабинет {lesson.room}
            </Text>
            <Text style={lesson.cancelled && styles.cancelledText}>
                {lesson.topic || 'тема не указана'}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    cancelled: {
        backgroundColor: '#cfcfcf',
    },
    cancelledText: {
        color: '#8f8f8f',
    },
    // остальные стили...
});
```

`key` ставит родитель в `.map`, а не сам компонент.

### Обработчики действий

Действия не прячутся в JSX стрелкой — сначала именованная функция, потом ссылка на неё.
Так видно, что происходит по нажатию, и обработчик можно переиспользовать.

```tsx
// плохо: вызов спрятан в теге
<Pressable onPress={() => openLesson(lesson.id)} />

// хорошо: у действия есть имя
const handlePress = () => openLesson(lesson.id);

<Pressable onPress={handlePress} />
```

Правила:

- В JSX передаётся ссылка: `onPress={handlePress}`, `onPress={onClose}`.
- Если действию нужен аргумент, обработчик объявляется в теле компонента **до** `return`,
  рядом с данными, которые ему нужны.
- Имена — `handle` + что нажимают: `handlePress`, `handleLongPress`, `handleAddLesson`,
  `handleSelect`.
- Несколько действий в одном обработчике — тоже отдельная функция, а не цепочка
  стрелок в теге.
- В `.map` выноси элемент списка в отдельный компонент со своим обработчиком. Если без
  инлайна не обойтись — фабрика вне JSX:
  `const handlePick = (start: string) => () => pickSource(start);` →
  `onPress={handlePick(item.start)}`.
- Обёртка `() => onClose()` вокруг пропа без аргументов не нужна: `onPress={onClose}`.

### Экран

```tsx
// src/app/(tabs)/week.tsx
import { Screen } from '@/components/Screen';
import { DayCard } from '@/components/DayCard';

export default function WeekScreen() {
    // данные из стора, now — локально, расчёты — из domain
    return <Screen title='Неделя'>{/* ... */}</Screen>;
}
```

Правила для `src/app/`:

- Каждый файл (кроме `_layout.tsx`) — экран с `export default`.
- Компоненты, хуки, утилиты и тесты — **снаружи** `src/app/`.
- `useFocusEffect` требует колбэк в `useCallback`; таймеры очищать в cleanup.
- `async`-функцию нельзя передавать в `useEffect` напрямую.
- Параметры навигации — строки, `id` приводить через `Number(id)`.

## Палитра

| Назначение                         | Цвет                              |
| ---------------------------------- | --------------------------------- |
| Акцент (кнопки, ссылки, значения)  | `#4a4ae0`                         |
| Фон экранов-вкладок                | `#f4f4f8`                         |
| Заголовки/основной текст           | `#1c1c28`                         |
| Вторичный серый                    | `#888`, `#6b6b7a`                 |
| Класс в карточке урока             | `#056ccc`                         |
| Отменённый урок                    | фон `#cfcfcf`, текст `#8f8f8f`    |
| Ошибка / «Не выдано»               | `#c0392b`                         |
| Предупреждение                     | `#fff4e0` / `#7a4b00`             |
| `NowCard`: подпись / accent / hint | `#cf9801` / `#498d1c` / `#a03535` |

Цвета-константы (например, `COLOR_DANGER`) живут в `src/domain/constants.ts`, а не
размазаны по компонентам. Полная таблица и поведение компонентов —
`src/components/AGENTS.md`.

## Грабли React Native

- **Цвет текста не наследуется.** Красить каждый `<Text>`; исключение — `<Text>`
  внутри `<Text>`.
- **Любой текст — внутри `<Text>`.** Нельзя оставлять числа/`;` между JSX-элементами.
  `{x && <Comp/>}` при `x === 0` рисует `0` и падает — сравнивай явно.
- **`Modal`:** подложка (`StyleSheet.absoluteFill`) и окно — соседние элементы, не
  вложенные. Обязателен `onRequestClose` для кнопки «Назад» на Android.
- **Не вкладывать вертикальные списки** друг в друга. Для секций — `SectionList` или
  `ListHeaderComponent`/`ListFooterComponent`.
- **`key`** — на элементе в массиве у родителя.
- **`Screen`** даёт заголовок и safe-area; свой `paddingTop` на вкладках не добавлять.
- **Нажатия** — `Pressable`; мелкие кнопки — с `hitSlop`.
- **Обработчик — именованная функция.** `onPress={handlePress}`, а не
  `onPress={() => openLesson(lesson.id)}`: в теге видно только имя действия.
- **Бизнес-логика** — не в компоненте: расчёты в `domain`, данные из стора, действия
  из `useLessonActions`.
- **Компоненты не импортируют `src/db/`** и не выполняют SQL.

## Чек-лист перед завершением

- [ ] Компонент в `src/components/` с именованным экспортом; экран в `src/app/` с
      `default export`.
- [ ] Один компонент = один файл, стили `StyleSheet.create` в конце.
- [ ] Пропсами приходят только данные; действия — из `useLessonActions`.
- [ ] В JSX переданы именованные обработчики (`onPress={handlePress}`), без стрелок с
      вызовом действия.
- [ ] Нет SQL, прямого стора «ради действий» и бизнес-логики в JSX.
- [ ] Цвета из палитры; каждый `<Text>` имеет свой цвет/стиль.
- [ ] Нет вложенных вертикальных списков и `0` вне `<Text>`.
- [ ] `Modal` имеет `onRequestClose`, подложка и окно не вложены.
- [ ] Вкладка использует `Screen`, без собственного `paddingTop`.
- [ ] После нового маршрута dev-сервер перезапущен с `-c`.
- [ ] UI проверен на Android-телефоне, если затронуты навигация/нативные элементы.

## Команды проверки

```bash
npm run typecheck
npm run lint
npm test

# после нового экрана/маршрута — перезапуск с очисткой кэша
npx expo start --dev-client -c
```

## Типичные ошибки

- **Компонент или тест в `src/app/`.** Файл станет маршрутом.
- **`default export` у компонента.** Нарушает стиль; только экраны.
- **Колбэки через пропсы.** Используй `useLessonActions`.
- **Стрелка с действием прямо в теге** (`onPress={() => openLesson(id)}`). Вынеси в
  `handlePress` и передай ссылку.
- **Импорт `lessonsStore` ради `removeLesson`.** Действие уже инкапсулировано в хуке.
- **Свой `paddingTop` на вкладке.** Заголовок съедет под вырез.
- **Цвет только на контейнере.** В RN текст не наследует цвет.
- **`{count && <Text>}` при `count = 0`.** Нарисует `0` вне `<Text>` и упадёт.
- **Вложенные `FlatList`.** Ломают прокрутку; используй `SectionList`.
- **`Modal` с окном внутри подложки.** Нажатие на окно закрывает его.
- **`useFocusEffect` без `useCallback`.** Бесконечный цикл.
- **Забыть перезапустить Expo после маршрута.** Типы маршрутов не обновятся.
