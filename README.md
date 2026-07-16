# Alcogram Diary (PWA)

Личный офлайн-first дневник алкоголя в духе [Alcogram](https://play.google.com/store/apps/details?id=com.kursx.booze).  
Данные только на устройстве (IndexedDB). Без бэкенда и аккаунтов.

## Стек

- TypeScript + React + Vite
- Dexie (IndexedDB)
- vite-plugin-pwa (manifest + service worker)

## Запуск локально

```bash
cd alcogram-pwa
NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm install
NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm run dev
```

Сборка:

```bash
NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm run build
NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm run preview
```

> Если в `~/.npmrc` указан корпоративный Nexus, для публичных пакетов используй `NPM_CONFIG_REGISTRY=https://registry.npmjs.org`.

## Импорт данных Alcogram

1. Открой **Settings**
2. Выбери режим:
   - **Merge** – пропуск дублей по ключу `date + drink_index + alcohol + amount + abv + price + notes`
   - **Replace all** – полная замена базы
3. Загрузи `.csv` или `.json` (массив объектов с теми же полями)

Пример sample: `public/sample-data/alcogram_sample.csv`

Поля CSV:

| Поле | Смысл |
|------|--------|
| `calendar_date` | YYYY-MM-DD |
| `drink_index` | номер карточки в дне (1..N) |
| `alcohol` | тип |
| `amount` / `unit` | объём |
| `abv` | крепость % |
| `price` / `currency` | цена |
| `notes` | заметка |

Один день может содержать несколько строк (разный `drink_index`).

## Экраны

- **Calendar** – месяц, иконки напитков на днях
- **Day** – карточки напитков + ADD DRINK
- **Drink form** – тип, объём, ABV, цена, notes, save/delete
- **Statistics** – этанол, деньги, дни, топ типов
- **Settings** – импорт/экспорт/очистка

## PWA / установка

- **iPhone**: Safari → Поделиться → На экран «Домой»
- **Android**: Chrome → Установить приложение / Добавить на главный экран

После первого визита shell кешируется service worker’ом; данные локальные.

## Деплой (бесплатно)

### Cloudflare Pages

```bash
npm run build
# upload dist/  или connect Git repo, build command: npm run build, output: dist
```

### Vercel / Netlify

- Build: `npm run build`
- Output: `dist`
- HTTPS из коробки

## Приватность

Нет облака, нет аналитики, нет аккаунтов. Бэкап – экспорт CSV из Settings.
