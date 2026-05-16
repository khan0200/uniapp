/**
 * TASKS MANAGEMENT MODULE
 * Handles CRUD operations for tasks with Firestore realtime updates
 */

// Global reference for task modal
let taskModal = null;
let taskViewModal = null;

// Initialize Tasks Module
function initTasks() {
    console.log("📝 Initializing Tasks Module...");
    taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
    taskViewModal = new bootstrap.Modal(document.getElementById('taskViewModal'));
    
    // Set up realtime listener
    if (typeof db !== 'undefined' && db !== null) {
        listenToTasks();
    } else {
        renderTasks([]);
        showTasksEmptyState("Firestore not initialized. Tasks unavailable.");
    }
}

// Realtime Listener for Tasks
function listenToTasks() {
    db.collection('tasks')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            const tasks = [];
            snapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() });
            });
            renderTasks(tasks);
            updateTaskStats(tasks);
        }, (error) => {
            console.error("❌ Firestore listener error:", error);
            showTasksErrorState();
        });
}

// Render Tasks Cards
function renderTasks(tasks) {
    const container = document.getElementById('tasksList');
    if (!container) return;

    if (tasks.length === 0) {
        showTasksEmptyState("No tasks yet. Click 'Add Task' to get started.");
        return;
    }

    let html = "";
    tasks.forEach((task) => {
        const priorityColor = getPriorityColor(task.priority);
        const priorityLabel = getPriorityLabel(task.priority);
        const dueDate = task.dueDate ? formatDate(task.dueDate) : "No date";
        const createdAt = task.createdAt ? formatDate(task.createdAt) : "Just now";

        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card-apple h-100 p-3 d-flex flex-column shadow-sm" style="border-top: 4px solid ${priorityColor};">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge rounded-pill" style="background-color: ${priorityColor}15; color: ${priorityColor}; font-weight: 700; border: 1px solid ${priorityColor}30;">
                            ${priorityLabel}
                        </span>
                        <div class="dropdown">
                            <button class="btn btn-sm text-secondary p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end border-0 shadow-apple" style="border-radius: 12px;">
                                <li><a class="dropdown-item py-2" href="#" onclick="editTask('${task.id}'); return false;"><i class="bi bi-pencil me-2"></i>Edit</a></li>
                                <li><a class="dropdown-item py-2 text-danger" href="#" onclick="confirmDeleteTask('${task.id}'); return false;"><i class="bi bi-trash me-2"></i>Delete</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <p class="mb-3 flex-grow-1 task-description-text" 
                       style="font-weight: 500; line-height: 1.5; white-space: pre-wrap; cursor: pointer; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;" 
                       onclick="viewTask('${task.id}')"
                       title="Click to view full details">
                        ${task.taskText}
                    </p>
                    
                    <div class="mt-auto pt-3 border-top border-light d-flex justify-content-between align-items-center">
                        <div class="d-flex flex-column">
                            <span class="text-secondary small fw-bold text-uppercase">Due Date</span>
                            <span class="small fw-bold ${isOverdue(task.dueDate) ? 'text-danger' : ''}">
                                <i class="bi bi-calendar-event me-1"></i>${dueDate}
                            </span>
                        </div>
                        <div class="d-flex flex-column text-end">
                            <span class="text-secondary small fw-bold text-uppercase">Created</span>
                            <span class="small text-secondary">${createdAt}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Stats Update
function updateTaskStats(tasks) {
    const totalEl = document.getElementById('totalTasksCount');
    const highEl = document.getElementById('highPriorityCount');
    
    if (totalEl) totalEl.textContent = tasks.length;
    if (highEl) {
        const highCount = tasks.filter(t => t.priority === 'high').length;
        highEl.textContent = highCount;
    }
}

// Modal Actions
function openAddTaskModal() {
    document.getElementById('taskModalLabel').textContent = "Add New Task";
    document.getElementById('taskEditId').value = "";
    document.getElementById('taskText').value = "";
    document.getElementById('taskDueDate').value = "";
    document.getElementById('taskPriority').value = "medium";
    taskModal.show();
}

async function saveTask() {
    const id = document.getElementById('taskEditId').value;
    const taskText = document.getElementById('taskText').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const saveBtn = document.getElementById('saveTaskBtn');

    if (!taskText || !dueDate) {
        if (typeof showNotification === 'function') {
            showNotification("Please fill in all required fields", "warning");
        } else {
            alert("Please fill in all required fields");
        }
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const taskData = {
        taskText,
        dueDate: firebase.firestore.Timestamp.fromDate(new Date(dueDate)),
        priority,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (id) {
            // Update
            await db.collection('tasks').doc(id).update(taskData);
            if (typeof showNotification === 'function') showNotification("Task updated successfully", "success");
        } else {
            // Create
            taskData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('tasks').add(taskData);
            if (typeof showNotification === 'function') showNotification("Task created successfully", "success");
        }
        taskModal.hide();
    } catch (error) {
        console.error("❌ Error saving task:", error);
        if (typeof showNotification === 'function') showNotification("Failed to save task", "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = id ? "Update Task" : "Save Task";
    }
}

async function editTask(id) {
    try {
        const doc = await db.collection('tasks').doc(id).get();
        if (!doc.exists) return;

        const data = doc.data();
        document.getElementById('taskModalLabel').textContent = "Edit Task";
        document.getElementById('taskEditId').value = id;
        document.getElementById('taskText').value = data.taskText;
        
        if (data.dueDate) {
            const date = data.dueDate.toDate();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            document.getElementById('taskDueDate').value = `${year}-${month}-${day}`;
        }
        
        document.getElementById('taskPriority').value = data.priority;
        document.getElementById('saveTaskBtn').textContent = "Update Task";
        taskModal.show();
    } catch (error) {
        console.error("❌ Error fetching task for edit:", error);
    }
}

async function confirmDeleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        try {
            await db.collection('tasks').doc(id).delete();
            if (typeof showNotification === 'function') showNotification("Task deleted successfully", "success");
        } catch (error) {
            console.error("❌ Error deleting task:", error);
            if (typeof showNotification === 'function') showNotification("Failed to delete task", "error");
        }
    }
}

// Helper Functions
function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return '#dc3545';
        case 'medium': return '#ffc107';
        case 'low': return '#28a745';
        default: return '#6c757d';
    }
}

function getPriorityLabel(priority) {
    switch (priority) {
        case 'high': return '🔴 HIGH';
        case 'medium': return '🟡 MEDIUM';
        case 'low': return '🟢 LOW';
        default: return 'PRIORITY';
    }
}

function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(timestamp) {
    if (!timestamp) return false;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

function showTasksEmptyState(message) {
    const container = document.getElementById('tasksList');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-clipboard-x icon-empty-state" style="font-size: 3rem; opacity: 0.3;"></i>
                <p class="text-secondary mt-3">${message}</p>
            </div>
        `;
    }
}

function showTasksErrorState() {
    showTasksEmptyState("Error loading tasks. Please check your connection or try again.");
}

// View task details in a separate modal
async function viewTask(id) {
    try {
        const doc = await db.collection('tasks').doc(id).get();
        if (!doc.exists) return;

        const data = doc.data();
        const priorityColor = getPriorityColor(data.priority);
        const priorityLabel = getPriorityLabel(data.priority);
        
        document.getElementById('viewTaskPriorityBadge').innerHTML = `
            <span class="badge rounded-pill" style="background-color: ${priorityColor}15; color: ${priorityColor}; font-weight: 700; border: 1px solid ${priorityColor}30;">
                ${priorityLabel}
            </span>
        `;
        document.getElementById('viewTaskText').textContent = data.taskText;
        document.getElementById('viewTaskDueDate').innerHTML = `
            <span class="${isOverdue(data.dueDate) ? 'text-danger' : ''}">
                <i class="bi bi-calendar-event me-1"></i>${data.dueDate ? formatDate(data.dueDate) : "No date"}
            </span>
        `;
        document.getElementById('viewTaskCreatedAt').textContent = data.createdAt ? formatDate(data.createdAt) : "Just now";
        
        taskViewModal.show();
    } catch (error) {
        console.error("❌ Error fetching task for view:", error);
    }
}

// Call init when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on management.html and the tasks-tab exists
    if (document.getElementById('tasks-tab')) {
        // Wait a bit for firebase to be initialized
        setTimeout(initTasks, 1000);
    }
});
