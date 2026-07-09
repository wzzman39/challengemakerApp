export const LANGS = ["ru", "en", "de"];

export const LOCALE_MAP = { ru: "ru-RU", en: "en-GB", de: "de-DE" };

export const STAT_NAMES = {
  ru: { STR: "Сила", INT: "Интеллект", ART: "Творчество", CHR: "Харизма", DEX: "Дисциплина" },
  en: { STR: "Strength", INT: "Intelligence", ART: "Creativity", CHR: "Charisma", DEX: "Discipline" },
  de: { STR: "Stärke", INT: "Intelligenz", ART: "Kreativität", CHR: "Charisma", DEX: "Disziplin" },
};

export const STRINGS = {
  ru: {
    auth_email: "email",
    auth_password: "пароль (мин. 6 симв.)",
    auth_signin: "Войти",
    auth_signup: "Создать аккаунт",
    auth_confirm_email: "Проверь почту — Supabase прислал письмо для подтверждения. После подтверждения зайди через 'Войти'.",
    auth_switch_to_signup: "Нет аккаунта? Создать",
    auth_switch_to_signin: "Уже есть аккаунт? Войти",
    checking_session: "Проверка сессии...",
    loading_data: "Загрузка данных...",
    load_error: "Ошибка загрузки:",
    sign_out: "Выйти",

    lvl_short: "Ур.",
    panel_level: "УРОВЕНЬ",
    panel_chaos: "CHAOS",
    chaos_stable: "Ритм стабилен",
    chaos_shaky: "Система шатается",
    chaos_chaotic: "Расползается",
    panel_active_challenge: "АКТИВНЫЙ ЧЕЛЛЕНДЖ",
    no_active_challenge: "Нет активного челленджа",
    panel_today_quests: "ЗАДАЧИ НА СЕГОДНЯ",
    all_done: "Всё закрыто",
    until: "до",

    new_quest: "Новый квест",
    title_placeholder: "Название",
    form_exp: "EXP",
    form_chaos: "CHAOS",
    form_interval_days: "раз в, дн",
    form_due_days: "срок, дн",
    form_add: "Добавить",
    form_cancel: "Отмена",
    available_today: "доступен сегодня",
    next_cycle: "след. цикл",
    q_complete: "Выполнено",
    q_fail: "Провалено",
    q_postpone: "Отложить",
    on_fail_prefix: "при провале",
    interval_suffix: "дн.",
    status_pending: "pending",
    status_completed: "completed",
    status_failed: "failed",
    status_postponed: "postponed",
    confirm_delete_quest: (title) => `Удалить квест «${title}»?`,

    new_challenge: "Новый челлендж",
    current: "ТЕКУЩИЙ",
    reward_label: "Награда:",
    penalty_label: "Штраф:",
    due_label: "Срок:",
    already_postponed: "уже откладывался",
    no_active_queue: "Нет активного челленджа — очередь пуста",
    queue_label: "В ОЧЕРЕДИ",
    confirm_delete_challenge: (title) => `Удалить челлендж «${title}»?`,

    history_empty: "История пуста",

    toast_postponed: "отложено на 1 день",
    toast_fail: "провал",
    toast_added_quest: "Добавлен квест:",
    toast_added_challenge: "Добавлен челлендж:",
    toast_save_error: "Не сохранилось:",
  },

  en: {
    auth_email: "email",
    auth_password: "password (min. 6 chars)",
    auth_signin: "Sign in",
    auth_signup: "Create account",
    auth_confirm_email: "Check your inbox — Supabase sent a confirmation email. After confirming, sign in.",
    auth_switch_to_signup: "No account? Sign up",
    auth_switch_to_signin: "Already have an account? Sign in",
    checking_session: "Checking session...",
    loading_data: "Loading data...",
    load_error: "Load error:",
    sign_out: "Sign out",

    lvl_short: "Lvl.",
    panel_level: "LEVEL",
    panel_chaos: "CHAOS",
    chaos_stable: "Rhythm stable",
    chaos_shaky: "System wobbling",
    chaos_chaotic: "Falling apart",
    panel_active_challenge: "ACTIVE CHALLENGE",
    no_active_challenge: "No active challenge",
    panel_today_quests: "QUESTS TODAY",
    all_done: "All clear",
    until: "until",

    new_quest: "New quest",
    title_placeholder: "Title",
    form_exp: "EXP",
    form_chaos: "CHAOS",
    form_interval_days: "every, days",
    form_due_days: "due in, days",
    form_add: "Add",
    form_cancel: "Cancel",
    available_today: "available today",
    next_cycle: "next cycle",
    q_complete: "Done",
    q_fail: "Failed",
    q_postpone: "Postpone",
    on_fail_prefix: "on fail",
    interval_suffix: "d.",
    status_pending: "pending",
    status_completed: "completed",
    status_failed: "failed",
    status_postponed: "postponed",
    confirm_delete_quest: (title) => `Delete quest "${title}"?`,

    new_challenge: "New challenge",
    current: "CURRENT",
    reward_label: "Reward:",
    penalty_label: "Penalty:",
    due_label: "Due:",
    already_postponed: "already postponed",
    no_active_queue: "No active challenge — queue is empty",
    queue_label: "QUEUE",
    confirm_delete_challenge: (title) => `Delete challenge "${title}"?`,

    history_empty: "No history yet",

    toast_postponed: "postponed by 1 day",
    toast_fail: "failed",
    toast_added_quest: "Quest added:",
    toast_added_challenge: "Challenge added:",
    toast_save_error: "Save failed:",
  },

  de: {
    auth_email: "E-Mail",
    auth_password: "Passwort (min. 6 Zeichen)",
    auth_signin: "Anmelden",
    auth_signup: "Konto erstellen",
    auth_confirm_email: "Prüfe deine E-Mails — Supabase hat eine Bestätigung geschickt. Danach einfach anmelden.",
    auth_switch_to_signup: "Kein Konto? Registrieren",
    auth_switch_to_signin: "Schon ein Konto? Anmelden",
    checking_session: "Sitzung wird geprüft...",
    loading_data: "Daten werden geladen...",
    load_error: "Ladefehler:",
    sign_out: "Abmelden",

    lvl_short: "Lvl.",
    panel_level: "LEVEL",
    panel_chaos: "CHAOS",
    chaos_stable: "Rhythmus stabil",
    chaos_shaky: "System wackelt",
    chaos_chaotic: "Gerät außer Kontrolle",
    panel_active_challenge: "AKTIVE CHALLENGE",
    no_active_challenge: "Keine aktive Challenge",
    panel_today_quests: "QUESTS HEUTE",
    all_done: "Alles erledigt",
    until: "bis",

    new_quest: "Neue Quest",
    title_placeholder: "Titel",
    form_exp: "EXP",
    form_chaos: "CHAOS",
    form_interval_days: "alle, Tage",
    form_due_days: "Frist, Tage",
    form_add: "Hinzufügen",
    form_cancel: "Abbrechen",
    available_today: "heute verfügbar",
    next_cycle: "nächster Zyklus",
    q_complete: "Erledigt",
    q_fail: "Fehlgeschlagen",
    q_postpone: "Verschieben",
    on_fail_prefix: "bei Fehlschlag",
    interval_suffix: "Tg.",
    status_pending: "offen",
    status_completed: "erledigt",
    status_failed: "gescheitert",
    status_postponed: "verschoben",
    confirm_delete_quest: (title) => `Quest „${title}" löschen?`,

    new_challenge: "Neue Challenge",
    current: "AKTUELL",
    reward_label: "Belohnung:",
    penalty_label: "Strafe:",
    due_label: "Frist:",
    already_postponed: "bereits verschoben",
    no_active_queue: "Keine aktive Challenge — Warteschlange leer",
    queue_label: "WARTESCHLANGE",
    confirm_delete_challenge: (title) => `Challenge „${title}" löschen?`,

    history_empty: "Noch keine Historie",

    toast_postponed: "um 1 Tag verschoben",
    toast_fail: "gescheitert",
    toast_added_quest: "Quest hinzugefügt:",
    toast_added_challenge: "Challenge hinzugefügt:",
    toast_save_error: "Speichern fehlgeschlagen:",
  },
};

export function getInitialLang() {
  try {
    const saved = localStorage.getItem("cm_lang");
    if (saved && LANGS.includes(saved)) return saved;
  } catch {
    /* localStorage недоступен — молча пропускаем */
  }
  const nav = (navigator.language || "ru").slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : "ru";
}

export function saveLang(lang) {
  try {
    localStorage.setItem("cm_lang", lang);
  } catch {
    /* игнор — не критично, просто не запомнится выбор */
  }
}

/* t(key) -> строка; t(key, arg) -> вызов функции-шаблона (напр. confirm_delete_quest) */
export function makeT(lang) {
  const dict = STRINGS[lang] || STRINGS.ru;
  return (key, arg) => {
    const entry = dict[key] ?? STRINGS.ru[key] ?? key;
    return typeof entry === "function" ? entry(arg) : entry;
  };
}

export function statName(lang, key) {
  return (STAT_NAMES[lang] || STAT_NAMES.ru)[key] || key;
}
