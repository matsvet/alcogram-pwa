# Alcogram Diary (PWA)

Личный офлайн-first дневник алкоголя. Данные в IndexedDB на устройстве +
опциональная синхронизация через **Supabase** (бесплатный tier) между iPhone и Android.

Живой сайт: https://matsvet.github.io/alcogram-pwa/

## Стек

- TypeScript + React + Vite + vite-plugin-pwa
- Dexie (IndexedDB)
- Supabase (Auth + Postgres), опционально

## Запуск локально

```bash
cd alcogram-pwa
cp .env.example .env.local   # если уже есть Supabase
npm install
npm run dev
```

## Облако (Supabase) – 10 минут

1. Зарегистрируйся на [supabase.com](https://supabase.com) (free).
2. **New project** → регион ближе к тебе → дождись готовности.
3. **SQL Editor** → вставь и Run файл [`supabase/schema.sql`](supabase/schema.sql).
4. **Authentication → Providers → Email**: включи Email.
   - Для личного использования удобно отключить *Confirm email*
     (Authentication → Providers → Email → Confirm email = off).
5. **Project Settings → API**:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
6. Локально положи в `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

7. **Authentication → URL Configuration**:
   - Site URL: `https://matsvet.github.io/alcogram-pwa/`
   - Redirect URLs: `https://matsvet.github.io/alcogram-pwa/**` и `http://localhost:5173/**`

8. Для GitHub Pages добавь Secrets репозитория:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`  
   (Settings → Secrets and variables → Actions)

9. В приложении: **Settings → Регистрация** (один email/пароль) → на втором
   устройстве **Вход** тем же аккаунтом → **Синхронизировать**.

### Как устроен sync

- Локально всегда IndexedDB (работает offline).
- После логина: pull + merge + push (last-write-wins по `updatedAt`).
- Запись/удаление → debounced sync (~1.2 с).
- При возврате во вкладку / online – повторный sync.
- Soft-delete: удаления доезжают на другие устройства.

`anon` key можно светить в клиенте: RLS режет доступ чужих `user_id`.
**Service role key никогда не клади в фронт.**

## Логика календаря

| Период | Нет напитков |
|--------|-------------|
| до 2023-01-01 | пустая ячейка |
| 2023-01-01 … 2026-03-31 | пустой бокал («не пил») |
| с 2026-04-01 | пустая ячейка (можно отметить «не пил» вручную) |

## Импорт CSV

Settings → Merge / Replace → файл. Seed: `public/seed/`.

## Деплой

GitHub Actions → Pages при push в `main` (см. `.github/workflows/deploy-pages.yml`).

## Приватность

Данные в твоём Supabase-проекте (EU/US – выбираешь). Аккаунт один – делись
только с собой. Репозиторий GitHub публичный: seed JSON с notes доступен по URL
сайта – имей в виду.
