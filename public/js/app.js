(() => {
const { createLabel, createTask } = window.TodoModel;
const {
  loadLabels,
  loadTasks,
  loadUiState,
  resetLabels,
  resetTasks,
  saveLabels,
  saveTasks,
  saveUiState
} = window.TodoStorage;
const {
  closeTaskDialog,
  collectElements,
  downloadCsv,
  downloadJson,
  getVisibleTasks,
  closeLabelDialog,
  openTaskDialog,
  openLabelDialog,
  readLabelForm,
  readTaskForm,
  render,
  showToast
} = window.TodoView;

const elements = collectElements();
const savedUiState = loadUiState();
const state = {
  tasks: loadTasks(),
  scope: savedUiState.scope,
  priority: savedUiState.priority,
  label: savedUiState.label,
  search: savedUiState.search,
  sortDue: savedUiState.sortDue,
  pageSize: savedUiState.pageSize,
  labels: loadLabels()
};

if (state.label !== "all" && state.label !== "" && !state.labels.some((label) => label.name === state.label)) {
  state.label = "all";
}

function commitTasks(nextTasks) {
  state.tasks = nextTasks;
  saveTasks(state.tasks);
  render(state, elements);
}

function commitUiState(patch) {
  Object.assign(state, patch);
  saveUiState({
    scope: state.scope,
    priority: state.priority,
    label: state.label,
    search: state.search,
    sortDue: state.sortDue,
    pageSize: state.pageSize
  });
  render(state, elements);
}

function updateTask(taskId, patch) {
  commitTasks(
    state.tasks.map((task) =>
      task.id === taskId ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task
    )
  );
}

function commitLabels(nextLabels) {
  state.labels = nextLabels;
  saveLabels(state.labels);
  render(state, elements);
}

function deleteTask(taskId) {
  commitTasks(state.tasks.filter((task) => task.id !== taskId));
}

function setScope(scope) {
  commitUiState({ scope, label: "all" });
}

function deleteLabel(labelName) {
  const usedCount = state.tasks.filter((task) => task.label === labelName).length;
  const message = usedCount > 0
    ? `ラベル「${labelName}」が設定されたTODOが${usedCount}件あります。削除すると該当TODOのラベルは指定なしになります。本当に削除しますか？`
    : `ラベル「${labelName}」を削除しますか？`;

  if (!confirm(message)) return;

  state.labels = state.labels.filter((label) => label.name !== labelName);
  saveLabels(state.labels);
  state.tasks = state.tasks.map((task) =>
    task.label === labelName ? { ...task, label: "", updatedAt: new Date().toISOString() } : task
  );
  saveTasks(state.tasks);

  if (state.label === labelName) {
    state.label = "all";
    saveUiState({
      scope: state.scope,
      priority: state.priority,
      label: state.label,
      search: state.search,
      sortDue: state.sortDue,
      pageSize: state.pageSize
    });
  }

  render(state, elements);
  showToast(elements, `ラベル「${labelName}」を削除しました。`);
}

function openLabelContextMenu(labelName, x, y) {
  elements.labelContextMenu.dataset.labelName = labelName;
  elements.labelContextMenu.hidden = false;

  const menuRect = elements.labelContextMenu.getBoundingClientRect();
  const left = Math.min(x, window.innerWidth - menuRect.width - 8);
  const top = Math.min(y, window.innerHeight - menuRect.height - 8);

  elements.labelContextMenu.style.left = `${Math.max(8, left)}px`;
  elements.labelContextMenu.style.top = `${Math.max(8, top)}px`;
  elements.deleteLabelMenuItem.focus();
}

function closeLabelContextMenu() {
  elements.labelContextMenu.hidden = true;
  delete elements.labelContextMenu.dataset.labelName;
}

elements.addTaskButton.addEventListener("click", () => openTaskDialog(elements, state.labels));
elements.closeDialogButton.addEventListener("click", () => closeTaskDialog(elements));
elements.cancelDialogButton.addEventListener("click", () => closeTaskDialog(elements));
elements.addLabelButton.addEventListener("click", () => openLabelDialog(elements));
elements.addLabelFromDialogButton.addEventListener("click", () => openLabelDialog(elements));
elements.closeLabelDialogButton.addEventListener("click", () => closeLabelDialog(elements));
elements.cancelLabelDialogButton.addEventListener("click", () => closeLabelDialog(elements));

elements.labelForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const { name } = readLabelForm(elements);

  if (!name) return;

  if (state.labels.some((label) => label.name === name)) {
    showToast(elements, "同じ名前のラベルが既にあります。");
    elements.labelNameInput.focus();
    return;
  }

  commitLabels([...state.labels, createLabel(name, state.labels.length)]);

  if (elements.dialog.open) {
    elements.taskLabel.value = name;
  }

  closeLabelDialog(elements);
  showToast(elements, `ラベル「${name}」を追加しました。`);
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formValue = readTaskForm(elements);

  if (formValue.id) {
    updateTask(formValue.id, {
      title: formValue.title.trim(),
      priority: formValue.priority,
      dueDate: formValue.dueDate || "",
      label: formValue.label || "",
      note: formValue.note.trim(),
      archived: formValue.archived
    });
  } else {
    const task = createTask(formValue);
    state.tasks = [...state.tasks, task];
    saveTasks(state.tasks);
    commitUiState({
      scope: "all",
      priority: "all",
      label: "all",
      search: ""
    });
    showToast(elements, `TODO「${task.title}」を追加しました。`);
  }

  closeTaskDialog(elements);
});

elements.searchInput.addEventListener("input", (event) => {
  commitUiState({ search: event.target.value });
});

elements.priorityFilter.addEventListener("change", (event) => {
  commitUiState({ priority: event.target.value });
});

elements.pageSizeSelect.addEventListener("change", (event) => {
  commitUiState({ pageSize: Number(event.target.value) });
});

elements.sortDueButton.addEventListener("click", () => {
  commitUiState({ sortDue: state.sortDue === "asc" ? "desc" : "asc" });
});

elements.toggleVisibleTasks.addEventListener("change", (event) => {
  const visibleIds = new Set(getVisibleTasks(state).slice(0, state.pageSize).map((task) => task.id));
  commitTasks(
    state.tasks.map((task) =>
      visibleIds.has(task.id) ? { ...task, completed: event.target.checked, updatedAt: new Date().toISOString() } : task
    )
  );
});

elements.tableBody.addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;

  const task = state.tasks.find((item) => item.id === row.dataset.taskId);
  if (!task) return;

  if (event.target.matches(".edit-task")) {
    openTaskDialog(elements, state.labels, task);
  }

  if (event.target.matches(".archive-task")) {
    updateTask(task.id, { archived: !task.archived });
  }

  if (event.target.matches(".delete-task") && confirm(`「${task.title}」を削除しますか？`)) {
    deleteTask(task.id);
  }
});

elements.tableBody.addEventListener("change", (event) => {
  if (!event.target.matches(".task-complete")) return;

  const row = event.target.closest("tr");
  updateTask(row.dataset.taskId, { completed: event.target.checked });
});

for (const item of elements.navItems) {
  item.addEventListener("click", () => setScope(item.dataset.scope));
}

for (const item of elements.scopeButtons) {
  item.addEventListener("click", () => setScope(item.dataset.scopeShortcut));
}

for (const item of elements.priorityShortcuts) {
  item.addEventListener("click", () => {
    commitUiState({ priority: item.dataset.priorityShortcut, scope: "all" });
  });
}

elements.labelList.addEventListener("click", (event) => {
  const labelButton = event.target.closest("[data-label-shortcut]");
  if (!labelButton) return;

  closeLabelContextMenu();
  commitUiState({ label: labelButton.dataset.labelShortcut, scope: "all" });
});

elements.labelList.addEventListener("contextmenu", (event) => {
  const labelButton = event.target.closest("[data-removable-label]");
  if (!labelButton) return;

  event.preventDefault();
  openLabelContextMenu(labelButton.dataset.removableLabel, event.clientX, event.clientY);
});

elements.deleteLabelMenuItem.addEventListener("click", () => {
  const labelName = elements.labelContextMenu.dataset.labelName;
  closeLabelContextMenu();
  if (labelName) {
    deleteLabel(labelName);
  }
});

document.addEventListener("click", (event) => {
  if (elements.labelContextMenu.hidden) return;
  if (elements.labelContextMenu.contains(event.target)) return;
  closeLabelContextMenu();
});

window.addEventListener("scroll", closeLabelContextMenu, true);


elements.sidebarToggle.addEventListener("click", () => {
  if (window.matchMedia("(max-width: 720px)").matches) {
    elements.body.classList.toggle("sidebar-open");
    return;
  }

  elements.body.classList.toggle("sidebar-collapsed");
});

elements.exportJsonButton.addEventListener("click", () => {
  downloadJson(`todo-export-${new Date().toISOString().slice(0, 10)}.json`, {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: state.tasks,
    labels: state.labels
  });
  showToast(elements, "JSON出力を開始しました。");
});

elements.exportCsvButton.addEventListener("click", () => {
  downloadCsv(`todo-export-${new Date().toISOString().slice(0, 10)}.csv`, state.tasks);
  showToast(elements, "CSV出力を開始しました。");
});

elements.importJsonButton.addEventListener("click", () => {
  elements.importJsonInput.click();
});

elements.importJsonInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  event.target.value = "";
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    const tasks = Array.isArray(imported) ? imported : imported.tasks;
    const labels = Array.isArray(imported.labels) ? imported.labels : state.labels;

    if (!Array.isArray(tasks)) {
      showToast(elements, "JSONの形式が正しくありません。");
      return;
    }

    if (!confirm("JSONの内容で現在のTODOとラベルを上書きしますか？")) {
      return;
    }

    state.labels = labels;
    saveLabels(state.labels);
    commitTasks(tasks);
    showToast(elements, "JSONを取り込みました。");
  } catch {
    showToast(elements, "JSONを読み込めませんでした。");
  }
});

elements.resetSeedButton.addEventListener("click", () => {
  if (confirm("サンプルデータを復元しますか？現在のTODOは上書きされます。")) {
    state.labels = resetLabels();
    commitTasks(resetTasks());
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.dialog.open) {
    closeTaskDialog(elements);
  }

  if (event.key === "Escape" && elements.labelDialog.open) {
    closeLabelDialog(elements);
  }

  if (event.key === "Escape" && !elements.labelContextMenu.hidden) {
    closeLabelContextMenu();
  }
});

render(state, elements);
})();
