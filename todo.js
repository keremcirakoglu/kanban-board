"use strict";

import { safeJSONParse, logError } from "./utils.js";
import { initTheme, applyTheme } from "./theme.js";
import { initDB, saveItem, getAllItems } from "./db.js";

// =======================
// Global Variables & Helpers
// =======================
let currentProject = "default"; // Current project identifier

// Returns the key used to store a project's name
const getProjectNameKey = () => `projectName_${currentProject}`;

// Returns the key used to store tasks for the current project
const getTasksKey = () => `tasks_${currentProject}`;

// =======================
// Cache DOM Elements
// =======================
const themeToggleButton = document.getElementById("theme-toggle");
const root = document.documentElement;
const projectNameInputContainer = document.getElementById("project-name-input-container");
const projectNameInput = document.getElementById("project-name-input");
const projectNameCreateBtn = document.getElementById("project-name-create-btn");
const projectNameDisplayContainer = document.getElementById("project-name-display-container");
const projectNameDisplay = document.getElementById("project-name-display");
const projectNameEditBtn = document.getElementById("project-name-edit-btn");
const lanes = document.querySelectorAll(".swim-lane");
const sidebarAddBtn = document.getElementById("sidebar-add-btn");
const PROJECTS_STORAGE_KEY = "projects";

// =======================
// Theme Management
// =======================
const githubIcon = document.querySelector("#github-btn img");

// Remove duplicate theme toggle event listener to avoid conflicting logic
// themeToggleButton.addEventListener("click", () => {
//   const isDark = root.style.getPropertyValue("--background") === "#1b1b1f";
//   applyTheme(!isDark);
// });

// =======================
// Project Name Management
// =======================

// Load project name and tasks on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initDB();
  } catch (error) {
    logError(error);
  }
  initTheme();
  loadProjectsList();
  // Ensure default project is active on page load
  switchProject("default");
  const savedName = localStorage.getItem(getProjectNameKey());
  if (savedName) {
    projectNameDisplay.textContent = savedName;
    projectNameInputContainer.style.display = "none";
    projectNameDisplayContainer.style.display = "flex";
  }
  loadTasksFromStorage();
  updateTaskCounts();
});

projectNameCreateBtn.addEventListener("click", createProjectName);
projectNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") createProjectName();
});

function createProjectName() {
  const projectName = projectNameInput.value.trim();
  if (!projectName) {
    alert("Project name cannot be empty!");
    return;
  }
  projectNameDisplay.textContent = projectName;
  projectNameInputContainer.style.display = "none";
  projectNameDisplayContainer.style.display = "flex";
  localStorage.setItem(getProjectNameKey(), projectName);
}

// Enable project name editing
projectNameEditBtn.addEventListener("click", () => {
  projectNameInputContainer.style.display = "flex";
  projectNameDisplayContainer.style.display = "none";
  projectNameInput.value = projectNameDisplay.textContent;
});

// =======================
// Task Management
// =======================

// Update task counters in each lane
function updateTaskCounts() {
  window.requestAnimationFrame(() => {
    lanes.forEach((lane) => {
      const counter = lane.querySelector(".lane-counter");
      const taskCount = lane.querySelectorAll(".task").length;
      counter.textContent = `(${taskCount})`;
    });
  });
}

// Create a task element
function createTask(value, laneId = "todo-lane") {
  const task = document.createElement("p");
  task.classList.add("task");
  task.setAttribute("draggable", "true");
  task.dataset.laneId = laneId;
  task.innerHTML = `
    <span class="task-content">${value}</span>
    <div class="task-buttons">
      <button class="edit-btn">
        <!-- Edit Icon SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25z"/>
        </svg>
      </button>
      <button class="delete-btn">
        <!-- Delete Icon SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path d="M170.5 51.6L151.5 80h145l-19-28.4c-1.5-2.2-4-3.6-6.7-3.6h-93.7c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6L354.2 80h61.8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8v304c0 44.2-35.8 80-80 80H120c-44.2 0-80-35.8-80-80V128h-8c-13.3 0-24-10.7-24-24S28.7 80 42 80h61.8l36.7-55.1C151.1 9.4 168.6 0 187.3 0h93.7c18.7 0 36.2 9.4 46.6 24.9zM80 128v304c0 17.7 14.3 32 32 32h224c17.7 0 32-14.3 32-32V128H80zm80 64v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16z"/>
        </svg>
      </button>
    </div>`;

  // ---------------------------
  // Edit task functionality
  // ---------------------------
  const editButton = task.querySelector(".edit-btn");
  editButton.addEventListener("click", () => {
    const taskContent = task.querySelector(".task-content");
    const currentText = taskContent.textContent;
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.value = currentText;
    editInput.classList.add("edit-input");
    taskContent.replaceWith(editInput);
    editInput.focus();
    task.removeAttribute("draggable");

    const saveEdit = () => {
      const newText = editInput.value.trim();
      if (newText) {
        const newContent = document.createElement("span");
        newContent.classList.add("task-content");
        newContent.textContent = newText;
        editInput.replaceWith(newContent);
        task.setAttribute("draggable", "true");
        saveTasksToStorage();
        updateTaskCounts();
      }
    };
    editInput.addEventListener("blur", saveEdit);
    editInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveEdit();
    });
  });

  // ---------------------------
  // Delete task functionality 
  // ---------------------------
  const deleteButton = task.querySelector(".delete-btn");
  deleteButton.addEventListener("click", () => {
    task.remove();
    saveTasksToStorage();
    updateTaskCounts();
  });

  // ---------------------------
  // Drag & Drop Events 
  // ---------------------------
  task.addEventListener("dragstart", () => task.classList.add("is-dragging"));
  task.addEventListener("dragend", () => {
    task.classList.remove("is-dragging");
    saveTasksToStorage();
    updateTaskCounts();
  });

  updateTaskCounts();
  return task;
}

// =======================
// Drag & Drop handlers for lanes
// =======================
lanes.forEach((lane) => {
  lane.addEventListener("dragover", (e) => {
    e.preventDefault();
    const draggingTask = document.querySelector(".is-dragging");
    const afterElement = getDragAfterElement(lane, e.clientY);
    const addButton = lane.querySelector(".add-task-btn");
    if (!afterElement || afterElement === addButton) {
      lane.insertBefore(draggingTask, addButton);
    } else {
      lane.insertBefore(draggingTask, afterElement);
    }
  });
  lane.addEventListener("dragend", () => {
    saveTasksToStorage();
    updateTaskCounts();
  });
});

// Determines the correct insertion point based on mouse position
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".task:not(.is-dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// =======================
// Persistent Storage Functions
// =======================
function saveTasksToStorage() {
  const tasks = [];
  lanes.forEach((lane) => {
    const laneId = lane.id;
    const laneTasks = [...lane.querySelectorAll(".task")].map((task) => ({
      text: task.querySelector(".task-content").textContent,
      laneId,
    }));
    tasks.push(...laneTasks);
  });
  localStorage.setItem(getTasksKey(), JSON.stringify(tasks));
}

function loadTasksFromStorage() {
  // Clear tasks in all lanes
  lanes.forEach((lane) => {
    lane.querySelectorAll(".task").forEach(task => task.remove());
  });
  const savedTasks = safeJSONParse(localStorage.getItem(getTasksKey()), []);
  savedTasks.forEach(({ text, laneId }) => {
    const task = createTask(text, laneId);
    const lane = document.getElementById(laneId);
    const addButton = lane.querySelector(".add-task-btn");
    lane.insertBefore(task, addButton);
  });
  updateTaskCounts();
}

// =======================
// New Task Input Handling
// =======================
document.querySelectorAll(".add-task-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const laneId = button.getAttribute("data-lane");
    if (button.nextElementSibling?.classList.contains("inline-input")) {
      button.nextElementSibling.remove();
      return;
    }
    const inputWrapper = document.createElement("div");
    inputWrapper.className = "inline-input";
    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.placeholder = "Enter task name...";
    // Add a unique name attribute for form autofill support.
    inputField.name = "new-task-input";
    const saveButton = document.createElement("button");
    saveButton.textContent = "Add";
    const saveTask = () => {
      const taskText = inputField.value.trim();
      if (taskText) {
        const task = createTask(taskText, laneId);
        document.getElementById(laneId).insertBefore(task, button);
        saveTasksToStorage();
        updateTaskCounts();
        inputWrapper.remove();
      }
    };
    inputField.addEventListener("keydown", (e) => { if(e.key === "Enter") saveTask(); });
    saveButton.addEventListener("click", saveTask);
    inputWrapper.append(inputField, saveButton);
    button.parentNode.insertBefore(inputWrapper, button.nextSibling);
    inputField.focus();
  });
});

// =======================
// Project Workspace Functions
// =======================
function switchProject(newProjectId) {
  currentProject = newProjectId;
  document.querySelectorAll(".project-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelector(`.project-btn[data-project="${newProjectId}"]`).classList.add("active");
  const savedName = localStorage.getItem(getProjectNameKey());
  if (savedName) {
    projectNameDisplay.textContent = savedName;
    projectNameInputContainer.style.display = "none";
    projectNameDisplayContainer.style.display = "flex";
  } else {
    projectNameDisplay.textContent = "";
    projectNameInputContainer.style.display = "flex";
    projectNameDisplayContainer.style.display = "none";
  }
  loadTasksFromStorage();
  updateTaskCounts();
}

sidebarAddBtn.addEventListener("click", () => {
  const currentProjects = safeJSONParse(localStorage.getItem(PROJECTS_STORAGE_KEY), []);
  if (currentProjects.length >= 10) {
    alert("Maximum 10 projects can be created.");
    return;
  }
  const newProjName = prompt("Enter new project name:");
  if (!newProjName) return;
  const newProjId = "project_" + Date.now();
  // Save project data for new workspace
  localStorage.setItem(`projectName_${newProjId}`, newProjName);
  localStorage.setItem(`tasks_${newProjId}`, JSON.stringify([]));
  currentProjects.push({ id: newProjId, name: newProjName });
  saveProjectList(currentProjects);
  loadProjectsList();
  switchProject(newProjId); // Mark the new project as active
});

// Attach project switching for default project button
document.querySelector('.project-btn[data-project="default"]').addEventListener("click", () => switchProject("default"));

// =======================
// Projects List Management
// =======================
function loadProjectsList() {
  const projectsListContainer = document.getElementById("projects-list");
  projectsListContainer.innerHTML = "";
  projects = safeJSONParse(localStorage.getItem(PROJECTS_STORAGE_KEY), []);
  projects.forEach(({ id, name }) => {
    const container = document.createElement("div");
    container.className = "project-btn-container";
    
    const projBtn = document.createElement("button");
    projBtn.className = "project-btn";
    projBtn.textContent = name.length > 3 ? name.slice(0, 3) : name;
    projBtn.dataset.project = id;
    projBtn.addEventListener("click", () => switchProject(id));
    
    const delBtn = document.createElement("button");
    delBtn.className = "delete-project-btn";
    delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
      <path d="M135.2 17.7C140.6 7.7 150.9 0 162.2 0h123.5c11.3 0 21.6 7.7 27 17.7L320 32H432c8.8 0 16 7.2 16 16s-7.2 16-16 16h-16l-21.2 339.8c-1.8 28.8-25 51.2-53.8 51.2H90.9c-28.8 0-52-22.4-53.8-51.2L16 64H0C-7.2 64-16 56.8-16 48s7.2-16 16-16h112l7.2-14.3zM192 64l-8 32h160l-8-32H192z"/>
    </svg>`;
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (id === "default") {
        alert("Default project cannot be deleted!");
        return;
      }
      if (confirm(`Delete project "${name}"?`)) {
        localStorage.removeItem(`projectName_${id}`);
        localStorage.removeItem(`tasks_${id}`);
        let updatedProjects = safeJSONParse(localStorage.getItem(PROJECTS_STORAGE_KEY), []);
        updatedProjects = updatedProjects.filter(p => p.id !== id);
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
        if (currentProject === id) {
          switchProject("default");
        }
        container.remove();
      }
    });
    container.append(projBtn, delBtn);
    projectsListContainer.appendChild(container);
  });
}

function saveProjectList(projects) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

let projects = safeJSONParse(localStorage.getItem(PROJECTS_STORAGE_KEY), []);
if (!projects.find(p => p.id === "default")) {
  projects.push({ id: "default", name: "Default" });
  saveProjectList(projects);
}