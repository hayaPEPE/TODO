(() => {
const { LABEL_STORAGE_KEY, STORAGE_KEY, UI_STATE_STORAGE_KEY, createSeedLabels, createSeedTasks } = window.TodoModel;

const defaultUiState = {
  scope: "all",
  priority: "all",
  label: "all",
  search: "",
  sortDue: "asc",
  pageSize: 10
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSeedTasks();
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : createSeedTasks();
  } catch {
    return createSeedTasks();
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadLabels() {
  try {
    const raw = localStorage.getItem(LABEL_STORAGE_KEY);
    if (!raw) {
      return createSeedLabels();
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((label) => label.name && label.color)
      ? parsed
      : createSeedLabels();
  } catch {
    return createSeedLabels();
  }
}

function saveLabels(labels) {
  localStorage.setItem(LABEL_STORAGE_KEY, JSON.stringify(labels));
}

function loadUiState() {
  try {
    const raw = localStorage.getItem(UI_STATE_STORAGE_KEY);
    if (!raw) {
      return { ...defaultUiState };
    }

    const parsed = JSON.parse(raw);
    return normalizeUiState(parsed);
  } catch {
    return { ...defaultUiState };
  }
}

function saveUiState(uiState) {
  localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(normalizeUiState(uiState)));
}

function resetTasks() {
  const tasks = createSeedTasks();
  saveTasks(tasks);
  return tasks;
}

function resetLabels() {
  const labels = createSeedLabels();
  saveLabels(labels);
  return labels;
}

function normalizeUiState(uiState) {
  const pageSize = [10, 20, 50].includes(Number(uiState?.pageSize)) ? Number(uiState.pageSize) : defaultUiState.pageSize;
  const sortDue = uiState?.sortDue === "desc" ? "desc" : "asc";

  return {
    scope: ["all", "today", "week", "overdue", "completed", "archived"].includes(uiState?.scope)
      ? uiState.scope
      : defaultUiState.scope,
    priority: ["all", "high", "medium", "low"].includes(uiState?.priority)
      ? uiState.priority
      : defaultUiState.priority,
    label: typeof uiState?.label === "string" ? uiState.label : defaultUiState.label,
    search: typeof uiState?.search === "string" ? uiState.search : defaultUiState.search,
    sortDue,
    pageSize
  };
}

window.TodoStorage = {
  loadTasks,
  saveTasks,
  loadLabels,
  saveLabels,
  loadUiState,
  saveUiState,
  resetTasks,
  resetLabels
};
})();
