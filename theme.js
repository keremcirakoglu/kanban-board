const root = document.documentElement;
const themeToggleButton = document.getElementById("theme-toggle");
const githubIcon = document.querySelector("#github-btn svg");

export const initTheme = () => {
  const saved = localStorage.getItem("theme");
  if (!saved) {
    localStorage.setItem("theme", "light");
    applyTheme(false);
  } else {
    applyTheme(saved === "dark");
  }
};

export const applyTheme = (isDark) => {
  if (isDark) {
    root.style.setProperty("--background", "#1b1b1f");
    root.style.setProperty("--newtask", "#1e1e22");
    root.style.setProperty("--board", "#1f1f22");
    root.style.setProperty("--todo", "#18181b");
    root.style.setProperty("--todohover", "#26262b");
    root.style.setProperty("--text", "#ededf1");
    root.style.setProperty("--sidebar-bg", "#111111");
    themeToggleButton.textContent = "☀️";
    localStorage.setItem("theme", "dark");

    if (githubIcon) githubIcon.setAttribute("fill", "#f5f5f5");
  } else {
    root.style.setProperty("--background", "#eeeded");
    root.style.setProperty("--newtask", "#ddd");
    root.style.setProperty("--board", "#F0F0F0");
    root.style.setProperty("--todo", "#E0E0E0");
    root.style.setProperty("--todohover", "#E0E0E0");
    root.style.setProperty("--text", "#000000");
    root.style.setProperty("--sidebar-bg", "#a1a1a1");
    themeToggleButton.textContent = "🌙";
    localStorage.setItem("theme", "light");

    if (githubIcon) githubIcon.setAttribute("fill", "#1a1a1a");
  }
};

themeToggleButton.addEventListener("click", () => {
  const current = localStorage.getItem("theme");
  applyTheme(current === "dark" ? false : true);
});
