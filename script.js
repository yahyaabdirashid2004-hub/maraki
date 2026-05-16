// ══════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];
const ACCENT_COLORS = ["#03542d"];
const DEFAULT_TASKS = ["Reading", "Gym", "Salah", "Meditation", "Studying"];
const NOTIFICATION_QUOTES = [
  "The secret of getting ahead is getting started. – Mark Twain",
  "Don't watch the clock; do what it does. Keep going. – Sam Levenson",
  "Action is the foundational key to all success. – Pablo Picasso",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work. – Stephen King",
  "Focus on being productive instead of busy. – Tim Ferriss",
  "Someday is not a day of the week. – Janet Dailey",
  "You can't build a reputation on what you are going to do. – Henry Ford",
  "The most difficult thing is the decision to act, the rest is merely tenacity. – Amelia Earhart",
  "Do or do not. There is no try. – Yoda",
  "A year from now you may wish you had started today. – Karen Lamb",
  "Things may come to those who wait, but only the things left by those who hustle. – Abraham Lincoln",
  "Start where you are. Use what you have. Do what you can. – Arthur Ashe",
  "It always seems impossible until it's done. – Nelson Mandela",
  "Success is the sum of small efforts, repeated day in and day out. – Robert Collier",
  "The way to get started is to quit talking and begin doing. – Walt Disney",
  "Don't let yesterday take up too much of today. – Will Rogers",
  "What you do today can improve all your tomorrows. – Ralph Marston",
  "If you spend too much time thinking about a thing, you'll never get it done. – Bruce Lee",
  "You don't have to be great to start, but you have to start to be great. – Zig Ziglar",
  "Great acts are made up of small deeds. – Lao Tzu",
];

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let state = {
  tasks: [],
  log: {},
  settings: { darkMode: false, hideCompleted: false, accentColor: "#03542d" },
  lastNotified: "",
  currentDate: "",
};
let calView = "28";
let calMonthOffset = 0;

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem("lista-v1") || "{}");
    if (s.lists) {
      state.tasks = s.lists.flatMap((l) => l.tasks); // migrate old format
    } else {
      state.tasks = s.tasks || [];
    }
    state.log = s.log || {};
    state.settings = s.settings || {
      darkMode: false,
      hideCompleted: false,
      accentColor: "#03542d",
      notificationsEnabled: false,
      notificationTime: "09:00",
    };
    state.lastNotified = s.lastNotified || "";
    state.currentDate = s.currentDate || "";
  } catch (e) {}
}
function saveState() {
  localStorage.setItem(
    "lista-v1",
    JSON.stringify({
      tasks: state.tasks,
      log: state.log,
      settings: state.settings,
      lastNotified: state.lastNotified,
      currentDate: state.currentDate,
    }),
  );
}

// ══════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function dateStr(d) {
  return d.toISOString().slice(0, 10);
}
function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function todayStr() {
  return dateStr(today());
}
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function fmt(ds) {
  const d = new Date(ds + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function heatColor(ratio) {
  const isDark = state.settings && state.settings.darkMode;
  if (!ratio || ratio <= 0) return isDark ? "#1f2937" : "#e5e7eb";
  const accent = state.settings.accentColor || "#03542d";
  return hexToRgba(accent, ratio * 0.7 + 0.3); // Minimum 30% opacity, scales to 100%
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getNotificationIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="32" fill="${color}"/><path d="M32 86 C32 50, 48 40, 64 64 C80 40, 96 50, 96 86" stroke="white" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="64" cy="36" r="8" fill="white"/></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function updateAppIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 128 128"><rect width="128" height="128" rx="32" fill="${color}"/><path d="M32 86 C32 50, 48 40, 64 64 C80 40, 96 50, 96 86" stroke="white" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="64" cy="36" r="8" fill="white"/></svg>`;
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = canvas.toDataURL("image/png");
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// ══════════════════════════════════════════
// LOG
// ══════════════════════════════════════════
function checkNewDay() {
  const ts = todayStr();
  if (state.currentDate !== ts) {
    if (!state.currentDate) {
      if (state.tasks.length === 0) {
        state.tasks = DEFAULT_TASKS.map((t) => ({
          id: uid(),
          text: t,
          done: false,
        }));
      }
    } else {
      // It's a new day! Keep the task list, but uncheck everything.
      state.tasks.forEach((t) => (t.done = false));
    }
    state.currentDate = ts;
    updateLog(); // Initialize today's log right away
  }
}

function updateLog() {
  const ts = todayStr();
  let total = state.tasks.length;
  let done = state.tasks.filter((t) => t.done).length;
  if (total > 0)
    state.log[ts] = {
      completed: done,
      total,
      ratio: done / total,
      tasks: JSON.parse(JSON.stringify(state.tasks)), // Save a snapshot of actual tasks
    };
  else delete state.log[ts];
  saveState();
}

// ══════════════════════════════════════════
// STATS
// ══════════════════════════════════════════
function calcStreak() {
  const d = today();
  let s = 0;
  while (true) {
    const e = state.log[dateStr(d)];
    if (e && e.ratio >= 1) {
      s++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return s;
}
function calcAvg28() {
  const d = today();
  let sum = 0,
    n = 0;
  for (let i = 0; i < 28; i++) {
    const e = state.log[dateStr(d)];
    if (e) {
      sum += e.ratio;
      n++;
    }
    d.setDate(d.getDate() - 1);
  }
  return n > 0 ? Math.round((sum / n) * 100) : 0;
}
function totalDone() {
  let n = 0;
  Object.values(state.log).forEach((e) => {
    n += e.completed;
  });
  return n;
}

// ══════════════════════════════════════════
// PAGE SWITCH
// ══════════════════════════════════════════
function switchPage(id, el) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-tab")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById("page-" + id).classList.add("active");
  el.classList.add("active");
  if (id === "calendar") renderCalendar();
  if (id === "tasks") renderTasks();
  if (id === "settings") applySettingsToDOM();
}

// ══════════════════════════════════════════
// TASKS RENDER
// ══════════════════════════════════════════
function renderTasks() {
  checkNewDay();

  const container = document.getElementById("tasks-container");
  const prog = document.getElementById("day-progress");
  const pctLabel = document.getElementById("day-pct-label");
  const pctBar = document.getElementById("day-pct-bar");

  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter((t) => t.done).length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Top progress bar
  if (totalTasks > 0) {
    prog.style.display = "";
    pctLabel.textContent = pct + "%";
    pctBar.style.width = pct + "%";
    pctBar.style.background = pct === 100 ? "#10b981" : "var(--accent)";
  } else {
    prog.style.display = "none";
  }

  if (state.tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">◻</div>
        <h2>No tasks yet</h2>
        <p>Add your first task above to start tracking<br>and building your completion streak.</p>
      </div>`;
    return;
  }

  let visibleTasks = state.tasks;
  if (state.settings.hideCompleted) {
    visibleTasks = visibleTasks.filter((t) => !t.done);
  }

  container.innerHTML = visibleTasks
    .map(
      (t, i) => `
    <div class="task-wrapper" data-id="${t.id}" style="animation-delay:${i * 0.04}s">
      <div class="task-action-delete" onclick="deleteTask('${t.id}')">Delete</div>
      <div class="task-item${t.done ? " done" : ""}" onclick="toggleTask('${t.id}')">
        <div class="task-check"><span class="chk-mark">✓</span></div>
        <span class="task-text">${esc(t.text)}</span>
      </div>
    </div>`,
    )
    .join("");
}

let preventClick = false;
function toggleTask(taskId) {
  if (preventClick) return;
  const wrapper = document.querySelector(`.task-wrapper[data-id="${taskId}"]`);
  if (wrapper) {
    const taskItem = wrapper.querySelector(".task-item");
    if (taskItem && taskItem.classList.contains("swiped-left")) {
      taskItem.classList.remove("swiped-left");
      wrapper.classList.remove("action-active");
      return; // If it was swiped open, close it instead of toggling completion
    }
  }
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.done = !task.done;
  updateLog();
  renderTasks();
}

function addTask() {
  const inp = document.getElementById("new-task-input");
  const text = inp?.value.trim();
  if (!text) return;
  state.tasks.unshift({ id: uid(), text, done: false }); // Add to top
  inp.value = "";
  updateLog();
  renderTasks();
}

let lastDeletedTask = null;
let lastDeletedIndex = -1;
let undoTimeout = null;

function deleteTask(taskId) {
  const index = state.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return;

  lastDeletedTask = state.tasks[index];
  lastDeletedIndex = index;

  state.tasks.splice(index, 1);

  updateLog();
  renderTasks();
  showUndoToast();
}

function showUndoToast() {
  const toast = document.getElementById("undo-toast");
  if (!toast) return;

  toast.classList.add("show");

  if (undoTimeout) clearTimeout(undoTimeout);
  undoTimeout = setTimeout(() => {
    toast.classList.remove("show");
    lastDeletedTask = null;
  }, 4000); // 4 seconds before the undo option goes away
}

function undoDelete() {
  if (!lastDeletedTask) return;

  state.tasks.splice(lastDeletedIndex, 0, lastDeletedTask);
  lastDeletedTask = null;

  const toast = document.getElementById("undo-toast");
  if (toast) {
    toast.classList.remove("show");
    if (undoTimeout) clearTimeout(undoTimeout);
  }

  updateLog();
  renderTasks();
}

// ══════════════════════════════════════════
// CALENDAR PAGE
// ══════════════════════════════════════════
function renderCalendar() {
  renderStats();
  if (calView === "28") render28();
  else renderFullCal();
}

function renderStats() {
  const streak = calcStreak();
  const avg = calcAvg28();
  const total = totalDone();
  document.getElementById("stats-strip").innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Streak</div>
      <div class="stat-value hi">${streak}<span class="stat-sub"> ${streak === 1 ? "day" : "days"}</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">28-day avg</div>
      <div class="stat-value">${avg}<span class="stat-sub">%</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total done</div>
      <div class="stat-value">${total}</div>
    </div>`;
}

function setCalView(v) {
  calView = v;
  document.getElementById("vt-28").classList.toggle("active", v === "28");
  document.getElementById("vt-full").classList.toggle("active", v === "full");
  document.getElementById("heatmap-view").style.display =
    v === "28" ? "" : "none";
  document.getElementById("full-cal-view").style.display =
    v === "full" ? "" : "none";
  if (v === "28") render28();
  else renderFullCal();
}

function render28() {
  const container = document.getElementById("heatmap-view");
  const base = today();
  const ts = todayStr();

  // 28 cells: from 27 days ago → today
  const days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  // Column labels: based on what day of week day[0] lands on
  const startDow = days[0].getDay(); // 0=Sun
  const labels = [];
  for (let i = 0; i < 7; i++) labels.push(DAY_NAMES[(startDow + i) % 7]);

  const cells = days
    .map((d) => {
      const s = dateStr(d);
      const e = state.log[s];
      const r = e ? e.ratio : 0;
      const tip = e
        ? `${fmt(s)}: ${Math.round(r * 100)}%`
        : `${fmt(s)}: no data`;
      return `<div class="heat-cell${s === ts ? " today-cell" : ""}"
                 style="background:${heatColor(r)}"
                 data-tip="${tip}" onclick="openDayModal('${s}')"></div>`;
    })
    .join("");

  // Legend
  const legendCells = [0, 0.25, 0.5, 0.75, 1]
    .map(
      (r) =>
        `<div class="heat-legend-cell" style="background:${heatColor(r)}"></div>`,
    )
    .join("");

  container.innerHTML = `
    <div class="heat-day-labels">${labels.map((l) => `<div class="heat-day-lbl">${l}</div>`).join("")}</div>
    <div class="heat-grid">${cells}</div>
    <div class="heat-legend">
      <span class="heat-legend-label">Less</span>
      <div class="heat-legend-cells">${legendCells}</div>
      <span class="heat-legend-label">More</span>
    </div>`;
}

function renderFullCal() {
  const container = document.getElementById("full-cal-view");
  const now = new Date();
  const ref = new Date(now.getFullYear(), now.getMonth() + calMonthOffset, 1);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const ts = todayStr();

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const lastDay = new Date(year, month + 1, 0).getDate();

  const headers = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    .map((h) => `<div class="full-hdr">${h}</div>`)
    .join("");

  let cells = "";
  for (let i = 0; i < firstDow; i++)
    cells += `<div class="full-day empty-day"></div>`;

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    const s = dateStr(date);
    const e = state.log[s];
    const r = e ? e.ratio : 0;
    const future = date > now && s !== ts;
    const tip =
      !future && e
        ? `${d} ${MONTH_NAMES[month].slice(0, 3)}: ${Math.round(r * 100)}%`
        : !future
          ? `${d} ${MONTH_NAMES[month].slice(0, 3)}: no data`
          : "";
    const pastOrToday = date <= today();
    cells += `<div class="full-day${s === ts ? " today-day" : ""}${future ? " future-day" : ""}"
                   style="background:${future ? "#f3f4f6" : heatColor(r)}"
                   ${tip ? `data-tip="${tip}"` : ""}
                   ${pastOrToday ? `onclick="openDayModal('${s}')"` : ""}>${d}</div>`;
  }

  container.innerHTML = `
    <div class="full-cal-nav">
      <button class="cal-nav-btn" onclick="calNav(-1)">‹</button>
      <div class="full-cal-title">${MONTH_NAMES[month]} ${year}</div>
      <button class="cal-nav-btn" onclick="calNav(1)">›</button>
    </div>
    <div class="full-cal-grid">${headers}${cells}</div>`;
}

function calNav(dir) {
  calMonthOffset += dir;
  renderFullCal();
}

// ══════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════
function openDayModal(dateString) {
  const logEntry = state.log[dateString];
  const modal = document.getElementById("day-modal");
  const title = document.getElementById("modal-date-title");
  const list = document.getElementById("modal-tasks-list");

  title.textContent = fmt(dateString);

  if (!logEntry || !logEntry.tasks) {
    list.innerHTML = `<p style="color: var(--text-dim); text-align: center; padding: 20px;">No tasks recorded for this day.</p>`;
  } else {
    list.innerHTML = logEntry.tasks
      .map(
        (t) => `
      <div class="modal-task-item ${t.done ? "done" : ""}">
        <div class="modal-chk">${t.done ? '<span style="color:#fff; font-size:12px; font-weight:bold;">✓</span>' : ""}</div>
        <span>${esc(t.text)}</span>
      </div>`,
      )
      .join("");
  }
  modal.style.display = "flex";
}

function closeDayModal(e) {
  if (e && e.target.id !== "day-modal") return; // Keep modal open if you click inside it
  document.getElementById("day-modal").style.display = "none";
}

// ══════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════
function applySettingsToDOM() {
  document.body.classList.toggle("dark-mode", state.settings.darkMode);
  const toggleDark = document.getElementById("toggle-dark-mode");
  const toggleHide = document.getElementById("toggle-hide-completed");
  const toggleNotif = document.getElementById("toggle-notifications");
  const timeInput = document.getElementById("notification-time");

  if (toggleDark) toggleDark.checked = state.settings.darkMode;
  if (toggleHide) toggleHide.checked = state.settings.hideCompleted;
  if (toggleNotif) toggleNotif.checked = state.settings.notificationsEnabled;
  if (timeInput) timeInput.value = state.settings.notificationTime || "09:00";

  const accent = state.settings.accentColor || "#03542d";
  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty(
    "--accent-low",
    hexToRgba(accent, 0.15),
  );

  updateAppIcon(accent);

  const picker = document.getElementById("color-picker");
  if (picker) {
    picker.innerHTML = ACCENT_COLORS.map(
      (c) =>
        `<div class="c-swatch${c === accent ? " sel" : ""}" style="background:${c}" onclick="setAccentColor('${c}')"></div>`,
    ).join("");
  }
}

function setAccentColor(hex) {
  state.settings.accentColor = hex;
  saveState();
  applySettingsToDOM();
  if (calView === "28" || calView === "full") renderCalendar(); // update heat colors
}

function toggleDarkMode(isDark) {
  state.settings.darkMode = isDark;
  applySettingsToDOM();
  saveState();
  if (calView === "28" || calView === "full") renderCalendar(); // update heat colors
}

function toggleHideCompleted(isHide) {
  state.settings.hideCompleted = isHide;
  saveState();
}

function toggleNotifications(isEnabled) {
  if (isEnabled && "Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        state.settings.notificationsEnabled = true;
        saveState();
      } else {
        alert(
          "Notification permission denied. Please enable them in your browser settings.",
        );
        document.getElementById("toggle-notifications").checked = false;
        state.settings.notificationsEnabled = false;
        saveState();
      }
    });
  } else {
    state.settings.notificationsEnabled = false;
    saveState();
  }
}

function setNotificationTime(time) {
  state.settings.notificationTime = time;
  saveState();
}

function setupNotificationChecker() {
  setInterval(() => {
    if (
      !state.settings.notificationsEnabled ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    )
      return;

    const now = new Date();
    const currentDay = dateStr(now);
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    if (
      currentTime === state.settings.notificationTime &&
      state.lastNotified !== currentDay
    ) {
      const remaining = state.tasks.filter((t) => !t.done).length;
      if (remaining > 0) {
        const randomQuote =
          NOTIFICATION_QUOTES[
            Math.floor(Math.random() * NOTIFICATION_QUOTES.length)
          ];
        const accent = state.settings.accentColor || "#03542d";
        const notif = new Notification(`Meraki: ${remaining} task(s) left!`, {
          body: randomQuote,
          icon: getNotificationIcon(accent),
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
      state.lastNotified = currentDay + "-" + currentTime;
      saveState();
    }
  }, 60000); // Check every minute
}

function clearData() {
  if (
    !confirm(
      "Are you sure you want to permanently delete all tasks and history?",
    )
  )
    return;
  state.tasks = [];
  state.log = {};
  saveState();
  alert("All data has been cleared.");
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
function init() {
  loadState();

  // --- TEMPORARY BACKFILL ---
  const backfillStart = new Date(new Date().getFullYear(), 4, 13); // Month 4 is May (0-indexed)
  const backfillEnd = today();
  let logChanged = false;
  for (
    let d = new Date(backfillStart);
    d <= backfillEnd;
    d.setDate(d.getDate() + 1)
  ) {
    const ds = dateStr(d);
    const defaultTasksObj = DEFAULT_TASKS.map((t) => ({ text: t, done: true }));
    if (!state.log[ds]) {
      state.log[ds] = {
        completed: 5,
        total: 5,
        ratio: 1,
        tasks: defaultTasksObj,
      };
      logChanged = true;
    } else if (!state.log[ds].tasks) {
      // Give tasks to the days we previously backfilled
      state.log[ds].tasks = defaultTasksObj;
      logChanged = true;
    }
  }
  if (logChanged) saveState();
  // --------------------------

  const d = new Date();
  document.getElementById("today-badge").textContent = d
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();

  // Hide Splash Screen after the logo animation finishes
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
      splash.classList.add("splash-hidden");
      setTimeout(() => splash.remove(), 500); // Remove from DOM fully after fade out
    }
  }, 2000);

  applySettingsToDOM();
  renderTasks();
  setupNotificationChecker();

  // Swipe to delete logic
  const container = document.getElementById("tasks-container");
  let startX = 0,
    startY = 0,
    currentX = 0,
    currentY = 0,
    swipedTask = null,
    isSwiping = false,
    isSwipedOpen = false;

  container.addEventListener(
    "touchstart",
    (e) => {
      const taskEl = e.target.closest(".task-item");
      if (
        !taskEl ||
        e.target.closest(".task-del") ||
        e.target.closest(".task-check")
      )
        return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      swipedTask = taskEl;
      isSwipedOpen = swipedTask.classList.contains("swiped-left");
      isSwiping = false;
    },
    { passive: true },
  );

  container.addEventListener(
    "touchmove",
    (e) => {
      if (!swipedTask) return;
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
      const diffX = currentX - startX;
      const diffY = currentY - startY;

      if (!isSwiping) {
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
          isSwiping = true;
          swipedTask.classList.add("swiping");
          swipedTask.parentElement.classList.add("action-active");
        } else if (Math.abs(diffY) > 30) {
          swipedTask = null; // abort horizontal swipe if scrolling vertically
          return;
        }
      }
      if (isSwiping) {
        let newX = isSwipedOpen ? -80 + diffX : diffX;
        if (newX > 10) newX = 10;
        if (newX < -100) newX = -100;
        swipedTask.style.transform = `translateX(${newX}px)`;
      }
    },
    { passive: true },
  );

  container.addEventListener("touchend", (e) => {
    if (!swipedTask) return;
    if (isSwiping) {
      preventClick = true;
      setTimeout(() => (preventClick = false), 300); // avoid triggering a click after swipe
      const diffX = currentX - startX;
      swipedTask.classList.remove("swiping");
      let newX = isSwipedOpen ? -80 + diffX : diffX;
      if (newX < -40) {
        swipedTask.style.transform = "";
        swipedTask.classList.add("swiped-left");
      } else {
        swipedTask.style.transform = "";
        swipedTask.classList.remove("swiped-left");
        swipedTask.parentElement.classList.remove("action-active");
      }
    }
    swipedTask = null;
    isSwiping = false;
  });
}

init();
