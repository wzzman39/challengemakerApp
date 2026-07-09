export const STAT_META = {
  STR: { label: "STR", full: "Сила", color: "#E2543F" },
  INT: { label: "INT", full: "Интеллект", color: "#3F86E2" },
  ART: { label: "ART", full: "Творчество", color: "#A25FE2" },
  CHR: { label: "CHR", full: "Харизма", color: "#D9A23F" },
  DEX: { label: "DEX", full: "Дисциплина", color: "#3FBF8F" },
};

export const STAT_KEYS = Object.keys(STAT_META);

// Балансные допущения — не были заданы в ТЗ явно, правь тут.
export const CHAOS_ON_QUEST_COMPLETE = -5;
export const CHAOS_ON_CHALLENGE_COMPLETE = -10;
export const LEVEL_UP_INCREMENT = 50;
