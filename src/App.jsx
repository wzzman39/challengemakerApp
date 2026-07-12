import React, { useState, useEffect, useCallback } from "react";
import {
  Home as HomeIcon,
  ListChecks,
  Swords,
  BarChart3,
  History as HistoryIcon,
  Check,
  X,
  Clock,
  Flame,
  Plus,
  Trash2,
  LogOut,
  Download,
  Settings,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import {
  loadState,
  persistPlayer,
  persistStat,
  persistQuest,
  persistChallenge,
  insertHistoryRow,
  insertQuestRow,
  insertChallengeRow,
  deleteQuestRow,
  deleteChallengeRow,
} from "./lib/db";
import {
  STAT_META,
  STAT_KEYS,
  CHAOS_ON_QUEST_COMPLETE,
  CHAOS_ON_CHALLENGE_COMPLETE,
  LEVEL_UP_INCREMENT,
} from "./lib/constants";
import { todayISO, addDays, clamp, fmtDate, isDue, uid, grantExp } from "./lib/utils";
import { LANGS, LOCALE_MAP, getInitialLang, saveLang, makeT, statName } from "./lib/i18n";
import { pickRandomTemplate } from "./lib/challengeTemplates";
import { THEMES, getInitialTheme, saveTheme } from "./lib/theme";

/* ============================================================
   ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА
   ============================================================ */
function LangSwitch({ lang, onChange }) {
  return (
    <div className="cm-lang-switch">
      {LANGS.map((l) => (
        <button
          key={l}
          className={"cm-lang-btn" + (lang === l ? " cm-lang-btn-active" : "")}
          onClick={() => onChange(l)}
          type="button"
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   AUTH GATE
   ============================================================ */
function AuthGate({ onAuthed, lang, setLang, t, theme, setTheme }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setMsg(t("auth_confirm_email"));
        } else {
          onAuthed(data.session.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthed(data.user);
      }
    } catch (err) {
      setMsg(err.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cm-root cm-auth" data-theme={theme}>
      <div className="cm-header">
        <div className="cm-header-title-row">
          <div className="cm-header-title">
            CHALLENGE<span>MAKER</span>
          </div>
          <button className="cm-icon-btn" title={t("settings")} onClick={() => setSettingsOpen(true)}>
            <Settings size={16} />
          </button>
        </div>
      </div>
      <form className="cm-auth-form" onSubmit={submit}>
        <input
          className="cm-input"
          type="email"
          placeholder={t("auth_email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="cm-input"
          type="password"
          placeholder={t("auth_password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button className="cm-btn cm-btn-ok cm-auth-submit" disabled={busy} type="submit">
          {mode === "signin" ? t("auth_signin") : t("auth_signup")}
        </button>
        {msg && <div className="cm-auth-msg">{msg}</div>}
        <button
          type="button"
          className="cm-auth-switch"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? t("auth_switch_to_signup") : t("auth_switch_to_signin")}
        </button>
      </form>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={t}
      />
    </div>
  );
}

function SettingsSheet({ open, onClose, theme, setTheme, lang, setLang, t, installPrompt, triggerInstall, signOut }) {
  if (!open) return null;
  return (
    <div className="cm-modal-backdrop" onClick={onClose}>
      <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cm-modal-close" onClick={onClose} aria-label={t("form_cancel")}>
          <X size={16} />
        </button>
        <div className="cm-modal-title">{t("settings")}</div>

        <div className="cm-settings-label">{t("theme")}</div>
        <div className="cm-theme-picker">
          {THEMES.map((th) => (
            <button
              key={th.id}
              className={"cm-theme-swatch" + (theme === th.id ? " cm-theme-swatch-active" : "")}
              onClick={() => setTheme(th.id)}
            >
              <span className="cm-swatch-dot" style={{ background: th.swatch }} />
              {t("theme_" + th.id)}
            </button>
          ))}
        </div>

        <div className="cm-settings-label">{t("language")}</div>
        <LangSwitch lang={lang} onChange={setLang} />

        {(installPrompt || signOut) && (
          <div className="cm-modal-actions">
            {installPrompt && (
              <button className="cm-btn cm-btn-neutral" onClick={triggerInstall}>
                <Download size={14} /> {t("install_app")}
              </button>
            )}
            {signOut && (
              <button className="cm-btn cm-btn-fail" onClick={signOut}>
                <LogOut size={14} /> {t("sign_out")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   UI ПРИМИТИВЫ
   ============================================================ */
function ProgressBar({ value, max, color, height = 10, glow = false, theme }) {
  const pct = clamp((value / max) * 100, 0, 100);
  if (theme === "terminal") {
    const total = 18;
    const filled = Math.round((pct / 100) * total);
    return (
      <div className="cm-ascii-bar">
        [{"█".repeat(filled)}{"░".repeat(total - filled)}]
      </div>
    );
  }
  return (
    <div className="cm-track" style={{ height }}>
      <div className={"cm-fill" + (glow ? " cm-fill-glow" : "")} style={{ width: pct + "%", background: color }} />
    </div>
  );
}

function Panel({ title, right, children }) {
  return (
    <div className="cm-panel">
      {(title || right) && (
        <div className="cm-panel-head">
          {title && <div className="cm-panel-title">{title}</div>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function StatSelect({ value, onChange, lang }) {
  return (
    <select className="cm-input cm-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {STAT_KEYS.map((k) => (
        <option key={k} value={k}>
          {STAT_META[k].label} — {statName(lang, k)}
        </option>
      ))}
    </select>
  );
}

/* ============================================================
   ЭКРАН: HOME
   ============================================================ */
function HomeScreen({ state, t, lang, theme }) {
  const { user, quests, challenges } = state;
  const todayQuests = quests.filter((q) => isDue(q.next_due));
  const activeChallenge = challenges.find((c) => c.status === "active");

  return (
    <div className="cm-screen">
      <Panel title={t("panel_level")}>
        <div className="cm-level-row">
          <div className="cm-level-num">{user.level}</div>
          <div className="cm-level-bar-wrap">
            <ProgressBar value={user.exp} max={user.next_level_exp} color="var(--xp)" glow theme={theme} />
            <div className="cm-level-caption">
              {Number(user.exp).toFixed(1)} / {user.next_level_exp} EXP
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={t("panel_chaos")} right={<span className="cm-chaos-val">{user.chaos}/{user.chaos_max}</span>}>
        <ProgressBar value={user.chaos} max={user.chaos_max} color="var(--chaos)" height={12} theme={theme} />
        <div className="cm-chaos-caption">
          {user.chaos < 25 ? t("chaos_stable") : user.chaos < 60 ? t("chaos_shaky") : t("chaos_chaotic")}
        </div>
      </Panel>

      <Panel title={t("panel_active_challenge")}>
        {activeChallenge ? (
          <div>
            <div className="cm-challenge-title">{activeChallenge.title}</div>
            <div className="cm-row-meta">
              <span style={{ color: STAT_META[activeChallenge.stat].color }}>
                {STAT_META[activeChallenge.stat].label}
              </span>
              <span>+{activeChallenge.reward_exp} EXP</span>
              <span>{t("until")} {fmtDate(activeChallenge.due_date, LOCALE_MAP[lang])}</span>
            </div>
          </div>
        ) : (
          <div className="cm-empty">{t("no_active_challenge")}</div>
        )}
      </Panel>

      <Panel title={`${t("panel_today_quests")} (${todayQuests.length})`}>
        {todayQuests.length === 0 && <div className="cm-empty">{t("all_done")}</div>}
        {todayQuests.map((q) => (
          <div key={q.id} className="cm-mini-row">
            <span className="cm-dot" style={{ background: STAT_META[q.stat].color }} />
            <span className="cm-mini-title">{q.title}</span>
            <span className="cm-mini-reward">+{q.exp_reward}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* ============================================================
   ФОРМА: НОВЫЙ КВЕСТ
   ============================================================ */
function NewQuestForm({ onSubmit, onCancel, t, lang }) {
  const [title, setTitle] = useState("");
  const [stat, setStat] = useState("DEX");
  const [expReward, setExpReward] = useState(15);
  const [chaosPenalty, setChaosPenalty] = useState(10);
  const [intervalDays, setIntervalDays] = useState(1);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: "",
      stat,
      exp_reward: Number(expReward),
      chaos_penalty: Number(chaosPenalty),
      interval_days: Number(intervalDays),
      next_due: todayISO(),
      status: "pending",
    });
  };

  return (
    <form className="cm-form" onSubmit={submit}>
      <input className="cm-input" placeholder={t("title_placeholder")} value={title} onChange={(e) => setTitle(e.target.value)} required />
      <StatSelect value={stat} onChange={setStat} lang={lang} />
      <div className="cm-form-row">
        <label>{t("form_exp")} <input className="cm-input cm-input-num" type="number" min={1} value={expReward} onChange={(e) => setExpReward(e.target.value)} /></label>
        <label>{t("form_chaos")} <input className="cm-input cm-input-num" type="number" min={0} value={chaosPenalty} onChange={(e) => setChaosPenalty(e.target.value)} /></label>
        <label>{t("form_interval_days")} <input className="cm-input cm-input-num" type="number" min={1} value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} /></label>
      </div>
      <div className="cm-actions">
        <button className="cm-btn cm-btn-ok" type="submit">{t("form_add")}</button>
        <button className="cm-btn cm-btn-neutral" type="button" onClick={onCancel}>{t("form_cancel")}</button>
      </div>
    </form>
  );
}

/* ============================================================
   ЭКРАН: QUESTS
   ============================================================ */
function QuestsScreen({ state, onComplete, onFail, onPostpone, onAdd, onDelete, t, lang }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="cm-screen">
      {!showForm && (
        <button className="cm-btn cm-btn-add" onClick={() => setShowForm(true)}>
          <Plus size={14} /> {t("new_quest")}
        </button>
      )}
      {showForm && (
        <NewQuestForm
          t={t}
          lang={lang}
          onCancel={() => setShowForm(false)}
          onSubmit={(q) => {
            onAdd(q);
            setShowForm(false);
          }}
        />
      )}

      {state.quests.map((q) => {
        const due = isDue(q.next_due);
        const displayStatus = due ? "pending" : q.status;
        return (
          <div key={q.id} className={"cm-card" + (due ? "" : " cm-card-dim")}>
            <div className="cm-card-top">
              <span className="cm-dot" style={{ background: STAT_META[q.stat].color }} />
              <div className="cm-card-title">{q.title}</div>
              <span className={"cm-status cm-status-" + displayStatus}>{t("status_" + displayStatus)}</span>
              <button className="cm-icon-btn" title={t("form_cancel")} onClick={() => window.confirm(t("confirm_delete_quest", q.title)) && onDelete(q.id)}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className="cm-row-meta">
              <span style={{ color: STAT_META[q.stat].color }}>{STAT_META[q.stat].label}</span>
              <span>+{q.exp_reward} EXP</span>
              <span>−{q.chaos_penalty} {t("on_fail_prefix")}</span>
              <span>{q.interval_days} {t("interval_suffix")}</span>
              <span>{due ? t("available_today") : `${t("next_cycle")} ${fmtDate(q.next_due, LOCALE_MAP[lang])}`}</span>
            </div>
            <div className="cm-actions">
              <button className="cm-btn cm-btn-ok" disabled={!due} onClick={() => onComplete(q.id)}>
                <Check size={14} /> {t("q_complete")}
              </button>
              <button className="cm-btn cm-btn-fail" disabled={!due} onClick={() => onFail(q.id)}>
                <X size={14} /> {t("q_fail")}
              </button>
              <button className="cm-btn cm-btn-neutral" disabled={!due} onClick={() => onPostpone(q.id)}>
                <Clock size={14} /> {t("q_postpone")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   ФОРМА: НОВЫЙ ЧЕЛЛЕНДЖ
   ============================================================ */
function NewChallengeForm({ onSubmit, onCancel, t, lang }) {
  const [title, setTitle] = useState("");
  const [stat, setStat] = useState("DEX");
  const [rewardExp, setRewardExp] = useState(30);
  const [penaltyChaos, setPenaltyChaos] = useState(20);
  const [dueInDays, setDueInDays] = useState(2);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: "",
      stat,
      reward_exp: Number(rewardExp),
      penalty_chaos: Number(penaltyChaos),
      due_date: addDays(todayISO(), Number(dueInDays)),
      can_postpone: true,
      postponed: false,
    });
  };

  return (
    <form className="cm-form" onSubmit={submit}>
      <div className="cm-form-top">
        <input className="cm-input" placeholder={t("title_placeholder")} value={title} onChange={(e) => setTitle(e.target.value)} required />
        <button
          type="button"
          className="cm-btn cm-btn-neutral cm-btn-randomize"
          onClick={() => {
            const tpl = pickRandomTemplate(lang);
            setTitle(tpl.title);
            setStat(tpl.stat);
            setRewardExp(tpl.reward_exp);
            setPenaltyChaos(tpl.penalty_chaos);
          }}
        >
          {t("randomize")}
        </button>
      </div>
      <StatSelect value={stat} onChange={setStat} lang={lang} />
      <div className="cm-form-row">
        <label>{t("form_exp")} <input className="cm-input cm-input-num" type="number" min={1} value={rewardExp} onChange={(e) => setRewardExp(e.target.value)} /></label>
        <label>{t("form_chaos")} <input className="cm-input cm-input-num" type="number" min={0} value={penaltyChaos} onChange={(e) => setPenaltyChaos(e.target.value)} /></label>
        <label>{t("form_due_days")} <input className="cm-input cm-input-num" type="number" min={1} value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} /></label>
      </div>
      <div className="cm-actions">
        <button className="cm-btn cm-btn-ok" type="submit">{t("form_add")}</button>
        <button className="cm-btn cm-btn-neutral" type="button" onClick={onCancel}>{t("form_cancel")}</button>
      </div>
    </form>
  );
}

/* ============================================================
   ЭКРАН: CHALLENGE
   ============================================================ */
function ChallengeScreen({ state, onComplete, onFail, onPostpone, onAdd, onDelete, t, lang }) {
  const [showForm, setShowForm] = useState(false);
  const active = state.challenges.find((c) => c.status === "active");
  const queue = state.challenges.filter((c) => c.status === "pending");

  return (
    <div className="cm-screen">
      {!showForm && (
        <div className="cm-challenge-toolbar">
          <button
            className="cm-btn cm-btn-add"
            onClick={() => {
              const tpl = pickRandomTemplate(lang);
              onAdd(
                {
                  title: tpl.title,
                  description: "",
                  stat: tpl.stat,
                  reward_exp: tpl.reward_exp,
                  penalty_chaos: tpl.penalty_chaos,
                  due_date: addDays(todayISO(), 2),
                  can_postpone: true,
                  postponed: false,
                },
                !active
              );
            }}
          >
            {t("summon_challenge")}
          </button>
          <button className="cm-btn cm-btn-add" onClick={() => setShowForm(true)}>
            <Plus size={14} /> {t("new_challenge")}
          </button>
        </div>
      )}
      {showForm && (
        <NewChallengeForm
          t={t}
          lang={lang}
          onCancel={() => setShowForm(false)}
          onSubmit={(c) => {
            onAdd(c, !active);
            setShowForm(false);
          }}
        />
      )}

      <Panel title={t("current")}>
        {active ? (
          <div className="cm-card cm-card-flat">
            <div className="cm-card-top">
              <span className="cm-dot" style={{ background: STAT_META[active.stat].color }} />
              <div className="cm-card-title">{active.title}</div>
              <button className="cm-icon-btn" title={t("form_cancel")} onClick={() => window.confirm(t("confirm_delete_challenge", active.title)) && onDelete(active.id)}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className="cm-desc">{active.description}</div>
            <div className="cm-row-meta">
              <span style={{ color: STAT_META[active.stat].color }}>{STAT_META[active.stat].label}</span>
              <span>{t("reward_label")} +{active.reward_exp} EXP</span>
              <span>{t("penalty_label")} +{active.penalty_chaos} CHAOS</span>
              <span>{t("due_label")} {fmtDate(active.due_date, LOCALE_MAP[lang])}</span>
              {active.postponed && <span>{t("already_postponed")}</span>}
            </div>
            <div className="cm-actions">
              <button className="cm-btn cm-btn-ok" onClick={() => onComplete(active.id)}>
                <Check size={14} /> {t("q_complete")}
              </button>
              <button className="cm-btn cm-btn-fail" onClick={() => onFail(active.id)}>
                <X size={14} /> {t("q_fail")}
              </button>
              <button className="cm-btn cm-btn-neutral" disabled={active.postponed} onClick={() => onPostpone(active.id)}>
                <Clock size={14} /> {t("q_postpone")}
              </button>
            </div>
          </div>
        ) : (
          <div className="cm-empty">{t("no_active_queue")}</div>
        )}
      </Panel>

      {queue.length > 0 && (
        <Panel title={`${t("queue_label")} (${queue.length})`}>
          {queue.map((c) => (
            <div key={c.id} className="cm-mini-row">
              <span className="cm-dot" style={{ background: STAT_META[c.stat].color }} />
              <span className="cm-mini-title">{c.title}</span>
              <span className="cm-mini-reward">+{c.reward_exp}</span>
              <button className="cm-icon-btn" title={t("form_cancel")} onClick={() => window.confirm(t("confirm_delete_challenge", c.title)) && onDelete(c.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

/* ============================================================
   ЭКРАН: STATS
   ============================================================ */
function StatsScreen({ state, t, lang, theme }) {
  return (
    <div className="cm-screen">
      {STAT_KEYS.map((key) => {
        const s = state.stats[key];
        if (!s) return null;
        return (
          <Panel key={key} title={`${STAT_META[key].label} — ${statName(lang, key)}`} right={<span className="cm-stat-lvl">{t("lvl_short")} {s.value}</span>}>
            <ProgressBar value={s.exp} max={s.next_level_exp} color={STAT_META[key].color} height={10} theme={theme} />
            <div className="cm-level-caption">{s.exp} / {s.next_level_exp} EXP</div>
          </Panel>
        );
      })}
    </div>
  );
}

/* ============================================================
   ЭКРАН: HISTORY
   ============================================================ */
function HistoryScreen({ state, t, lang }) {
  const sorted = [...state.history].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return (
    <div className="cm-screen">
      {sorted.length === 0 && <div className="cm-empty">{t("history_empty")}</div>}
      {sorted.map((h) => (
        <div key={h.id} className="cm-hist-row">
          <div className="cm-hist-date">{fmtDate(h.ts, LOCALE_MAP[lang])}</div>
          <div className="cm-hist-body">
            <div className="cm-hist-title">{h.title}</div>
            <div className="cm-row-meta">
              {h.stat && <span style={{ color: STAT_META[h.stat].color }}>{STAT_META[h.stat].label}</span>}
              {h.exp_delta !== 0 && (
                <span className={h.exp_delta > 0 ? "cm-pos" : "cm-neg"}>
                  {h.exp_delta > 0 ? "+" : ""}
                  {h.exp_delta} EXP
                </span>
              )}
              {h.chaos_delta !== 0 && (
                <span className={h.chaos_delta > 0 ? "cm-neg" : "cm-pos"}>
                  {h.chaos_delta > 0 ? "+" : ""}
                  {h.chaos_delta} CHAOS
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   ГЛАВНЫЙ КОМПОНЕНТ
   ============================================================ */
const TABS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "quests", label: "Quests", icon: ListChecks },
  { id: "challenge", label: "Challenge", icon: Swords },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "history", label: "History", icon: HistoryIcon },
];

export default function App() {
  const [lang, setLangState] = useState(getInitialLang());
  const [theme, setThemeState] = useState(getInitialTheme());
  const [authUser, setAuthUser] = useState(undefined); // undefined = ещё проверяем сессию
  const [tab, setTab] = useState("home");
  const [state, setState] = useState(null);
  const [loadErr, setLoadErr] = useState(null);
  const [toast, setToast] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const setTheme = useCallback((th) => {
    setThemeState(th);
    saveTheme(th);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const t = useCallback(makeT(lang), [lang]);

  const setLang = useCallback((l) => {
    setLangState(l);
    saveLang(l);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    loadState(authUser.id)
      .then(setState)
      .catch((e) => setLoadErr(e.message || String(e)));
  }, [authUser]);

  const showToast = useCallback((message, tone = "neutral") => {
    const id = uid();
    setToast({ id, message, tone });
    setTimeout(() => setToast((cur) => (cur && cur.id === id ? null : cur)), 2200);
  }, []);

  const reportError = useCallback(
    (e) => showToast(t("toast_save_error") + " " + (e.message || "network error"), "fail"),
    [showToast, t]
  );

  const pushHistoryLocal = useCallback((entry) => {
    const row = { id: uid(), ts: todayISO(), user_id: authUser.id, ...entry };
    setState((prev) => ({ ...prev, history: [row, ...prev.history] }));
    insertHistoryRow({ ts: row.ts, user_id: authUser.id, type: entry.type, title: entry.title, exp_delta: entry.exp_delta, chaos_delta: entry.chaos_delta, stat: entry.stat }).catch(reportError);
  }, [authUser, reportError]);

  /* награда: считаем от текущего state, пишем в базу, затем чистый setState */
  const applyRewardAndPersist = useCallback((statKey, exp) => {
    const userLvl = grantExp({ value: state.user.level, exp: state.user.exp, next_level_exp: state.user.next_level_exp }, exp, LEVEL_UP_INCREMENT);
    const statLvl = grantExp(state.stats[statKey], exp, LEVEL_UP_INCREMENT);

    persistPlayer(authUser.id, { level: userLvl.value, exp: userLvl.exp, next_level_exp: userLvl.next_level_exp }).catch(reportError);
    persistStat(authUser.id, statKey, { value: statLvl.value, exp: statLvl.exp, next_level_exp: statLvl.next_level_exp, last_activity: todayISO() }).catch(reportError);

    setState((prev) => ({
      ...prev,
      user: { ...prev.user, level: userLvl.value, exp: userLvl.exp, next_level_exp: userLvl.next_level_exp },
      stats: { ...prev.stats, [statKey]: { ...prev.stats[statKey], value: statLvl.value, exp: statLvl.exp, next_level_exp: statLvl.next_level_exp, last_activity: todayISO() } },
    }));
  }, [state, authUser, reportError]);

  const applyChaosAndPersist = useCallback((delta) => {
    const chaos = clamp(state.user.chaos + delta, 0, state.user.chaos_max);
    persistPlayer(authUser.id, { chaos }).catch(reportError);
    setState((prev) => ({ ...prev, user: { ...prev.user, chaos } }));
  }, [state, authUser, reportError]);

  /* ---- QUEST ACTIONS ---- */
  const completeQuest = useCallback((id) => {
    const q = state.quests.find((x) => x.id === id);
    if (!q || !isDue(q.next_due)) return;
    const nextDue = addDays(todayISO(), q.interval_days);
    applyRewardAndPersist(q.stat, q.exp_reward);
    applyChaosAndPersist(CHAOS_ON_QUEST_COMPLETE);
    setState((prev) => ({ ...prev, quests: prev.quests.map((x) => (x.id === id ? { ...x, status: "completed", next_due: nextDue } : x)) }));
    persistQuest(id, { status: "completed", next_due: nextDue }).catch(reportError);
    pushHistoryLocal({ type: "quest_completed", title: q.title, exp_delta: q.exp_reward, chaos_delta: CHAOS_ON_QUEST_COMPLETE, stat: q.stat });
    showToast(`${q.title}: +${q.exp_reward} EXP · ${STAT_META[q.stat].label}`, "ok");
  }, [state, applyRewardAndPersist, applyChaosAndPersist, pushHistoryLocal, showToast, reportError]);

  const failQuest = useCallback((id) => {
    const q = state.quests.find((x) => x.id === id);
    if (!q || !isDue(q.next_due)) return;
    const nextDue = addDays(todayISO(), q.interval_days);
    applyChaosAndPersist(q.chaos_penalty);
    setState((prev) => ({ ...prev, quests: prev.quests.map((x) => (x.id === id ? { ...x, status: "failed", next_due: nextDue } : x)) }));
    persistQuest(id, { status: "failed", next_due: nextDue }).catch(reportError);
    pushHistoryLocal({ type: "quest_failed", title: q.title, exp_delta: 0, chaos_delta: q.chaos_penalty, stat: q.stat });
    showToast(`${q.title}: ${t("toast_fail")}, +${q.chaos_penalty} CHAOS`, "fail");
  }, [state, applyChaosAndPersist, pushHistoryLocal, showToast, reportError, t]);

  const postponeQuest = useCallback((id) => {
    const q = state.quests.find((x) => x.id === id);
    if (!q || !isDue(q.next_due)) return;
    const nextDue = addDays(q.next_due, 1);
    setState((prev) => ({ ...prev, quests: prev.quests.map((x) => (x.id === id ? { ...x, next_due: nextDue } : x)) }));
    persistQuest(id, { next_due: nextDue }).catch(reportError);
    pushHistoryLocal({ type: "quest_postponed", title: q.title, exp_delta: 0, chaos_delta: 0, stat: q.stat });
    showToast(`${q.title}: ${t("toast_postponed")}`, "neutral");
  }, [state, pushHistoryLocal, showToast, reportError, t]);

  const addQuest = useCallback(async (draft) => {
    try {
      const row = await insertQuestRow({ ...draft, user_id: authUser.id });
      setState((prev) => ({ ...prev, quests: [...prev.quests, row] }));
      showToast(`${t("toast_added_quest")} ${row.title}`, "ok");
    } catch (e) {
      reportError(e);
    }
  }, [authUser, showToast, reportError, t]);

  const deleteQuest = useCallback(async (id) => {
    setState((prev) => ({ ...prev, quests: prev.quests.filter((x) => x.id !== id) }));
    try {
      await deleteQuestRow(id);
    } catch (e) {
      reportError(e);
    }
  }, [reportError]);

  /* ---- CHALLENGE ACTIONS ---- */
  const activateNextLocal = (challenges) => {
    const idx = challenges.findIndex((c) => c.status === "pending");
    if (idx === -1) return challenges;
    return challenges.map((c, i) => (i === idx ? { ...c, status: "active" } : c));
  };

  const completeChallenge = useCallback((id) => {
    const c = state.challenges.find((x) => x.id === id);
    if (!c || c.status !== "active") return;
    const before = state.challenges.find((x) => x.id !== id && x.status === "pending");
    applyRewardAndPersist(c.stat, c.reward_exp);
    applyChaosAndPersist(CHAOS_ON_CHALLENGE_COMPLETE);
    setState((prev) => {
      let challenges = prev.challenges.map((x) => (x.id === id ? { ...x, status: "completed" } : x));
      challenges = activateNextLocal(challenges);
      return { ...prev, challenges };
    });
    persistChallenge(id, { status: "completed" }).catch(reportError);
    if (before) persistChallenge(before.id, { status: "active" }).catch(reportError);
    pushHistoryLocal({ type: "challenge_completed", title: c.title, exp_delta: c.reward_exp, chaos_delta: CHAOS_ON_CHALLENGE_COMPLETE, stat: c.stat });
    showToast(`${c.title}: +${c.reward_exp} EXP · ${STAT_META[c.stat].label}`, "ok");
  }, [state, applyRewardAndPersist, applyChaosAndPersist, pushHistoryLocal, showToast, reportError]);

  const failChallenge = useCallback((id) => {
    const c = state.challenges.find((x) => x.id === id);
    if (!c || c.status !== "active") return;
    const before = state.challenges.find((x) => x.id !== id && x.status === "pending");
    applyChaosAndPersist(c.penalty_chaos);
    setState((prev) => {
      let challenges = prev.challenges.map((x) => (x.id === id ? { ...x, status: "failed" } : x));
      challenges = activateNextLocal(challenges);
      return { ...prev, challenges };
    });
    persistChallenge(id, { status: "failed" }).catch(reportError);
    if (before) persistChallenge(before.id, { status: "active" }).catch(reportError);
    pushHistoryLocal({ type: "challenge_failed", title: c.title, exp_delta: 0, chaos_delta: c.penalty_chaos, stat: c.stat });
    showToast(`${c.title}: ${t("toast_fail")}, +${c.penalty_chaos} CHAOS`, "fail");
  }, [state, applyChaosAndPersist, pushHistoryLocal, showToast, reportError, t]);

  const postponeChallenge = useCallback((id) => {
    const c = state.challenges.find((x) => x.id === id);
    if (!c || c.status !== "active" || c.postponed) return;
    const dueDate = addDays(c.due_date, 1);
    setState((prev) => ({ ...prev, challenges: prev.challenges.map((x) => (x.id === id ? { ...x, due_date: dueDate, postponed: true } : x)) }));
    persistChallenge(id, { due_date: dueDate, postponed: true }).catch(reportError);
    pushHistoryLocal({ type: "challenge_postponed", title: c.title, exp_delta: 0, chaos_delta: 0, stat: c.stat });
    showToast(`${c.title}: ${t("toast_postponed")}`, "neutral");
  }, [state, pushHistoryLocal, showToast, reportError, t]);

  const addChallenge = useCallback(async (draft, makeActive) => {
    try {
      const row = await insertChallengeRow({ ...draft, user_id: authUser.id, status: makeActive ? "active" : "pending" });
      setState((prev) => ({ ...prev, challenges: [...prev.challenges, row] }));
      showToast(`${t("toast_added_challenge")} ${row.title}`, "ok");
    } catch (e) {
      reportError(e);
    }
  }, [authUser, showToast, reportError, t]);

  const deleteChallenge = useCallback(async (id) => {
    setState((prev) => ({ ...prev, challenges: prev.challenges.filter((x) => x.id !== id) }));
    try {
      await deleteChallengeRow(id);
    } catch (e) {
      reportError(e);
    }
  }, [reportError]);

  const signOut = () => supabase.auth.signOut();

  /* ---- RENDER ---- */
  if (authUser === undefined) {
    return (
      <div className="cm-root cm-loading" data-theme={theme}>
        <Flame className="cm-loading-icon" size={28} />
        <div>{t("checking_session")}</div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthGate onAuthed={setAuthUser} lang={lang} setLang={setLang} t={t} theme={theme} setTheme={setTheme} />;
  }

  if (loadErr) {
    return (
      <div className="cm-root cm-loading" data-theme={theme}>
        <div>{t("load_error")} {loadErr}</div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="cm-root cm-loading" data-theme={theme}>
        <Flame className="cm-loading-icon" size={28} />
        <div>{t("loading_data")}</div>
      </div>
    );
  }

  return (
    <div className="cm-root" data-theme={theme}>
      <div className="cm-header">
        <div className="cm-header-title-row">
          <div className="cm-header-title">
            CHALLENGE<span>MAKER</span>
          </div>
          <button className="cm-icon-btn" title={t("settings")} onClick={() => setSettingsOpen(true)}>
            <Settings size={16} />
          </button>
        </div>
        <div className="cm-header-sub-row">
          <div className="cm-header-sub">{state.user.name} · {t("lvl_short")} {state.user.level}</div>
        </div>
      </div>

      <div className="cm-body">
        {tab === "home" && <HomeScreen state={state} t={t} lang={lang} theme={theme} />}
        {tab === "quests" && (
          <QuestsScreen state={state} onComplete={completeQuest} onFail={failQuest} onPostpone={postponeQuest} onAdd={addQuest} onDelete={deleteQuest} t={t} lang={lang} />
        )}
        {tab === "challenge" && (
          <ChallengeScreen state={state} onComplete={completeChallenge} onFail={failChallenge} onPostpone={postponeChallenge} onAdd={addChallenge} onDelete={deleteChallenge} t={t} lang={lang} />
        )}
        {tab === "stats" && <StatsScreen state={state} t={t} lang={lang} theme={theme} />}
        {tab === "history" && <HistoryScreen state={state} t={t} lang={lang} />}
      </div>

      <div className="cm-tabbar">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          return (
            <button key={tb.id} className={"cm-tab" + (tab === tb.id ? " cm-tab-active" : "")} onClick={() => setTab(tb.id)}>
              <Icon size={18} />
              <span>{tb.label}</span>
            </button>
          );
        })}
      </div>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={t}
        installPrompt={installPrompt}
        triggerInstall={triggerInstall}
        signOut={signOut}
      />

      {toast && (
        <div className={"cm-toast cm-toast-" + toast.tone} key={toast.id}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
