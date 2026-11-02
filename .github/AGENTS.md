# .github — CI

`workflows/ci.yml` — единственный workflow. Запускается на `push` в `main` и на
`pull_request`, отменяет устаревшие запуски (`concurrency` + `cancel-in-progress`).

## Шаги

```yaml
- actions/checkout@v6
- actions/setup-node@v6      # Node 20, cache: npm
- npm ci
- npm run typecheck          # tsc --noEmit
- npm test -- --ci
- npm run lint               # expo lint
```

Правила:

- Использовать `npm ci`, не `npm install` (нужен `package-lock.json`; кэш npm).
- Node в CI сейчас **20**; в `PROJECT.md` когда-то планировали 22 — при изменении
  версии менять согласованно в workflow и локально. Expo SDK 57 требует современный
  Node; перед сменой проверить `package.json`/документацию Expo.
- **`expo-doctor` в CI не включать**, пока расхождение патч-версий не исправлено
  (`npx expo install --fix`): последняя проверка была 20/21, CI бы падал.
- EAS Build в CI не нужен (это шаг E, потребуется секрет `EXPO_TOKEN` и время сборки).
- Линт (`npm run lint`) уже настроен через `eslint-config-expo/flat`; не отключать.
- После добавления новых проверок локально прогонять те же команды, что в CI.
- Ветку `main` защищать требованием зелёного CI, если работа идёт через PR.

## Git и кроссплатформенность

- `.gitattributes`: `* text=auto eol=lf` — файлы в репозитории с LF, чтобы не ловить
  диффы на Windows.
- **Регистр в путях импорта** критичен: Windows прощает `@/Domain/...`, Linux падает.
  Все импорты — строго по фактическому имени файла.
- Не коммитить артефакты `.expo/`, `node_modules/`, локальные сборки (см. `.gitignore`).

## Секреты

Сейчас не требуются. Для будущего EAS/OTA (`eas build`, `eas update`) понадобится
`EXPO_TOKEN` в GitHub Secrets; не хардкодить токены в workflow.
