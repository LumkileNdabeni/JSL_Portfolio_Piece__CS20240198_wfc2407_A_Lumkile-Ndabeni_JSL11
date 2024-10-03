// TASK: import helper functions from utils 
import { getTasks, createNewTask, patchTask, putTask, deleteTask } from './utils/taskFunctions.js';
// TASK: import initialData 
import { initialData } from './initialData.js';

/*************************************************************************************************************************************************
 * FIX BUGS!!!
 * **********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true')
  } else {
    console.log('Data already exists in localStorage');
  }
}

// TASK: Get elements from the DOM
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

}

let activeBoard = ""
let currentTaskId = null; // To store the ID of the task being edited or deleted


// Extracts unique board names from tasks
// TASK: FIX BUGS
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"))
    activeBoard = localStorageBoard || boards[0]; // Fixed logic erroe using "||"
    elements.headerBoardName.textContent = activeBoard
    styleActiveBoard(activeBoard)
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
// TASK: Fix Bugs
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener("click", () =>  {  // Corrected evenListener
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board //assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard))
      styleActiveBoard(activeBoard)
    });
    boardsContainer.appendChild(boardElement);
  });

}

// Filters tasks corresponding to the board name and displays them on the DOM.
// TASK: Fix Bugs
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board = boardName);

  // Ensure the column titles are set outside of this function or correctly initialized before this function runs

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status = status).forEach(task => { 
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      // Listen for a click event on each task and open a modal
      taskElement.addEventListener("click", () => {  // Corrected eventListener
        openEditTaskModal(task);
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}


function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
// TASK: Fix Bugs
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {  // Corrected forEach method
    
    if(btn.textContent === boardName) {
      btn.add('active') 
    }
    else {
      btn.remove('active'); 
    }
  });
}


function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`); // Fix the querySelector using backticks for template literals
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute('data-task-id', task.id);
  
  tasksContainer.appendChild(taskElement);  // Appended taskElement
}



function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', () => toggleModal(false, elements.editTaskModal));

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn'); // = elements.cancelAddTaskBtn
  cancelAddTaskBtn.addEventListener('click', () => { // Correced eventListener
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false)); // Corrected eventListener
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));  

  // Theme switch event listener
  elements.themeSwitch.addEventListener('change', toggleTheme);

  // Event listener for the "Add New Task" button
elements.addNewTaskBtn.addEventListener('click', () => {
  // When the button is clicked, display the task creation modal and filter overlay
  toggleModal(true); // Show the modal for creating a new task
  elements.filterDiv.style.display = 'block'; // Also display the filter overlay for a better UI experience
});

// Event listener for the task creation modal form submission
elements.modalWindow.addEventListener('submit', (event) => {
  // When the form is submitted, call the addTask function to handle the task creation
  addTask(event);
});

// Event listener for the "Save Task Changes" button
elements.saveTaskChangesBtn.addEventListener('click', () => {
  // Check if there's a current task ID, meaning an active task is being edited
  if (currentTaskId) {
    // If a task is being edited, pass the task ID and save the changes
    saveTaskChanges(currentTaskId);  // Update the task with the current task ID
  }
});

// Event listener for the "Delete Task" button
elements.deleteTaskBtn.addEventListener('click', () => {
  // Check if a task is being edited (i.e., there is a current task ID)
  if (currentTaskId) {
    // If there is a task ID, proceed to delete the task
    deleteTask(currentTaskId); // Delete the specific task
    refreshTasksUI(); // Refresh the task display on the UI
    toggleModal(false, elements.editTaskModal); // Close the edit modal after deleting
  }
});
}

// Toggles tasks modal
function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? 'block' : 'none';
}

/*************************************************************************************************************************************************
 * COMPLETE FUNCTION CODE
 * **********************************************************************************************************************************************/

function addTask(event) {
  event.preventDefault(); 

// Create a task object with the input values from the form  
 const task = { 
    title: elements.titleInput.value,
    description: elements.descInput.value,
    status: elements.statusInput.value,
    board: activeBoard,
  };

    const newTask = createNewTask(task);
    if (newTask) {
      addTaskToUI(newTask);
      toggleModal(false, elements.modalWindow); // Close the modal by setting its display to 'none'
      elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
      event.target.reset();
      refreshTasksUI();
    }
}

// Function to toggle the visibility of the sidebar
function toggleSidebar(show) {
  elements.showSideBarBtn.style.display = show ? 'none' : 'block';
  elements.sideBar.style.display = show ? 'block' : 'none';
  elements.hideSideBarBtn.style.display = show ? 'block' : 'none';
}

// Function to toggle between light and dark theme
function toggleTheme(event) {
  const isLightTheme = document.body.classList.toggle("light-theme");
  // Set the checkbox state based on the theme (checked if light theme is applied)
  elements.themeSwitch.checked = isLightTheme ? true : false;
// Change the logo image source based on the theme
  elements.logo.src = elements.logo.src.includes("dark") 
      ? elements.logo.src.replace("dark", "light") 
      : elements.logo.src.replace("light", "dark");
}



function openEditTaskModal(task) {
  // Set task details in modal inputs
  

  // Get button elements from the task modal


  // Call saveTaskChanges upon click of Save Changes button
 

  // Delete task using a helper function and close the task modal


  toggleModal(true, elements.editTaskModal); // Show the edit task modal
}

function saveTaskChanges(taskId) {
  // Get new user inputs
  

  // Create an object with the updated task details


  // Update task using a hlper functoin
 

  // Close the modal and refresh the UI to reflect the changes

  refreshTasksUI();
}

/*************************************************************************************************************************************************/

document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
});

function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}