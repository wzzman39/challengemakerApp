import { supabase } from "./supabaseClient";
import { buildSeedRows } from "./seed";

/* Загружает всё состояние пользователя. Если это первый вход — сеет seed-данные. */
export async function loadState(userId) {
  let { data: player, error: playerErr } = await supabase
    .from("player")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (playerErr) throw playerErr;

  if (!player) {
    const seed = buildSeedRows(userId);
    const { error: e1 } = await supabase.from("player").insert(seed.player);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from("stats").insert(seed.stats);
    if (e2) throw e2;
    const { error: e3 } = await supabase.from("quests").insert(seed.quests);
    if (e3) throw e3;
    const { error: e4 } = await supabase.from("challenges").insert(seed.challenges);
    if (e4) throw e4;
    const { error: e5 } = await supabase.from("history").insert(seed.history);
    if (e5) throw e5;
    player = seed.player;
  }

  const [statsRes, questsRes, challengesRes, historyRes] = await Promise.all([
    supabase.from("stats").select("*").eq("user_id", userId),
    supabase.from("quests").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("challenges").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("history").select("*").eq("user_id", userId).order("ts", { ascending: false }),
  ]);
  if (statsRes.error) throw statsRes.error;
  if (questsRes.error) throw questsRes.error;
  if (challengesRes.error) throw challengesRes.error;
  if (historyRes.error) throw historyRes.error;

  const stats = {};
  for (const s of statsRes.data) stats[s.stat_key] = s;

  return {
    user: player,
    stats,
    quests: questsRes.data || [],
    challenges: challengesRes.data || [],
    history: historyRes.data || [],
  };
}

export async function persistPlayer(userId, patch) {
  const { error } = await supabase.from("player").update(patch).eq("user_id", userId);
  if (error) throw error;
}

export async function persistStat(userId, statKey, patch) {
  const { error } = await supabase
    .from("stats")
    .update(patch)
    .eq("user_id", userId)
    .eq("stat_key", statKey);
  if (error) throw error;
}

export async function persistQuest(id, patch) {
  const { error } = await supabase.from("quests").update(patch).eq("id", id);
  if (error) throw error;
}

export async function persistChallenge(id, patch) {
  const { error } = await supabase.from("challenges").update(patch).eq("id", id);
  if (error) throw error;
}

export async function insertHistoryRow(row) {
  const { error } = await supabase.from("history").insert(row);
  if (error) throw error;
}

export async function insertQuestRow(row) {
  const { data, error } = await supabase.from("quests").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function insertChallengeRow(row) {
  const { data, error } = await supabase.from("challenges").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function deleteQuestRow(id) {
  const { error } = await supabase.from("quests").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteChallengeRow(id) {
  const { error } = await supabase.from("challenges").delete().eq("id", id);
  if (error) throw error;
}
