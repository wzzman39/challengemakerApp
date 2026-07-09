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

/* ============================================================
   AUTH GATE
   ============================================================ */
function AuthGate({ onAuthed }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setMsg("Проверь почту — Supabase прислал письмо для подтверждения. После подтверждения зайди через 'Войти'.");
        } else {
          onAuthed(data.session.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthed(data.user);
      }
    } catch (err) {
      setMsg(err.message || "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cm-root cm-auth">
      <div className="cm-header">
        <div className="cm-header-title">
          CHALLENGE<span>MAKER</span>
        </div>
      </div>
      <form className="cm-auth-form" onSubmit={submit}>
        <input
          className="cm-input"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="cm-input"
          type="password"
          placeholder="пароль (мин. 6 симв.)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button className="cm-btn cm-btn-ok cm-auth-submit" disabled={busy} type="submit">
          {mode === "signin" ? "Войти" : "Создать аккаунт"}
        </button>
        {msg && <div className="cm-auth-msg">{msg}</div>}
        <button
          type="button"
          className="cm-auth-switch"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Нет аккаунта? Создать" : "Уже есть аккаунт? Войти"}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   UI ПРИМИТИВЫ
   ============================================================ */
function ProgressBar({ value, max, color, height = 10, glow = false }) {
  const pct = clamp((value / max) * 100, 0, 100);
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

function StatSelect({ value, onChange }) {
  return (
    <select className="cm-input cm-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {STAT_KEYS.map((k) => (
        <option key={k} value={k}>
          {STAT_META[k].label} — {STAT_META[k].full}
        </option>
      ))}
    </select>
  );
}

/* ============================================================
   ЭКРАН: HOME
   ============================================================ */
function HomeScreen({ state }) {
  const { user, quests, challenges } = state;
  const todayQuests = quests.filter((q) => isDue(q.next_due));
  const activeChallenge = challenges.find((c) => c.status === "active");

  return (
    <div className="cm-screen">
      <Panel title="УРОВЕНЬ">
        <div className="cm-level-row">
          <div className="cm-level-num">{user.level}</div>
          <div className="cm-level-bar-wrap">
            <ProgressBar value={user.exp} max={user.next_level_exp} color="var(--xp)" glow />
            <div className="cm-level-caption">
              {Number(user.exp).toFixed(1)} / {user.next_level_exp} EXP
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="CHAOS" right={<span className="cm-chaos-val">{user.chaos}/{user.chaos_max}</span>}>
        <ProgressBar value={user.chaos} max={user.chaos_max} color="var(--chaos)" height={12} />
        <div className="cm-chaos-caption">
          {user.chaos < 25 ? "Ритм стабилен" : user.chaos < 60 ? "Система шатается" : "Расползается"}
        </div>
      </Panel>

      <Panel title="АКТИВНЫЙ ЧЕЛЛЕНДЖ">
        {activeChallenge ? (
          <div>
            <div className="cm-challenge-title">{activeChallenge.title}</div>
            <div className="cm-row-meta">
              <span style={{ color: STAT_META[activeChallenge.stat].color }}>
                {STAT_META[activeChallenge.stat].label}
              </span>
              <span>+{activeChallenge.reward_exp} EXP</span>
              <span>до {fmtDate(activeChallenge.due_date)}</span>
            </div>
          </div>
        ) : (
          <div className="cm-empty">Нет активного челленджа</div>
        )}
      </Panel>

      <Panel title={`ЗАДАЧИ НА СЕГОДНЯ (${todayQuests.length})`}>
        {todayQuests.length === 0 && <div className="cm-empty">Всё закрыто</div>}
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
function NewQuestForm({ onSubmit, onCancel }) {
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
      <input className="cm-input" placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <StatSelect value={stat} onChange={setStat} />
      <div className="cm-form-row">
        <label>EXP <input className="cm-input cm-input-num" type="number" min={1} value={expReward} onChange={(e) => setExpReward(e.target.value)} /></label>
        <label>CHAOS <input className="cm-input cm-input-num" type="number" min={0} value={chaosPenalty} onChange={(e) => setChaosPenalty(e.target.value)} /></label>
        <label>раз в, дн <input className="cm-input cm-input-num" type="number" min={1} value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} /></label>
      </div>
      <div className="cm-actions">
        <button className="cm-btn cm-btn-ok" type="submit">Добавить</button>
        <button className="cm-btn cm-btn-neutral" type="button" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
}

/* ============================================================
   ЭКРАН: QUESTS
   ============================================================ */
function QuestsScreen({ state, onComplete, onFail, onPostpone, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="cm-screen">
      {!showForm && (
        <button className="cm-btn cm-btn-add" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Новый квест
        </button>
      )}
      {showForm && (
        <NewQuestForm
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
              <span className={"cm-status cm-status-" + displayStatus}>{displayStatus}</span>
              <button className="cm-icon-btn" title="Удалить" onClick={() => window.confirm(`Удалить квест «${q.title}»?`) && onDelete(q.id)}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className="cm-row-meta">
              <span style={{ color: STAT_META[q.stat].color }}>{STAT_META[q.stat].label}</span>
              <span>+{q.exp_reward} EXP</span>
              <span>−{q.chaos_penalty} при провале</span>
              <span>раз в {q.interval_days} дн.</span>
              <span>{due ? "доступен сегодня" : `след. цикл ${fmtDate(q.next_due)}`}</span>
            </div>
            <div className="cm-actions">
              <button className="cm-btn cm-btn-ok" disabled={!due} onClick={() => onComplete(q.id)}>
                <Check size={14} /> Выполнено
              </button>
              <button className="cm-btn cm-btn-fail" disabled={!due} onClick={() => onFail(q.id)}>
                <X size={14} /> Провалено
              </button>
              <button className="cm-btn cm-btn-neutral" disabled={!due} onClick={() => onPostpone(q.id)}>
                <Clock size={14} /> Отложить
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
function NewChallengeForm({ onSubmit, onCancel }) {
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
      <input className="cm-input" placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <StatSelect value={stat} onChange={setStat} />
      <div className="cm-form-row">
        <label>EXP <input className="cm-input cm-input-num" type="number" min={1} value={rewardExp} onChange={(e) => setRewardExp(e.target.value)} /></label>
        <label>CHAOS <input className="cm-input cm-input-num" type="number" min={0} value={penaltyChaos} onChange={(e) => setPenaltyChaos(e.target.value)} /></label>
        <label>срок, дн <input className="cm-input cm-input-num" type="number" min={1} value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} /></label>
      </div>
      <div className="cm-actions">
        <button className="cm-btn cm-btn-ok" type="submit">Добавить</button>
        <button className="cm-btn cm-btn-neutral" type="button" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
}

/* ============================================================
   ЭКРАН: CHALLENGE
   ============================================================ */
function ChallengeScreen({ state, onComplete, onFail, onPostpone, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const active = state.challenges.find((c) => c.status === "active");
  const queue = state.challenges.filter((c) => c.status === "pending");

  return (
    <div className="cm-screen">
      {!showForm && (
        <button className="cm-btn cm-btn-add" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Новый челлендж
        </button>
      )}
      {showForm && (
        <NewChallengeForm
          onCancel={() => setShowForm(false)}
          onSubmit={(c) => {
            onAdd(c, !active);
            setShowForm(false);
          }}
        />
      )}

      <Panel title="ТЕКУЩИЙ">
        {active ? (
          <div className="cm-card cm-card-flat">
            <div className="cm-card-top">
              <span className="cm-dot" style={{ background: STAT_META[active.stat].color }} />
              <div className="cm-card-title">{active.title}</div>
              <button className="cm-icon-btn" title="Удалить" onClick={() => window.confirm(`Удалить челлендж «${active.title}»?`) && onDelete(active.id)}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className="cm-desc">{active.description}</div>
            <div className="cm-row-meta">
              <span style={{ color: STAT_META[active.stat].color }}>{STAT_META[active.stat].label}</span>
              <span>Награда: +{active.reward_exp} EXP</span>
              <span>Штраф: +{active.penalty_chaos} CHAOS</span>
              <span>Срок: {fmtDate(active.due_date)}</span>
              {active.postponed && <span>уже откладывался</span>}
            </div>
            <div className="cm-actions">
              <button className="cm-btn cm-btn-ok" onClick={() => onComplete(active.id)}>
                <Check size={14} /> Выполнено
              </button>
              <button className="cm-btn cm-btn-fail" onClick={() => onFail(active.id)}>
                <X size={14} /> Провалено
              </button>
              <button className="cm-btn cm-btn-neutral" disabled={active.postponed} onClick={() => onPostpone(active.id)}>
                <Clock size={14} /> Отложить
              </button>
            </div>
          </div>
        ) : (
          <div className="cm-empty">Нет активного челленджа — очередь пуста</div>
        )}
      </Panel>

      {queue.length > 0 && (
        <Panel title={`В ОЧЕРЕДИ (${queue.length})`}>
          {queue.map((c) => (
            <div key={c.id} className="cm-mini-row">
              <span className="cm-dot" style={{ background: STAT_META[c.stat].color }} />
              <span className="cm-mini-title">{c.title}</span>
              <span className="cm-mini-reward">+{c.reward_exp}</span>
              <button className="cm-icon-btn" title="Удалить" onClick={() => window.confirm(`Удалить челлендж «${c.title}»?`) && onDelete(c.id)}>
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
function StatsScreen({ state }) {
  return (
    <div className="cm-screen">
      {STAT_KEYS.map((key) => {
        const s = state.stats[key];
        if (!s) return null;
        return (
          <Panel key={key} title={`${STAT_META[key].label} — ${STAT_META[key].full}`} right={<span className="cm-stat-lvl">Ур. {s.value}</span>}>
            <ProgressBar value={s.exp} max={s.next_level_exp} color={STAT_META[key].color} height={10} />
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
function HistoryScreen({ state }) {
  const sorted = [...state.history].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return (
    <div className="cm-screen">
      {sorted.length === 0 && <div className="cm-empty">История пуста</div>}
      {sorted.map((h) => (
        <div key={h.id} className="cm-hist-row">
          <div className="cm-hist-date">{fmtDate(h.ts)}</div>
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
  const [authUser, setAuthUser] = useState(undefined); // undefined = ещё проверяем сессию
  const [tab, setTab] = useState("home");
  const [state, setState] = useState(null);
  const [loadErr, setLoadErr] = useState(null);
  const [toast, setToast] = useState(null);

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
    (e) => showToast("Не сохранилось: " + (e.message || "ошибка сети"), "fail"),
    [showToast]
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
    showToast(`${q.title}: провал, +${q.chaos_penalty} CHAOS`, "fail");
  }, [state, applyChaosAndPersist, pushHistoryLocal, showToast, reportError]);

  const postponeQuest = useCallback((id) => {
    const q = state.quests.find((x) => x.id === id);
    if (!q || !isDue(q.next_due)) return;
    const nextDue = addDays(q.next_due, 1);
    setState((prev) => ({ ...prev, quests: prev.quests.map((x) => (x.id === id ? { ...x, next_due: nextDue } : x)) }));
    persistQuest(id, { next_due: nextDue }).catch(reportError);
    pushHistoryLocal({ type: "quest_postponed", title: q.title, exp_delta: 0, chaos_delta: 0, stat: q.stat });
    showToast(`${q.title}: отложено на 1 день`, "neutral");
  }, [state, pushHistoryLocal, showToast, reportError]);

  const addQuest = useCallback(async (draft) => {
    try {
      const row = await insertQuestRow({ ...draft, user_id: authUser.id });
      setState((prev) => ({ ...prev, quests: [...prev.quests, row] }));
      showToast(`Добавлен квест: ${row.title}`, "ok");
    } catch (e) {
      reportError(e);
    }
  }, [authUser, showToast, reportError]);

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
    showToast(`${c.title}: провал, +${c.penalty_chaos} CHAOS`, "fail");
  }, [state, applyChaosAndPersist, pushHistoryLocal, showToast, reportError]);

  const postponeChallenge = useCallback((id) => {
    const c = state.challenges.find((x) => x.id === id);
    if (!c || c.status !== "active" || c.postponed) return;
    const dueDate = addDays(c.due_date, 1);
    setState((prev) => ({ ...prev, challenges: prev.challenges.map((x) => (x.id === id ? { ...x, due_date: dueDate, postponed: true } : x)) }));
    persistChallenge(id, { due_date: dueDate, postponed: true }).catch(reportError);
    pushHistoryLocal({ type: "challenge_postponed", title: c.title, exp_delta: 0, chaos_delta: 0, stat: c.stat });
    showToast(`${c.title}: отложено на 1 день`, "neutral");
  }, [state, pushHistoryLocal, showToast, reportError]);

  const addChallenge = useCallback(async (draft, makeActive) => {
    try {
      const row = await insertChallengeRow({ ...draft, user_id: authUser.id, status: makeActive ? "active" : "pending" });
      setState((prev) => ({ ...prev, challenges: [...prev.challenges, row] }));
      showToast(`Добавлен челлендж: ${row.title}`, "ok");
    } catch (e) {
      reportError(e);
    }
  }, [authUser, showToast, reportError]);

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
      <div className="cm-root cm-loading">
        <Flame className="cm-loading-icon" size={28} />
        <div>Проверка сессии...</div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthGate onAuthed={setAuthUser} />;
  }

  if (loadErr) {
    return (
      <div className="cm-root cm-loading">
        <div>Ошибка загрузки: {loadErr}</div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="cm-root cm-loading">
        <Flame className="cm-loading-icon" size={28} />
        <div>Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="cm-root">
      <div className="cm-header">
        <div className="cm-header-title">
          CHALLENGE<span>MAKER</span>
        </div>
        <div className="cm-header-sub-row">
          <div className="cm-header-sub">{state.user.name} · Ур. {state.user.level}</div>
          <button className="cm-icon-btn" title="Выйти" onClick={signOut}>
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <div className="cm-body">
        {tab === "home" && <HomeScreen state={state} />}
        {tab === "quests" && (
          <QuestsScreen state={state} onComplete={completeQuest} onFail={failQuest} onPostpone={postponeQuest} onAdd={addQuest} onDelete={deleteQuest} />
        )}
        {tab === "challenge" && (
          <ChallengeScreen state={state} onComplete={completeChallenge} onFail={failChallenge} onPostpone={postponeChallenge} onAdd={addChallenge} onDelete={deleteChallenge} />
        )}
        {tab === "stats" && <StatsScreen state={state} />}
        {tab === "history" && <HistoryScreen state={state} />}
      </div>

      <div className="cm-tabbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={"cm-tab" + (tab === t.id ? " cm-tab-active" : "")} onClick={() => setTab(t.id)}>
              <Icon size={18} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {toast && (
        <div className={"cm-toast cm-toast-" + toast.tone} key={toast.id}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
