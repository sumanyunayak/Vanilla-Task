const CURRENT_USER_KEY = "vanillaTaskCurrentUser";
const TASKS_PREFIX = "vanillaTaskTasks:";
const activeUser = getActiveUser();
const storageKey = activeUser ? getUserTasksKey(activeUser.email) : null;

if (!activeUser) {
    window.location.href = "../Login-SignUp/login.html";
}

let tasks = activeUser ? loadTasks() : [];
let activeStatus = "todo";
let pointerDrag = null;

const modal = document.getElementById("taskModal");
const form = document.getElementById("taskForm");
const formError = document.getElementById("formError");
const titleInput = document.getElementById("taskTitle");
const descriptionInput = document.getElementById("taskDescription");
const priorityInput = document.getElementById("taskPriority");
const statusInput = document.getElementById("taskStatus");
const taskLists = document.querySelectorAll("[data-list]");
const taskColumns = document.querySelectorAll(".task-column");

document.getElementById("openTaskModal").addEventListener("click", () => openTaskModal("todo"));
document.getElementById("closeTaskModal").addEventListener("click", closeTaskModal);
document.getElementById("cancelTask").addEventListener("click", closeTaskModal);
document.querySelector(".header-actions .ghost-btn").addEventListener("click", logoutUser);

document.querySelectorAll("[data-add-status]").forEach((button) => {
    button.addEventListener("click", () => openTaskModal(button.dataset.addStatus));
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    createTask();
});

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeTaskModal();
    }
});

if (activeUser) {
    hydrateUserName();
    renderBoard();
}

function getActiveUser() {
    try {
        const savedUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");

        if (savedUser?.email) {
            return {
                username: savedUser.username || savedUser.email.split("@")[0],
                email: savedUser.email.toLowerCase()
            };
        }
    } catch {
        return null;
    }

    return null;
}

function getUserTasksKey(email) {
    return `${TASKS_PREFIX}${encodeURIComponent(email.toLowerCase())}`;
}

function loadTasks() {
    try {
        const savedTasks = JSON.parse(localStorage.getItem(storageKey) || "[]");
        return Array.isArray(savedTasks) ? savedTasks : [];
    } catch {
        return [];
    }
}

function saveTasks() {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function hydrateUserName() {
    const username = document.querySelector(".username");
    const avatar = document.querySelector(".avatar");
    const displayName = activeUser.username || activeUser.email.split("@")[0];

    username.textContent = displayName;
    avatar.textContent = displayName.trim().charAt(0).toUpperCase() || "P";
}

function logoutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem("currentUser");
    window.location.href = "../Login-SignUp/login.html";
}

function openTaskModal(status) {
    activeStatus = status;
    form.reset();
    formError.textContent = "";
    priorityInput.value = "medium";
    statusInput.value = activeStatus;
    modal.showModal();
    titleInput.focus();
}

function closeTaskModal() {
    modal.close();
    form.reset();
    formError.textContent = "";
}

function createTask() {
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!title) {
        formError.textContent = "Please add a task title.";
        titleInput.focus();
        return;
    }

    tasks.push({
        id: createId(),
        title,
        description: description || "No extra details added yet.",
        priority: priorityInput.value,
        status: statusInput.value
    });

    saveTasks();
    renderBoard();
    closeTaskModal();
}

function createId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderBoard() {
    taskLists.forEach((list) => {
        const status = list.dataset.list;
        list.innerHTML = "";

        tasks
            .filter((task) => task.status === status)
            .forEach((task) => list.appendChild(createTaskCard(task)));
    });

    updateCounts();
}

function createTaskCard(task) {
    const card = document.createElement("article");
    card.className = `task-card ${task.priority}`;
    card.draggable = false;
    card.dataset.taskId = task.id;

    const priority = document.createElement("span");
    priority.className = "priority-pill";
    priority.textContent = task.priority;

    const titleRow = document.createElement("div");
    titleRow.className = "task-title-row";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description;

    titleRow.append(title, deleteButton);
    card.append(priority, titleRow, description);

    card.addEventListener("pointerdown", (event) => startPointerDrag(event, card));
    card.addEventListener("mousedown", (event) => startMouseDrag(event, card));

    return card;
}

function deleteTask(taskId) {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();
    renderBoard();
}

function getCardAfterPointer(list, pointerY) {
    const cards = [...list.querySelectorAll(".task-card:not(.dragging)")];

    return cards.reduce((closest, card) => {
        const box = card.getBoundingClientRect();
        const offset = pointerY - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset, card };
        }

        return closest;
    }, { offset: Number.NEGATIVE_INFINITY, card: null }).card;
}

function syncTasksFromBoard() {
    const orderedTasks = [];

    taskLists.forEach((list) => {
        const status = list.dataset.list;
        list.querySelectorAll(".task-card").forEach((card) => {
            const task = tasks.find((item) => item.id === card.dataset.taskId);

            if (task) {
                orderedTasks.push({ ...task, status });
            }
        });
    });

    tasks = orderedTasks;
    updateCounts();
}

function startPointerDrag(event, card) {
    if (pointerDrag || event.button !== 0 || event.target.closest("button")) {
        return;
    }

    beginDragState(event, card);
    pointerDrag.type = "pointer";

    card.setPointerCapture(event.pointerId);
    card.addEventListener("pointermove", movePointerDrag);
    card.addEventListener("pointerup", endPointerDrag);
    card.addEventListener("pointercancel", cancelPointerDrag);
    document.addEventListener("mousemove", movePointerDrag);
    document.addEventListener("mouseup", endPointerDrag);
}

function startMouseDrag(event, card) {
    if (pointerDrag || event.button !== 0 || event.target.closest("button")) {
        return;
    }

    beginDragState(event, card);
    pointerDrag.type = "mouse";

    document.addEventListener("mousemove", movePointerDrag);
    document.addEventListener("mouseup", endPointerDrag);
}

function beginDragState(event, card) {
    const rect = card.getBoundingClientRect();

    pointerDrag = {
        card,
        placeholder: createPlaceholder(rect.height),
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        active: false,
        type: null
    };
}

function movePointerDrag(event) {
    if (!pointerDrag) {
        return;
    }

    const movedDistance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);

    if (!pointerDrag.active && movedDistance < 6) {
        return;
    }

    event.preventDefault();

    if (!pointerDrag.active) {
        activatePointerDrag();
    }

    positionDraggedCard(event.clientX, event.clientY);
    movePlaceholder(event.clientX, event.clientY);
}

function activatePointerDrag() {
    const { card, placeholder, width } = pointerDrag;
    const rect = card.getBoundingClientRect();

    card.parentElement.insertBefore(placeholder, card);
    card.classList.add("dragging");
    card.style.position = "fixed";
    card.style.left = `${rect.left}px`;
    card.style.top = `${rect.top}px`;
    card.style.width = `${width}px`;
    card.style.zIndex = "20";
    card.style.pointerEvents = "none";
    card.style.margin = "0";
    pointerDrag.active = true;
}

function positionDraggedCard(pointerX, pointerY) {
    pointerDrag.card.style.left = `${pointerX - pointerDrag.offsetX}px`;
    pointerDrag.card.style.top = `${pointerY - pointerDrag.offsetY}px`;
}

function movePlaceholder(pointerX, pointerY) {
    const target = document.elementFromPoint(pointerX, pointerY);
    const list = target?.closest(".task-list");

    taskColumns.forEach((column) => column.classList.remove("drag-over"));

    if (!list) {
        return;
    }

    list.closest(".task-column").classList.add("drag-over");

    const nextCard = getCardAfterPointer(list, pointerY);
    if (nextCard) {
        list.insertBefore(pointerDrag.placeholder, nextCard);
    } else {
        list.appendChild(pointerDrag.placeholder);
    }
}

function endPointerDrag(event) {
    if (!pointerDrag) {
        return;
    }

    const { card, placeholder, active } = pointerDrag;
    cleanupPointerListeners(card, event.pointerId);

    if (active && placeholder.parentElement) {
        placeholder.parentElement.insertBefore(card, placeholder);
        placeholder.remove();
        resetDraggedCard(card);
        syncTasksFromBoard();
        saveTasks();
        renderBoard();
    }

    taskColumns.forEach((column) => column.classList.remove("drag-over"));
    pointerDrag = null;
}

function cancelPointerDrag(event) {
    if (!pointerDrag) {
        return;
    }

    const { card, placeholder } = pointerDrag;
    cleanupPointerListeners(card, event.pointerId);
    placeholder.remove();
    resetDraggedCard(card);
    renderBoard();
    pointerDrag = null;
}

function createPlaceholder(height) {
    const placeholder = document.createElement("div");
    placeholder.className = "task-placeholder";
    placeholder.style.height = `${height}px`;
    return placeholder;
}

function cleanupPointerListeners(card, pointerId) {
    if (pointerDrag?.type === "pointer" && card.hasPointerCapture(pointerId)) {
        card.releasePointerCapture(pointerId);
    }

    card.removeEventListener("pointermove", movePointerDrag);
    card.removeEventListener("pointerup", endPointerDrag);
    card.removeEventListener("pointercancel", cancelPointerDrag);
    document.removeEventListener("mousemove", movePointerDrag);
    document.removeEventListener("mouseup", endPointerDrag);
}

function resetDraggedCard(card) {
    card.classList.remove("dragging");
    card.removeAttribute("style");
}

function updateCounts() {
    ["todo", "progress", "done"].forEach((status) => {
        const count = tasks.filter((task) => task.status === status).length;
        document.querySelector(`[data-count="${status}"]`).textContent = count;
    });
}
