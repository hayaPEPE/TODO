(() => {
const {
  formatDueDate,
  isDueThisWeek,
  isDueToday,
  isOverdue,
  NO_LABEL_TEXT,
  priorityMap,
  todayString
} = window.TodoModel;

const priorityClass = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low"
};

function collectElements() {
  return {
    body: document.body,
    navItems: [...document.querySelectorAll("[data-scope]")],
    scopeButtons: [...document.querySelectorAll("[data-scope-shortcut]")],
    priorityShortcuts: [...document.querySelectorAll("[data-priority-shortcut]")],
    labelList: document.querySelector("#labelList"),
    labelContextMenu: document.querySelector("#labelContextMenu"),
    deleteLabelMenuItem: document.querySelector("#deleteLabelMenuItem"),
    addLabelButton: document.querySelector("#addLabelButton"),
    addLabelFromDialogButton: document.querySelector("#addLabelFromDialogButton"),
    counts: [...document.querySelectorAll("[data-count]")],
    summaries: [...document.querySelectorAll("[data-summary]")],
    searchInput: document.querySelector("#searchInput"),
    priorityFilter: document.querySelector("#priorityFilter"),
    tableBody: document.querySelector("#taskTableBody"),
    emptyState: document.querySelector("#emptyState"),
    resultCount: document.querySelector("#resultCount"),
    pageSizeSelect: document.querySelector("#pageSizeSelect"),
    rowTemplate: document.querySelector("#taskRowTemplate"),
    dialog: document.querySelector("#taskDialog"),
    form: document.querySelector("#taskForm"),
    labelDialog: document.querySelector("#labelDialog"),
    labelForm: document.querySelector("#labelForm"),
    labelNameInput: document.querySelector("#labelNameInput"),
    closeLabelDialogButton: document.querySelector("#closeLabelDialogButton"),
    cancelLabelDialogButton: document.querySelector("#cancelLabelDialogButton"),
    toast: document.querySelector("#toast"),
    dialogTitle: document.querySelector("#dialogTitle"),
    taskId: document.querySelector("#taskId"),
    taskTitle: document.querySelector("#taskTitle"),
    taskPriority: document.querySelector("#taskPriority"),
    taskDueDate: document.querySelector("#taskDueDate"),
    taskLabel: document.querySelector("#taskLabel"),
    taskArchived: document.querySelector("#taskArchived"),
    taskNote: document.querySelector("#taskNote"),
    addTaskButton: document.querySelector("#addTaskButton"),
    closeDialogButton: document.querySelector("#closeDialogButton"),
    cancelDialogButton: document.querySelector("#cancelDialogButton"),
    sortPriorityButton: document.querySelector("#sortPriorityButton"),
    sortDueButton: document.querySelector("#sortDueButton"),
    toggleVisibleTasks: document.querySelector("#toggleVisibleTasks"),
    sidebarToggle: document.querySelector("#sidebarToggle"),
    exportJsonButton: document.querySelector("#exportJsonButton"),
    exportCsvButton: document.querySelector("#exportCsvButton"),
    importJsonButton: document.querySelector("#importJsonButton"),
    importJsonInput: document.querySelector("#importJsonInput"),
    resetSeedButton: document.querySelector("#resetSeedButton")
  };
}

function render(state, elements) {
  const today = todayString();
  const activeTasks = state.tasks.filter((task) => !task.archived);
  const visibleTasks = getVisibleTasks(state, today);
  const pageSize = Number(state.pageSize);
  const pageTasks = visibleTasks.slice(0, pageSize);

  renderCounts(state.tasks, activeTasks, elements, today, state.labels);
  renderLabelList(state, elements, activeTasks);
  renderLabelOptions(state.labels, elements.taskLabel);
  renderActiveControls(state, elements);
  renderRows(pageTasks, elements, today);

  elements.emptyState.hidden = pageTasks.length > 0;
  elements.resultCount.textContent = `${pageTasks.length} / ${visibleTasks.length} 件を表示`;
  elements.toggleVisibleTasks.checked = pageTasks.length > 0 && pageTasks.every((task) => task.completed);
  elements.toggleVisibleTasks.indeterminate = pageTasks.some((task) => task.completed) && !elements.toggleVisibleTasks.checked;
}

function getVisibleTasks(state, today = todayString()) {
  const search = state.search.trim().toLowerCase();
  const filtered = state.tasks
    .filter((task) => matchesState(task, state, today))
    .filter((task) => {
      if (!search) return true;
      return [task.title, task.note, task.label || NO_LABEL_TEXT].some((value) => value.toLowerCase().includes(search));
    });

  return filtered.sort((a, b) => {
    if (state.sortBy === "priority") {
      const direction = state.sortPriority === "asc" ? 1 : -1;
      return (
        (priorityMap[a.priority].rank - priorityMap[b.priority].rank) * direction ||
        compareDueDate(a, b, "asc")
      );
    }

    return compareDueDate(a, b, state.sortDue);
  });
}

function compareDueDate(a, b, direction) {
    if (!a.dueDate && !b.dueDate) {
      return priorityMap[a.priority].rank - priorityMap[b.priority].rank;
    }

    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    if (direction === "asc") {
      return a.dueDate.localeCompare(b.dueDate) || priorityMap[a.priority].rank - priorityMap[b.priority].rank;
    }

    return b.dueDate.localeCompare(a.dueDate) || priorityMap[a.priority].rank - priorityMap[b.priority].rank;
}

function openTaskDialog(elements, labels, task = null) {
  renderLabelOptions(labels, elements.taskLabel);
  elements.form.reset();
  elements.dialogTitle.textContent = task ? "TODOを編集" : "TODOを追加";
  elements.taskId.value = task?.id || "";
  elements.taskTitle.value = task?.title || "";
  elements.taskPriority.value = task?.priority || "medium";
  elements.taskDueDate.value = task?.dueDate || "";
  elements.taskLabel.value = task?.label || "";
  elements.taskArchived.checked = Boolean(task?.archived);
  elements.taskNote.value = task?.note || "";
  elements.dialog.showModal();
  elements.taskTitle.focus();
}

function closeTaskDialog(elements) {
  elements.dialog.close();
}

function openLabelDialog(elements) {
  elements.labelForm.reset();
  elements.labelDialog.showModal();
  elements.labelNameInput.focus();
}

function closeLabelDialog(elements) {
  elements.labelDialog.close();
}

function readLabelForm(elements) {
  return {
    name: elements.labelNameInput.value.trim()
  };
}

function readTaskForm(elements) {
  return {
    id: elements.taskId.value,
    title: elements.taskTitle.value,
    priority: elements.taskPriority.value,
    dueDate: elements.taskDueDate.value,
    label: elements.taskLabel.value,
    archived: elements.taskArchived.checked,
    note: elements.taskNote.value
  };
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(filename, blob);
}

function downloadCsv(filename, tasks) {
  const headers = ["ID", "TODO内容", "優先順位", "期限", "ラベル", "備考", "完了", "アーカイブ", "作成日時", "更新日時"];
  const rows = tasks.map((task) => [
    task.id,
    task.title,
    priorityMap[task.priority]?.label || task.priority,
    task.dueDate || "指定なし",
    task.label || NO_LABEL_TEXT,
    task.note,
    task.completed ? "完了" : "未完了",
    task.archived ? "アーカイブ済み" : "",
    task.createdAt,
    task.updatedAt
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(filename, blob);
}

function showToast(elements, message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(elements.toastTimer);
  elements.toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2600);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function matchesState(task, state, today) {
  if (state.scope === "today" && !isDueToday(task, today)) return false;
  if (state.scope === "week" && !isDueThisWeek(task, today)) return false;
  if (state.scope === "overdue" && !isOverdue(task, today)) return false;
  if (state.scope === "completed" && (!task.completed || task.archived)) return false;
  if (state.scope === "archived" && !task.archived) return false;
  if (state.scope === "all" && task.archived) return false;
  if (state.priority !== "all" && task.priority !== state.priority) return false;
  if (state.label !== "all" && (task.label || "") !== state.label) return false;
  return true;
}

function renderRows(tasks, elements, today) {
  elements.tableBody.replaceChildren();

  for (const task of tasks) {
    const row = elements.rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.taskId = task.id;

    const checkbox = row.querySelector(".task-complete");
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `${task.title}を完了にする`);

    const titleCell = row.querySelector(".title-cell");
    titleCell.textContent = task.title;
    titleCell.classList.toggle("completed", task.completed);

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge ${priorityClass[task.priority]}`;
    priorityBadge.textContent = priorityMap[task.priority].label;
    row.querySelector(".priority-cell").append(priorityBadge);

    const dueCell = row.querySelector(".due-cell");
    dueCell.textContent = formatDueDate(task.dueDate);
    dueCell.classList.toggle("overdue", isOverdue(task, today));

    const labelBadge = document.createElement("span");
    labelBadge.className = "label-badge";
    labelBadge.textContent = task.label || NO_LABEL_TEXT;
    row.querySelector(".label-cell").append(labelBadge);

    row.querySelector(".note-cell").textContent = task.note || "-";
    row.querySelector(".archive-task").textContent = task.archived ? "戻す" : "保管";

    elements.tableBody.append(row);
  }
}

function renderCounts(tasks, activeTasks, elements, today) {
  const archivedTasks = tasks.filter((task) => task.archived);
  const counts = {
    all: activeTasks.length,
    today: activeTasks.filter((task) => isDueToday(task, today)).length,
    week: activeTasks.filter((task) => isDueThisWeek(task, today)).length,
    completed: activeTasks.filter((task) => task.completed).length,
    archived: archivedTasks.length,
    "priority-high": activeTasks.filter((task) => task.priority === "high").length,
    "priority-medium": activeTasks.filter((task) => task.priority === "medium").length,
    "priority-low": activeTasks.filter((task) => task.priority === "low").length
  };

  const summaries = {
    total: activeTasks.length,
    high: counts["priority-high"],
    medium: counts["priority-medium"],
    low: counts["priority-low"],
    today: counts.today
  };

  for (const item of elements.counts) {
    item.textContent = counts[item.dataset.count] ?? 0;
  }

  for (const item of elements.summaries) {
    item.textContent = summaries[item.dataset.summary] ?? 0;
  }
}

function renderLabelList(state, elements, activeTasks) {
  elements.labelList.replaceChildren();

  const noLabelButton = createLabelButton({
    name: "",
    displayName: NO_LABEL_TEXT,
    color: "#94a3b8",
    count: activeTasks.filter((task) => !task.label).length,
    active: state.label === "",
    removable: false
  });
  elements.labelList.append(noLabelButton);

  for (const label of state.labels) {
    const button = createLabelButton({
      name: label.name,
      displayName: label.name,
      color: label.color,
      count: activeTasks.filter((task) => task.label === label.name).length,
      active: state.label === label.name,
      removable: true
    });
    elements.labelList.append(button);
  }
}

function renderLabelOptions(labels, select) {
  const currentValue = select.value;
  select.replaceChildren();

  const noLabelOption = document.createElement("option");
  noLabelOption.value = "";
  noLabelOption.textContent = NO_LABEL_TEXT;
  select.append(noLabelOption);

  for (const label of labels) {
    const option = document.createElement("option");
    option.value = label.name;
    option.textContent = label.name;
    select.append(option);
  }

  if (currentValue === "" || labels.some((label) => label.name === currentValue)) {
    select.value = currentValue;
  }
}

function createLabelButton({ name, displayName, color, count, active, removable }) {
  const button = document.createElement("button");
  button.className = "metric-row";
  button.type = "button";
  button.dataset.labelShortcut = name;
  button.classList.toggle("active", active);
  if (removable) {
    button.dataset.removableLabel = name;
  }

  const dot = document.createElement("span");
  dot.className = "dot";
  dot.style.background = color;
  dot.setAttribute("aria-hidden", "true");

  const labelName = document.createElement("span");
  labelName.textContent = displayName;

  const countBadge = document.createElement("strong");
  countBadge.textContent = count;

  button.append(dot, labelName, countBadge);

  return button;
}

function renderActiveControls(state, elements) {
  for (const item of elements.navItems) {
    item.classList.toggle("active", item.dataset.scope === state.scope);
  }

  for (const item of elements.scopeButtons) {
    item.classList.toggle("active", item.dataset.scopeShortcut === state.scope);
  }

  elements.priorityFilter.value = state.priority;
  elements.pageSizeSelect.value = String(state.pageSize);
  elements.searchInput.value = state.search;
  elements.sortDueButton.classList.toggle("active", state.sortBy === "due");
  elements.sortPriorityButton.classList.toggle("active", state.sortBy === "priority");
  elements.sortDueButton.querySelector("span").textContent = state.sortDue === "asc" ? "↑" : "↓";
  elements.sortPriorityButton.querySelector("span").textContent = state.sortPriority === "asc" ? "↑" : "↓";
}

window.TodoView = {
  collectElements,
  render,
  getVisibleTasks,
  openTaskDialog,
  closeTaskDialog,
  openLabelDialog,
  closeLabelDialog,
  readLabelForm,
  readTaskForm,
  downloadJson,
  downloadCsv,
  showToast
};
})();
