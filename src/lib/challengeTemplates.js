export const CHALLENGE_TEMPLATES = [
  { id: "no_sugar", stat: "DEX", reward_exp: 30, penalty_chaos: 20 },
  { id: "digital_detox", stat: "CHR", reward_exp: 25, penalty_chaos: 20 },
  { id: "read_hour", stat: "INT", reward_exp: 30, penalty_chaos: 20 },
  { id: "no_tobacco", stat: "DEX", reward_exp: 35, penalty_chaos: 25 },
  { id: "cold_shower", stat: "STR", reward_exp: 25, penalty_chaos: 15 },
  { id: "no_phone_hour", stat: "DEX", reward_exp: 20, penalty_chaos: 15 },
  { id: "workout_30", stat: "STR", reward_exp: 35, penalty_chaos: 20 },
  { id: "write_verse", stat: "ART", reward_exp: 30, penalty_chaos: 15 },
  { id: "clean_space", stat: "DEX", reward_exp: 20, penalty_chaos: 15 },
  { id: "hard_conversation", stat: "CHR", reward_exp: 25, penalty_chaos: 15 },
  { id: "no_junk_food", stat: "STR", reward_exp: 25, penalty_chaos: 15 },
  { id: "sketch_something", stat: "ART", reward_exp: 20, penalty_chaos: 10 },
];

export const TEMPLATE_TITLES = {
  ru: {
    no_sugar: "День без сахара",
    digital_detox: "Цифровой детокс",
    read_hour: "1 час чтения книг",
    no_tobacco: "День без табака",
    cold_shower: "Холодный душ",
    no_phone_hour: "Час без телефона",
    workout_30: "30 минут тренировки",
    write_verse: "Написать куплет",
    clean_space: "Генеральная уборка стола",
    hard_conversation: "Один трудный разговор",
    no_junk_food: "День без фастфуда",
    sketch_something: "Набросок за 20 минут",
  },
  en: {
    no_sugar: "No sugar today",
    digital_detox: "Digital detox",
    read_hour: "1 hour of reading",
    no_tobacco: "No tobacco today",
    cold_shower: "Cold shower",
    no_phone_hour: "1 hour without phone",
    workout_30: "30 min workout",
    write_verse: "Write a verse",
    clean_space: "Deep-clean your desk",
    hard_conversation: "One hard conversation",
    no_junk_food: "No junk food today",
    sketch_something: "20-minute sketch",
  },
  de: {
    no_sugar: "Ein Tag ohne Zucker",
    digital_detox: "Digital-Detox",
    read_hour: "1 Stunde lesen",
    no_tobacco: "Ein Tag ohne Tabak",
    cold_shower: "Kalt duschen",
    no_phone_hour: "1 Stunde ohne Handy",
    workout_30: "30 Min. Training",
    write_verse: "Eine Strophe schreiben",
    clean_space: "Schreibtisch gründlich aufräumen",
    hard_conversation: "Ein schwieriges Gespräch führen",
    no_junk_food: "Ein Tag ohne Fast Food",
    sketch_something: "20-Minuten-Skizze",
  },
};

export function pickRandomTemplate(lang) {
  const tpl = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
  const titles = TEMPLATE_TITLES[lang] || TEMPLATE_TITLES.ru;
  return {
    title: titles[tpl.id] || tpl.id,
    stat: tpl.stat,
    reward_exp: tpl.reward_exp,
    penalty_chaos: tpl.penalty_chaos,
  };
}
