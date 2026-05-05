(() => {
const STORAGE_KEY = "businessTodo.tasks.v1";
const LABEL_STORAGE_KEY = "businessTodo.labels.v1";
const UI_STATE_STORAGE_KEY = "businessTodo.uiState.v1";
const NO_LABEL_TEXT = "指定なし";

const priorityMap = {
  high: { label: "高", rank: 1 },
  medium: { label: "中", rank: 2 },
  low: { label: "低", rank: 3 }
};

const labelPalette = ["#6f9cf8", "#7c4dff", "#20b56b", "#ef476f", "#00a8a8", "#8a6f3d"];

const initialLabels = [
  { name: "仕事", color: labelPalette[0] },
  { name: "プロジェクト", color: labelPalette[1] },
  { name: "個人", color: labelPalette[2] }
];

const initialTasks = [
  {
    title: "会議資料を作成",
    priority: "high",
    dueDate: "2026-05-08",
    label: "仕事",
    note: "営業会議用のスライドを準備"
  },
  {
    title: "デザインレビュー",
    priority: "medium",
    dueDate: "2026-05-10",
    label: "プロジェクト",
    note: "UI改善点を確認"
  },
  {
    title: "請求書を送付",
    priority: "high",
    dueDate: "2026-05-06",
    label: "仕事",
    note: "取引先3社へメール送信"
  },
  {
    title: "定例MTGの議事録整理",
    priority: "low",
    dueDate: "2026-05-12",
    label: "仕事",
    note: "Notionにまとめる"
  },
  {
    title: "ユーザーテスト準備",
    priority: "medium",
    dueDate: "2026-05-14",
    label: "プロジェクト",
    note: "前回課題とタスク案を作成"
  },
  {
    title: "プロジェクト計画見直し",
    priority: "medium",
    dueDate: "2026-05-16",
    label: "プロジェクト",
    note: "スケジュールと体制を更新"
  },
  {
    title: "競合サービス調査",
    priority: "low",
    dueDate: "2026-05-18",
    label: "仕事",
    note: "価格・機能を比較"
  },
  {
    title: "週次レポート作成",
    priority: "medium",
    dueDate: "2026-05-15",
    label: "仕事",
    note: "進捗をまとめて共有"
  },
  {
    title: "クライアント打ち合わせ準備",
    priority: "high",
    dueDate: "2026-05-09",
    label: "プロジェクト",
    note: "提案資料を確認"
  },
  {
    title: "KPIデータ集計",
    priority: "low",
    dueDate: "2026-05-20",
    label: "仕事",
    note: "ダッシュボード更新"
  },
  {
    title: "契約書レビュー",
    priority: "high",
    dueDate: "2026-05-07",
    label: "仕事",
    note: "法務チェック依頼"
  },
  {
    title: "社内ナレッジ整理",
    priority: "low",
    dueDate: "2026-05-22",
    label: "個人",
    note: "FAQを追加"
  }
];

function createTask(input) {
  return {
    id: createId(),
    title: input.title.trim(),
    priority: input.priority,
    dueDate: input.dueDate || "",
    label: input.label || "",
    note: input.note.trim(),
    completed: Boolean(input.completed),
    archived: Boolean(input.archived),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const randomPart = Math.random().toString(36).slice(2, 10);
  return `task-${Date.now()}-${randomPart}`;
}

function createSeedTasks() {
  return initialTasks.map((task) => createTask(task));
}

function createSeedLabels() {
  return initialLabels.map((label) => ({ ...label }));
}

function createLabel(name, index = 0) {
  return {
    name: name.trim(),
    color: labelPalette[index % labelPalette.length]
  };
}

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function isOverdue(task, today = todayString()) {
  return Boolean(task.dueDate) && !task.completed && !task.archived && task.dueDate < today;
}

function isDueToday(task, today = todayString()) {
  return Boolean(task.dueDate) && !task.archived && task.dueDate === today;
}

function isDueThisWeek(task, today = todayString()) {
  return Boolean(task.dueDate) && !task.archived && task.dueDate >= today && task.dueDate <= addDays(today, 7);
}

function matchesScope(task, scope, today = todayString()) {
  if (scope === "today") return isDueToday(task, today);
  if (scope === "week") return isDueThisWeek(task, today);
  if (scope === "overdue") return isOverdue(task, today);
  if (scope === "completed") return task.completed && !task.archived;
  if (scope === "archived") return task.archived;
  return !task.archived;
}

function formatDueDate(dateString) {
  return dateString ? dateString.replaceAll("-", "/") : "指定なし";
}

window.TodoModel = {
  STORAGE_KEY,
  LABEL_STORAGE_KEY,
  UI_STATE_STORAGE_KEY,
  NO_LABEL_TEXT,
  priorityMap,
  labelPalette,
  initialLabels,
  initialTasks,
  createTask,
  createId,
  createSeedTasks,
  createSeedLabels,
  createLabel,
  todayString,
  addDays,
  isOverdue,
  isDueToday,
  isDueThisWeek,
  matchesScope,
  formatDueDate
};
})();
