import { todayISO, addDays } from "./utils";

export function buildSeedRows(userId) {
  const today = todayISO();
  return {
    player: {
      user_id: userId,
      name: "Тёма",
      level: 4,
      exp: 274.5,
      next_level_exp: 300,
      chaos: 0,
      chaos_max: 100,
    },
    stats: [
      { user_id: userId, stat_key: "STR", value: 3, exp: 130, next_level_exp: 250 },
      { user_id: userId, stat_key: "INT", value: 2, exp: 100, next_level_exp: 250 },
      { user_id: userId, stat_key: "ART", value: 2, exp: 0, next_level_exp: 250 },
      { user_id: userId, stat_key: "CHR", value: 3, exp: 175, next_level_exp: 250 },
      { user_id: userId, stat_key: "DEX", value: 2, exp: 140, next_level_exp: 250 },
    ],
    quests: [
      {
        user_id: userId, title: "Поменять лоток котам", description: "Бытовой хвост, DEX",
        stat: "DEX", exp_reward: 15, chaos_penalty: 10, interval_days: 2,
        next_due: today, status: "pending",
      },
      {
        user_id: userId, title: "Помыть поилку котам", description: "Бытовой хвост, DEX",
        stat: "DEX", exp_reward: 10, chaos_penalty: 10, interval_days: 2,
        next_due: today, status: "pending",
      },
      {
        user_id: userId, title: "Синхронизация ежедневника", description: "Рабочий ритм, DEX",
        stat: "DEX", exp_reward: 15, chaos_penalty: 15, interval_days: 1,
        next_due: today, status: "pending",
      },
    ],
    challenges: [
      {
        user_id: userId, title: "День без сахара", description: "Полный день без сахара в любом виде",
        stat: "DEX", reward_exp: 30, penalty_chaos: 20,
        due_date: addDays(today, -3), status: "completed", can_postpone: true, postponed: false,
      },
      {
        user_id: userId, title: "Цифровой детокс", description: "24 часа без соцсетей вне работы",
        stat: "CHR", reward_exp: 25, penalty_chaos: 20,
        due_date: addDays(today, -1), status: "completed", can_postpone: true, postponed: false,
      },
      {
        user_id: userId, title: "1 час чтения книг", description: "Час непрерывного чтения",
        stat: "INT", reward_exp: 30, penalty_chaos: 20,
        due_date: addDays(today, 1), status: "active", can_postpone: true, postponed: false,
      },
      {
        user_id: userId, title: "День без табака", description: "Полный день без табака",
        stat: "DEX", reward_exp: 35, penalty_chaos: 25,
        due_date: addDays(today, 3), status: "pending", can_postpone: true, postponed: false,
      },
    ],
    history: [
      { user_id: userId, ts: addDays(today, -3), type: "challenge_completed", title: "День без сахара", exp_delta: 30, chaos_delta: -10, stat: "DEX" },
      { user_id: userId, ts: addDays(today, -1), type: "challenge_completed", title: "Цифровой детокс", exp_delta: 25, chaos_delta: -10, stat: "CHR" },
    ],
  };
}
