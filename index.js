// Import helper functions from utils
import { getTasks, createNewTask, putTask, deleteTask } from './utils/taskFunctions.js';
// Import initialData
import { initialData } from './initialData.js';

/*******
* FIX BUGS!!!
* ******/

// Function to initialize data in local storage
function initializeData() {
  if (!localStorage.getItem("tasks")) {
    localStorage.setItem("tasks", JSON.stringify(initialData));
    localStorage.setItem("showSideBar", "true");
  } else {
    console.log("Data already exists in localStorage");
  }
}

// Get elements from the DOM
const elements = {
  sideBar: document.getElementById("side-bar-div"),
  logo: document.getElementById("logo"),
  headerBoardName: document.getElementById("header-board-name"),
  editBoardBtn: document.getElementById("edit-board-btn"),
  editBoardDiv: document.getElementById("editBoardDiv"),
  columnDivs: document.querySelectorAll(".column-div"),
  hideSideBarBtn: document.getElementById("hide-side-bar-btn"),
  showSideBarBtn: document.getElementById("show-side-bar-btn"),
  themeSwitch: document.getElementById("switch"),
  addNewTaskBtn: document.getElementById("add-new-task-btn"),
  modalWindow: document.getElementById("new-task-modal-window"),
  titleInput: document.getElementById("title-input"),
  descInput: document.getElementById("desc-input"),
  statusInput: document.getElementById("select-status"),
  createTaskBtn: document.getElementById("create-task-btn"),
  cancelAddTaskBtn: document.getElementById("cancel-add-task-btn"),
  editTaskModal: document.getElementsByClassName("edit-task-modal-window")[0],
  editTaskTitleInput: document.getElementById("edit-task-title-input"),
  editTaskDescInput: document.getElementById("edit-task-desc-input"),
  editSelectStatus: document.getElementById("edit-select-status"),
  filterDiv: document.getElementById("filterDiv"),
  saveTaskChangesBtn: document.getElementById("save-task-changes-btn"),
  deleteTaskBtn: document.getElementById("delete-task-btn"),
};

let activeBoard = "";
let currentTaskId = null; // To store the ID of the task being edited or deleted

// Extract unique board names from tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard || boards[0]; // Use the first board if none found
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ""; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener("click", () => {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; // Assign active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from local storage
  const filteredTasks = tasks.filter(task => task.board === boardName);

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute("data-task-id", task.id);

      // Listen for a click event on each task and open a modal
      taskElement.addEventListener("click", () => {
        openEditTaskModal(task);
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}

// Refresh the displayed tasks UI
function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
    if (btn.textContent === boardName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Adds a task to the UI
function addTaskToUI(task) {
  // Correct selector with backticks for template literals
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`);
  
  if (!column) {
    // Added quotes around error message strings
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  // Check for the existence of tasks container
  let tasksContainer = column.querySelector('.tasks-container');
  
  if (!tasksContainer) {
    // Added quotes around warning message strings
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    
    // Create the container if it doesn't exist
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title;
  taskElement.setAttribute('data-task-id', task.id);

  tasksContainer.appendChild(taskElement); 
}

// Sets up event listeners for various elements
function setupEventListeners() {
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener("click", () => toggleModal(false, elements.editTaskModal));

  const cancelAddTaskBtn = elements.cancelAddTaskBtn;
  cancelAddTaskBtn.addEventListener("click", () => {
    toggleModal(false);
    elements.filterDiv.style.display = "none"; // Also hide the filter overlay
  });

  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  elements.hideSideBarBtn.addEventListener("click", () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener("click", () => toggleSidebar(true));

  elements.themeSwitch.addEventListener('change', toggleTheme);

  elements.addNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  elements.modalWindow.addEventListener('submit', (event) => {
    addTask(event);
  });

  // Save task changes listener
  elements.saveTaskChangesBtn.addEventListener('click', () => {
    if (currentTaskId) {
      saveTaskChanges(currentTaskId);  // Pass the current task ID
    }
  });

  // Attach delete task listener
  elements.deleteTaskBtn.addEventListener('click', () => {
    if (currentTaskId) {
      deleteTask(currentTaskId);
      refreshTasksUI();
      toggleModal(false, elements.editTaskModal);
    }
  });
}

// Toggles tasks modal
function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? 'block' : 'none';
}

/*************************************************
 * COMPLETE FUNCTION CODE
 * ************************************************/ 

function addTask(event) {
  event.preventDefault();

  // Assign user input to the task object
  const task = {
    title: elements.titleInput.value,
    description: elements.descInput.value,
    status: elements.statusInput.value,
    board: activeBoard,
  };

  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
    event.target.reset();
    refreshTasksUI();
  }
}

// Function to toggle the sidebar visibility
function toggleSidebar(show) {
  elements.showSideBarBtn.style.display = show ? "none" : "block";
  elements.sideBar.style.display = show ? "block" : "none";
}

// Function to switch the theme
function toggleTheme(event) {
  document.body.classList.toggle("light-theme");
  const isLightTheme = document.body.classList.contains("light-theme");

  localStorage.setItem("light-theme", isLightTheme ? "enabled" : "disabled");
  elements.themeSwitch.checked = isLightTheme;
  elements.logo.src = elements.logo.src
    .replace(window.location.origin, ".")
    .replace(isLightTheme ? "dark" : "light", isLightTheme ? "light" : "dark");
}

// Opens the edit task modal and sets its values
function openEditTaskModal(task) {
  elements.editTaskTitleInput.value = task.title;
  elements.editTaskDescInput.value = task.description;
  const selectedStatus = elements.editSelectStatus.querySelector(option[value="${task.status}"]);
  if (selectedStatus) {
    selectedStatus.selected = true;
  }

  currentTaskId = task.id; // Store the task ID for saving changes or deleting
  toggleModal(true, elements.editTaskModal);
}

// Saves changes to a task
function saveTaskChanges(taskId) {
  if (!taskId) return; // If there's no task ID, do nothing

  const updatedTask = {
    id: taskId,
    title: elements.editTaskTitleInput.value,
    description: elements.editTaskDescInput.value,
    status: elements.editSelectStatus.value,
    board: activeBoard,
  };

  putTask(taskId, updatedTask); // Update task using a helper function
  toggleModal(false, elements.editTaskModal); // Close the modal
  refreshTasksUI(); // Refresh the UI to reflect the changes
}

// Initialization process
document.addEventListener("DOMContentLoaded", function () {
  init(); // Init called after DOM is fully loaded
});

// Execute the initialization function
function init() {
  initializeData();
  setupEventListeners();
  const showSidebar = localStorage.getItem("showSideBar") === "true";
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem("light-theme") === "enabled";
  document.body.classList.toggle("light-theme", isLightTheme);
  elements.themeSwitch.checked = isLightTheme;
  elements.logo.src = elements.logo.src
    .replace(window.location.origin, ".")
    .replace(isLightTheme ? "dark" : "light", isLightTheme ? "light" : "dark");
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}