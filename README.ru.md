[English](README.md) | **Русский**

# agent_base

Общие инструкции и рабочие процедуры для Flutter/Dart-проектов с Clean Architecture,
MVVM, getIt/injectable и ValueNotifier. Claude Code и Codex используют одни
инженерные правила и четыре skills, с отдельными адаптерами клиентов. Версия **0.2.0**.

## Содержимое (Contents)

```text
agent_base/
├── .claude/CLAUDE.md     # Imports maintainer instructions
├── .claude-plugin/       # Claude manifest and legacy marketplace identity
├── .codex-plugin/        # Codex manifest
├── .agents/plugins/      # Codex marketplace
├── instructions/         # Shared rules and task routing
├── skills/               # Four shared workflows
├── adapters/             # Client instructions and hook wiring
├── scripts/              # Portable notifier and package validation
├── templates/            # Application entrypoints and context template
├── test/                 # Offline notification tests
├── AGENTS.md             # Instructions for maintaining this package
└── CHANGELOG.md          # Package releases
```

Корень репозитория одновременно является корнем плагина. Установленные skills
читают общие `instructions/` внутри своего пакета; отдельный внешний clone им
не требуется. `AGENTS.md` и `.claude/CLAUDE.md` задают правила разработки
этого пакета, а не приложений, которые его подключают.

Названия проектов, файлы Figma, адреса API, история деплоя, секреты и личные
разрешения остаются в проекте приложения или закрытых локальных настройках.

## Инструкции проекта (Project instructions)

Инструкции и установленный плагин — **два независимых подключения**.
Стартовые файлы приложения загружают общие правила; плагин предоставляет skills
и hooks. Установка плагина сама по себе не делает правила общими для приложения.

Выберите способ доставки общих инструкций:

- **Встроенный subtree:** самодостаточный checkout приложения с закреплённым
  выпуском. Выполнить из корня приложения после публикации тега:

```bash
git subtree add --prefix .agents/base \
  https://github.com/AlexSeednov/agent_base.git v0.2.0 --squash
```

- **Локальный clone исходников:** один checkout на машину для нескольких проектов:

```bash
git clone https://github.com/AlexSeednov/agent_base.git ~/Projects/Packages/agent_base
```

Для subtree в `.agents/base/` объедините [templates/AGENTS.md](templates/AGENTS.md)
с `AGENTS.md` приложения, а [templates/CLAUDE.md](templates/CLAUDE.md) — с его
`CLAUDE.md`. Создайте `.agents/project.md` на основе
[templates/project.md](templates/project.md). Существующие стартовые файлы
объединяйте, сохраняя проектные правила. Используйте стартовый файл только
для тех клиентов, с которыми действительно работаете.

При локальном clone или существующем subtree `.claude/base/` измените в шаблонах
только пути к общей базе. Для Codex укажите фактический абсолютный путь к clone,
для Claude — импорт `@~/Projects/Packages/agent_base/...`. Пути к проектному
контексту остаются относительно корня приложения.

[instructions/entrypoint.md](instructions/entrypoint.md) требует сначала прочитать
Global rules и Architecture, затем направляет задачи Dart, тестов, Figma, web и
пакетов к подробным материалам. Проектные исключения имеют приоритет над общими
соглашениями. Длинные списки и история решений живут в документах по задачам.

Личные предпочтения можно хранить в игнорируемом `.agents/local.md`: шаблоны
явно требуют прочитать его при наличии. Claude также поддерживает `CLAUDE.local.md`.
`AGENTS.override.md` заменяет стартовый файл своего каталога, а не дополняет его
локальными предпочтениями. Объём автоматически загружаемых инструкций Codex
держите ниже стандартного лимита обнаружения в 32 КиБ. После изменения стартовых
файлов начните новую сессию.

## Claude Code

Marketplace сохраняет имя **`claude-base`**, плагин —
**`flutter-base@claude-base`**, чтобы переименование репозитория не меняло
существующие идентификаторы. Установка с нуля:

```text
/plugin marketplace add https://github.com/AlexSeednov/agent_base.git
/plugin install flutter-base@claude-base
```

Чтобы рекомендовать и включить его в `.claude/settings.json` приложения, добавьте:

```json
{
  "extraKnownMarketplaces": {
    "claude-base": {
      "source": {
        "source": "github",
        "repo": "AlexSeednov/agent_base"
      }
    }
  },
  "enabledPlugins": {
    "flutter-base@claude-base": true
  }
}
```

Manifest Claude выбирает [adapters/claude/hooks.json](adapters/claude/hooks.json).
Инструкции о контексте и инструментах этого клиента находятся в
[adapters/claude/instructions.md](adapters/claude/instructions.md).

## Codex

Marketplace Codex называется **`agent-base`** и предоставляет тот же плагин
`flutter-base`. В актуальном локальном Codex CLI:

```bash
codex plugin marketplace add AlexSeednov/agent_base --ref v0.2.0
codex plugin add flutter-base@agent-base
```

Браузер плагинов desktop-клиента также может использовать marketplace репозитория
из `.agents/plugins/marketplace.json`. Там, где это поддерживается, установите
плагин из этого источника и добавьте в `.codex/config.toml` доверенного приложения:

```toml
[plugins."flutter-base@agent-base"]
enabled = true
```

Установленный плагин читается из кэша: правка исходного clone не обновляет
установленную копию в реальном времени. После установки или обновления начните
новую сессию. Просмотрите и подтвердите доверие к hooks в поддерживающем локальном
клиенте: включение плагина само по себе не даёт этого доверия. Эти локальные
скрипты не выполняются в Work с облачной оркестрацией.

Manifest Codex выбирает [adapters/codex/hooks.json](adapters/codex/hooks.json).
Настройки, обнаружение инструментов и локальные предпочтения описаны в
[adapters/codex/instructions.md](adapters/codex/instructions.md). Версии клиентов
различаются; если приведённой CLI-команды нет, используйте браузер плагинов.

## Skills и правила тестирования (Skills and testing rules)

| Skill | Когда использовать |
| --- | --- |
| `dart-add-unit-test` | Изолированная бизнес-логика и регрессионные тесты |
| `flutter-add-widget-test` | Отрисовка виджетов, темы, локализация, взаимодействия |
| `flutter-add-integration-test` | Полные сценарии с настоящим запуском приложения |
| `flutter-refactor-audit` | Анализ существующего feature/layer/slice без правок |

Skills явно читают общие материалы и учитывают контекст приложения.
Они не предполагают наличие flavors, устройств, MCP или конкретного API темы.

`package:checks`, test doubles/изоляция DI и coverage стали общими
[правилами тестирования](instructions/testing.md), без отдельных skills.
Стартовый файл направляет туда и запросы coverage или test doubles. Полезные
правила для fakes, assertions и покрытия сохранены без трёх пересекающихся skills.

## Необязательные уведомления Telegram (Optional Telegram notifications)

Нужен **Node.js 20+**, без npm-зависимостей, jq, curl, Bash-скриптов и
PowerShell-скриптов. Оба адаптера вызывают [scripts/telegram.js](scripts/telegram.js).
Самому клиенту по-прежнему нужна его штатная поддерживаемая среда command hooks.

Передайте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` через окружение процесса
клиента или закрытые локальные настройки. Без любой из этих переменных
уведомления и кэширование запроса выключены. Пакет не устанавливает секреты и
не меняет глобальные настройки. Файлы с секретами не должны попадать в Git.

Имя проекта определяется по `AGENT_PROJECT_NAME`, прежнему `CLAUDE_PROJECT_NAME`,
`name:` из `pubspec.yaml`, затем по имени рабочего каталога. Примеры:

```text
✅ Codex: Example — Add board undo
✅ Claude: Example — Add board undo
❓ Codex: Example — Question
⚠️ Claude: Example — Approval required
```

| Событие | Поведение |
| --- | --- |
| `UserPromptSubmit` | Сохранить первую непустую строку первого запроса, до 100 Unicode code points |
| `PreToolUse` | Уведомить о вопросе через инструмент клиента, если он проходит через локальный hook |
| `PermissionRequest` | Уведомить о настоящем ожидании разрешения, без текста команды |
| `Stop` | Уведомить при событии Stop клиента, в том числе после продолжения ответа |
| `SessionEnd` | Удалить сохранённое название сессии |

Названия хранятся во временном каталоге ОС пользователя, отдельно для каждого
клиента, сессии и рабочего каталога. Скрипт не разбирает transcripts и не хранит
запросы целиком. При нормальном завершении сессии название удаляется; после
прерывания клиента короткая временная запись может остаться до очистки ОС или
пользователем. Если названия нет, завершение сообщает `done`. Telegram получает
превью названия в уведомлении о завершении; не задавайте секреты, если уведомления
не нужны.

У транспорта общий тайм-аут пять секунд. Неверный ввод или ошибка доставки
не блокируют агента; диагностика не содержит payload и URL с секретом. Hooks
никогда не разрешают и не запрещают действия. Уведомления о разрешении не будет,
если клиент его не запрашивает; неподдерживаемые интерфейсы вопросов локальный
tool hook обнаружить не может.

## Разрешения и MCP (Permissions and MCP)

Разрешения задаются отдельно для клиента и проекта. Общие правила Git разрешают
только чтение, но не настраивают sandbox. Пакет не копирует `bypassPermissions`,
не отключает запросы разрешений и не даёт доступ к соседним проектам. Нужный
доступ выбирается при настройке каждого приложения.

Claude использует свои JSON-настройки и конфигурацию MCP. Codex использует
доверенный `.codex/config.toml` или закрытые пользовательские настройки; локальные
MCP-серверы задаются в `mcp_servers`. Передавайте имена переменных окружения с
секретами или храните значения в закрытых настройках. Не коммитьте токены вместе
с переносимыми примерами.

Правила Figma [общие](instructions/figma.md); подключение и имена инструментов
зависят от клиента. Отдельно проверяйте чтение/экспорт и запись. Изменение макета
завершено, когда оно внесено и проверено в настоящем файле Figma.

## Миграция с 0.1.x (Migration from 0.1.x)

Версия 0.2.0 меняет структуру пакета и загрузку стартового контекста. Переносите
приложение отдельным шагом, а не только обновлением версии плагина:

1. Обновите checkout/subtree инструкций из `AlexSeednov/agent_base`; при желании
   сохраните существующий префикс `.claude/base/`.
2. Объедините подходящие стартовые шаблоны; оставьте прежний путь к проектному
   контексту, если перенос не нужен. Добавьте entrypoint и адаптер клиента.
3. Обновите marketplace/плагин. Его корень переехал из `plugin/` в корень
   репозитория; идентификаторы Claude сохранены. Зарегистрированный marketplace
   может хранить прежний URL; обновите его источник в клиенте.
4. Уберите ссылки на `dart-checks-assertions`, `dart-collect-coverage` и
   `flutter-test-doubles`: их содержимое в `instructions/testing.md`.
5. Замените вызовы старого dispatcher и shell/PowerShell-скриптов новыми
   adapter hooks. Новые настройки также уведомляют о настоящих запросах разрешения.
6. Используйте прежние закрытые переменные Telegram; при желании переименуйте
   `CLAUDE_PROJECT_NAME` в `AGENT_PROJECT_NAME` и проверьте hooks в самом клиенте.
7. Начните новую сессию и проверьте, какие инструкции, skills и инструменты активны.

Настройки приложений и пользователя автоматически не переносятся.
Опубликованные теги 0.1.x сохраняют прежнее содержимое. Исторические заметки
о выпусках не переписываются, даже если упоминают прежнее название репозитория.

## Обновление (Updating)

Обновляйте marketplace и плагин Claude отдельно от проектных инструкций:

```text
/plugin marketplace update claude-base
/plugin update flutter-base@claude-base
```

Обновите marketplace Codex, затем обновите/переустановите плагин в браузере
плагинов клиента. Если источник закреплён, сначала выберите новый release ref:

```bash
codex plugin marketplace upgrade agent-base
```

Для subtree используйте его фактический префикс и целевой тег выпуска. Пример
нацелен на 0.2.0; при следующем обновлении выберите следующий тег:

```bash
GIT_MERGE_AUTOEDIT=no git subtree pull --prefix .agents/base \
  https://github.com/AlexSeednov/agent_base.git v0.2.0 --squash -m "Agent Base v0.2.0"
```

При доставке через локальный clone пользователь делает pull или выбирает нужный
тег в этом clone. Это сразу влияет на все проекты, читающие его файлы. Агент
предоставляет команды записи Git, выполняет их пользователь. Перезапустите сессию.

## Версии и проверка (Versioning and validation)

Используйте одну версию выпуска в `.claude-plugin/plugin.json` и
`.codex-plugin/plugin.json`, английскую запись в `CHANGELOG.md` и соответствующий
тег `vMAJOR.MINOR.PATCH`. До 1.0 minor-выпуск может менять структуру или правила
несовместимым образом. Стабильные идентификаторы плагина/marketplace отделены от
названия репозитория. Коммиты, push и теги выполняет пользователь.

Синхронизируйте `README.md` и `README.ru.md`, включая одинаковые блоки кода.
Выполните из корня пакета:

```bash
node scripts/validate.js
node --test test/*.test.js
```

Проверяются manifests, пути, ссылки, версии, hooks, метаданные skills и совпадение
блоков кода README. Тесты проверяют уведомления с подставным транспортом и в
изолированных временных каталогах; настоящих сообщений они не отправляют.
Если установлен Claude Code, также выполните `claude plugin validate .`.
Нативную установку, доверие к hooks, доступные инструменты и доставку нужно
проверить в целевом клиенте после настройки.

Источники: [упаковка плагинов OpenAI](https://developers.openai.com/plugins/build/plugins),
[инструкции Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[hooks Codex](https://learn.chatgpt.com/docs/hooks),
[справочник плагинов Claude](https://code.claude.com/docs/en/plugins-reference),
[hooks Claude](https://code.claude.com/docs/en/hooks).
