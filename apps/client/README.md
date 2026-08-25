# client

Web клієнт D.Church CRM — Vite + React 19 + TanStack Router (file-based) + TanStack Query.

## Запуск

```bash
pnpm --filter client dev      # http://localhost:3001
```

API очікується на `VITE_API_URL` (типово `http://localhost:3000`). Скопіюйте `.env.sample` у `.env`.

Разом з API: `pnpm dev` у корені репозиторію.

## Скрипти

| Скрипт      | Що робить                              |
| ----------- | -------------------------------------- |
| `dev`       | Vite dev-сервер на порту 3001          |
| `build`     | `tsc -b` + production-збірка у `dist/` |
| `preview`   | Локальний перегляд production-збірки   |
| `lint`      | ESLint з `--fix`                       |
| `typecheck` | Перевірка типів без емісії             |

## Структура

```
src/
  routes/            # File-based маршрути TanStack Router
    __root.tsx       # Корінь: Toaster, devtools, 404 та error-екрани
    login.tsx        # Гість: вхід (з ?redirect=)
    register.tsx     # Гість: реєстрація
    _app.tsx         # Layout під захистом: гвард + AppShell
    _app/
      index.tsx      # `/` → редірект на /people
      people/        # Список людей і картка людини
  services/          # Транспорт до API (axios)
    abstracts/       # ApiService (інтерсептори, refresh), RestService, TokenStorage
  modules/           # Фічі: queryOptions, хуки і компоненти екрана (auth, people)
  components/
    ui/              # shadcn-компоненти (Tailwind v4 + Radix)
    layout/          # AppShell, sidebar, mobile nav, user menu
  lib/               # cn, форматування, обробка помилок API, sanitize redirect
  routeTree.gen.ts   # Генерується плагіном роутера — не редагувати
```

## Дві різні сутності

- **User** — акаунт персоналу для входу в панель (`/auth/*`, `/user/*`). Має пароль і роль.
- **Person** — людина, відома церкві (`/people`). Пароля не має, натомість має статус
  (`GUEST` / `NEW` / `MEMBER` / `SERVANT` / `INACTIVE`), контакти, місто, малу групу, служіння,
  дату останньої зустрічі та нотатки.

Розділ «Люди» показує саме `Person`. Мітки статусів і кольори бейджів — у
`src/modules/people/status.ts`, логіка фільтрів і сортування — у `src/modules/people/filtering.ts`.

## Як це працює

- **Маршрути** генеруються з `src/routes` плагіном `@tanstack/router-plugin` (з `autoCodeSplitting`).
  `routeTree.gen.ts` перегенеровується на `dev`/`build`.
- **Гвард** у `_app.tsx`: `beforeLoad` робить `ensureQueryData(meQueryOptions())`. Якщо користувача
  немає — редірект на `/login?redirect=<поточний шлях>`. Сам користувач повертається у контекст
  маршруту, тож дочірні сторінки беруть його через `Route.useRouteContext()` без додаткового запиту.
- **Токени** у `localStorage`; `ApiService` додає `Authorization` і на 401 один раз пробує
  `POST /auth/refresh` (single-flight — паралельні 401 чекають один запит). Якщо refresh не
  вдався — сесія скидається і роутер веде на `/login`.
- **Сервер-стан** — лише TanStack Query. Loader'и маршрутів прогрівають той самий кеш
  (`defaultPreloadStaleTime: 0`), тому дані не дублюються.
- **Фільтри** списку людей — клієнтські: пошук, мала група, служіння, статус, сортування.
  Коли база виросте, їх варто перенести на сервер (в API вже є `SearchPipe` і `PagePipe` під це).
- **Вигляд** зібраний за макетом «Люди — CRM v3» з Claude Design: тепле паперове тло, темний
  сайдбар, глибокий зелений як єдиний акцент, Poppins 300/400. Токени — у `src/styles/globals.css`.
- **Форми** — react-hook-form + zod; ліміти валідації дзеркалять DTO API.
- **UI** — Tailwind CSS v4 + shadcn-компоненти, перефарбовані під макет. Тема одна — світла.
