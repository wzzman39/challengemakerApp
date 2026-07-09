export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDays = (isoDate, days) => {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
};

export const isDue = (nextDue) => nextDue <= todayISO();

export const uid = () => Math.random().toString(36).slice(2, 10);

/* level-up движок, общий для user и stat-строк */
export function grantExp(entity, amount, levelUpIncrement) {
  let { value, exp, next_level_exp } = entity;
  exp = Number(exp) + amount;
  while (exp >= next_level_exp) {
    exp -= next_level_exp;
    value += 1;
    next_level_exp += levelUpIncrement;
  }
  return { value, exp, next_level_exp };
}
