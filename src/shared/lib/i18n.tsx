import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'

export type Locale = 'en' | 'ru'

const translations: Record<Locale, Record<string, string>> = {
  en: {
    calendar: 'Calendar',
    statistics: 'Statistics',
    settings: 'Settings',
    mainNavigation: 'Main navigation',
    language: 'Language',
    english: 'English',
    russian: 'Русский',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    chooseMonth: 'Choose month and year',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    chooseYear: 'Choose year',
    today: 'Today',
    noDataDay: 'No data – day is not filled in',
    markedSober: 'Marked: did not drink',
    didNotDrink: 'Did not drink',
    markSober: 'Did not drink',
    clearSober: 'Remove “did not drink” mark',
    addDrink: 'Add drink',
    drinkData: 'Drink data',
    delete: 'Delete',
    close: 'Close',
    volume: 'Volume',
    expenses: 'Expenses',
    notes: 'Notes',
    save: 'Save',
    requiredDrink: 'Enter a type and volume',
    abvNumber: 'ABV must be a number',
    priceNumber: 'Price must be a number',
    deleteDrink: 'Delete this entry?',
    month: 'Month',
    year: 'Year',
    all: 'All',
    allTime: 'All time',
    noPeriodData: 'No data for this period',
    ethanol: 'Ethanol',
    missingAbv: 'some entries have no ABV',
    spent: 'Spent',
    drinkingDays: 'Drinking days',
    drinks: 'Drinks',
    topTypes: 'Top types',
    cloud: 'Cloud (Supabase)',
    cloudDescription: 'Offline-first with sync. One account on iPhone and Android.',
    cloudNotConfigured: 'Not configured. Create a free project at',
    cloudSetup: 'run the SQL from',
    cloudBuild: 'then add these values to the build:',
    cloudLocal: 'Locally: use',
    cloudPages:
      'On GitHub Pages: Secrets + Actions. Cloud is off until configured – everything stays in IndexedDB.',
    emailPassword: 'Email and password (at least 6 characters)',
    accountCreated:
      'Account created. If email confirmation is enabled, check your inbox; otherwise you can sign in now.',
    signedIn: 'Signed in',
    signedOut: 'Signed out',
    signedInAs: 'Signed in as:',
    sync: 'Sync',
    signOut: 'Sign out',
    signIn: 'Sign in',
    signUp: 'Sign up',
    password: 'Password (at least 6)',
    createAccount: 'Create account',
    googleSignIn: 'Continue with Google',
    syncError: 'Sync error:',
    deviceData: 'Data on this device',
    recordsInDb: 'Records in database:',
    version: 'Version',
    optionalSupabase: 'IndexedDB + optional Supabase',
    importFile: 'Import file',
    importDescription:
      'CSV or JSON. When you sign in to cloud after importing, the data will be sent to the server.',
    merge: 'Merge (skip duplicates)',
    replace: 'Replace all',
    importing: 'Importing…',
    added: 'Added:',
    skipped: 'skipped:',
    invalid: 'invalid:',
    from: 'of',
    export: 'Export',
    exportCsv: 'Export CSV',
    installPwa: 'Install PWA',
    installDescription:
      'iPhone: Safari -> Share -> Add to Home Screen. Android: Chrome -> Install. Offline shell with cloud sync when online.',
    savedLocally: 'Saved on this device · waiting to sync',
    syncing: 'Syncing…',
    synced: 'Synced',
  },
  ru: {
    calendar: 'Календарь',
    statistics: 'Статистика',
    settings: 'Настройки',
    mainNavigation: 'Главная навигация',
    language: 'Язык',
    english: 'English',
    russian: 'Русский',
    previousMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    chooseMonth: 'Выбрать месяц и год',
    previousYear: 'Предыдущий год',
    nextYear: 'Следующий год',
    chooseYear: 'Выбрать год',
    today: 'Сегодня',
    noDataDay: 'Нет данных – день не заполнен',
    markedSober: 'Отмечено: не пил',
    didNotDrink: 'Не пил',
    markSober: 'Не пил',
    clearSober: 'Снять отметку «не пил»',
    addDrink: 'Добавить напиток',
    drinkData: 'Данные о напитке',
    delete: 'Удалить',
    close: 'Закрыть',
    volume: 'Объём',
    expenses: 'Расходы',
    notes: 'Заметки',
    save: 'Сохранить',
    requiredDrink: 'Укажите тип и объём',
    abvNumber: 'ABV должно быть числом',
    priceNumber: 'Цена должна быть числом',
    deleteDrink: 'Удалить запись?',
    month: 'Месяц',
    year: 'Год',
    all: 'Всё',
    allTime: 'Всё время',
    noPeriodData: 'Нет данных за период',
    ethanol: 'Этанол',
    missingAbv: 'часть записей без ABV',
    spent: 'Потрачено',
    drinkingDays: 'Дней с выпивкой',
    drinks: 'Напитков',
    topTypes: 'Топ типов',
    cloud: 'Облако (Supabase)',
    cloudDescription: 'Offline-first + синхронизация. Один аккаунт на iPhone и Android.',
    cloudNotConfigured: 'Не настроено. Создай бесплатный проект на',
    cloudSetup: 'выполни SQL из',
    cloudBuild: 'добавь в сборку:',
    cloudLocal: 'Локально: файл',
    cloudPages:
      'На GitHub Pages: Secrets + Actions. Пока облако выключено, всё хранится только в IndexedDB.',
    emailPassword: 'Email и пароль (мин. 6 символов)',
    accountCreated:
      'Аккаунт создан. Если включено подтверждение email – проверь почту, иначе можно сразу войти.',
    signedIn: 'Вход выполнен',
    signedOut: 'Выход выполнен',
    signedInAs: 'Вошёл:',
    sync: 'Синхронизировать',
    signOut: 'Выйти',
    signIn: 'Вход',
    signUp: 'Регистрация',
    password: 'Пароль (мин. 6)',
    createAccount: 'Создать аккаунт',
    googleSignIn: 'Войти через Google',
    syncError: 'Ошибка синхронизации:',
    deviceData: 'Данные на устройстве',
    recordsInDb: 'Записей в базе:',
    version: 'Версия',
    optionalSupabase: 'IndexedDB + опционально Supabase',
    importFile: 'Импорт файла',
    importDescription: 'CSV или JSON. После импорта при входе в облако данные уйдут на сервер.',
    merge: 'Объединить (пропуск дублей)',
    replace: 'Заменить всё',
    importing: 'Импорт…',
    added: 'Добавлено:',
    skipped: 'пропущено:',
    invalid: 'невалидных:',
    from: 'из',
    export: 'Экспорт',
    exportCsv: 'Экспорт CSV',
    installPwa: 'Установка PWA',
    installDescription:
      'iPhone: Safari -> Поделиться -> На экран «Домой». Android: Chrome -> Установить. Offline shell + облако при сети.',
    savedLocally: 'Сохранено на устройстве · ожидает синхронизации',
    syncing: 'Синхронизация…',
    synced: 'Синхронизировано',
  },
}

interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function initialLocale(): Locale {
  const saved = localStorage.getItem('alcogram-locale')
  if (saved === 'en' || saved === 'ru') return saved
  return navigator.language.startsWith('ru') ? 'ru' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const t = useCallback((key: string) => translations[locale][key] ?? key, [locale])

  useEffect(() => {
    localStorage.setItem('alcogram-locale', locale)
    document.documentElement.lang = locale
  }, [locale])

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used within I18nProvider')
  return value
}

export function alcoholName(alcohol: string, locale: Locale): string {
  const names: Record<string, [string, string]> = {
    Beer: ['Beer', 'Пиво'],
    'Red wine': ['Red wine', 'Красное вино'],
    'White wine': ['White wine', 'Белое вино'],
    Wine: ['Wine', 'Вино'],
    Champagne: ['Champagne', 'Шампанское'],
    Cider: ['Cider', 'Сидр'],
    Cocktail: ['Cocktail', 'Коктейль'],
    Liquor: ['Liquor', 'Ликёр'],
    Sambuca: ['Sambuca', 'Самбука'],
    Cognac: ['Cognac', 'Коньяк'],
    Whiskey: ['Whiskey', 'Виски'],
    Vodka: ['Vodka', 'Водка'],
    Rum: ['Rum', 'Ром'],
    Gin: ['Gin', 'Джин'],
    Tequila: ['Tequila', 'Текила'],
    Brandy: ['Brandy', 'Бренди'],
    Sake: ['Sake', 'Саке'],
    Other: ['Other', 'Другое'],
  }
  return names[alcohol]?.[locale === 'ru' ? 1 : 0] ?? alcohol
}
