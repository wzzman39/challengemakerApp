export const THEMES = [
  { id: "hud", swatch: "#F2C14E" },
  { id: "journal", swatch: "#3F6B4A" },
  { id: "terminal", swatch: "#FFB000" },
];

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem("cm_theme");
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* localStorage недоступен — используем дефолт молча */
  }
  return "hud";
}

export function saveTheme(theme) {
  try {
    localStorage.setItem("cm_theme", theme);
  } catch {
    /* игнор — не критично, просто не запомнится выбор */
  }
}
