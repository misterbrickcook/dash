// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loading...');
    
    // Tab Navigation System
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    function showTab(tabId) {
        console.log('Switching to tab:', tabId);
        
        // Hide all tab contents
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all nav links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected tab content
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Add active class to corresponding nav link
        const targetNavLink = document.querySelector(`[data-tab="${tabId}"]`);
        if (targetNavLink && targetNavLink.classList.contains('nav-link')) {
            targetNavLink.classList.add('active');
        }
    }

    // Navigation click handlers
    navLinks.forEach(link => {
        link.onclick = function() {
            const tabId = this.getAttribute('data-tab');
            showTab(tabId);
        };
    });
    
    // Routine Toggle Functionality
    const routineButtons = document.querySelectorAll('[data-routine]');
    const morningRoutine = document.getElementById('morning-routine');
    const eveningRoutine = document.getElementById('evening-routine');
    const routineTitle = document.getElementById('routine-title');
    
    function showRoutine(routineType) {
        if (routineType === 'morning') {
            if (morningRoutine) morningRoutine.style.display = 'flex';
            if (eveningRoutine) eveningRoutine.style.display = 'none';
            if (routineTitle) routineTitle.textContent = '☀️ Morgenroutine';
        } else if (routineType === 'evening') {
            if (morningRoutine) morningRoutine.style.display = 'none';
            if (eveningRoutine) eveningRoutine.style.display = 'flex';
            if (routineTitle) routineTitle.textContent = '🌙 Abendroutine';
        }
    }
    
    // Routine toggle event listeners
    routineButtons.forEach(button => {
        button.onclick = function() {
            const routineType = this.getAttribute('data-routine');
            
            // Remove active class from all routine toggle buttons
            routineButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show appropriate routine
            showRoutine(routineType);
        };
    });
    
    // Other navigation buttons
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-tab') && !e.target.classList.contains('nav-link')) {
            const tabId = e.target.getAttribute('data-tab');
            showTab(tabId);
        }
    });
    
    // Set default values for new todos
    const newTaskDate = document.getElementById('newTaskDate');
    const newTaskTime = document.getElementById('newTaskTime');
    
    function getTodayString() {
        const today = new Date();
        return today.getFullYear() + '-' + 
            String(today.getMonth() + 1).padStart(2, '0') + '-' + 
            String(today.getDate()).padStart(2, '0');
    }
    
    if (newTaskDate) {
        newTaskDate.value = getTodayString();
    }
    
    if (newTaskTime) {
        newTaskTime.value = '20:00';
    }
    
    // Todo Filter System
    let currentTodoFilter = 'heute';
    const todoFilters = document.querySelectorAll('.tabs .tab[data-filter]');
    const todoFilterContainers = document.querySelectorAll('.todo-filter');
    
    function showTodoFilter(filterName) {
        currentTodoFilter = filterName;
        console.log('Switching to filter:', filterName);
        
        // Update active tab
        todoFilters.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-filter') === filterName) {
                tab.classList.add('active');
            }
        });

        // Show/hide filter containers
        todoFilterContainers.forEach(container => {
            if (container.getAttribute('data-filter') === filterName) {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        });
    }
    
    // Todo filter click handlers
    todoFilters.forEach(tab => {
        tab.onclick = function() {
            const filterName = this.getAttribute('data-filter');
            showTodoFilter(filterName);
        };
    });
    
    // Todo creation functionality
    const addTaskBtn = document.getElementById('addTaskBtn');
    const newTaskInput = document.getElementById('newTaskInput');
    const newTaskCategory = document.getElementById('newTaskCategory');
    let taskCounter = 0;
    
    function createTaskElement(taskText, category, date, time) {
        const taskId = 'task_' + (++taskCounter);
        
        // Get category icon
        let icon = 'circle';
        switch(category) {
            case 'privat': icon = 'home'; break;
            case 'arbeit': icon = 'briefcase'; break;
            case 'uni': icon = 'book-open'; break;
        }

        // Format date display
        let displayText = 'Heute';
        if (date) {
            const taskDate = new Date(date);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            today.setHours(0, 0, 0, 0);
            tomorrow.setHours(0, 0, 0, 0);
            taskDate.setHours(0, 0, 0, 0);
            
            if (taskDate.getTime() === today.getTime()) {
                displayText = time ? time : 'Heute';
            } else if (taskDate.getTime() === tomorrow.getTime()) {
                displayText = time ? `Morgen ${time}` : 'Morgen';
            } else if (taskDate < today) {
                displayText = time ? `Überfällig ${time}` : 'Überfällig';
            } else {
                const options = { day: '2-digit', month: '2-digit' };
                displayText = taskDate.toLocaleDateString('de-DE', options);
                if (time) displayText += ` ${time}`;
            }
        } else if (time) {
            displayText = time;
        }

        const taskElement = document.createElement('div');
        taskElement.className = 'checkbox-item';
        taskElement.setAttribute('data-category', category);
        taskElement.setAttribute('data-date', date || '');
        taskElement.innerHTML = `
            <input type="checkbox" id="${taskId}">
            <label for="${taskId}">${taskText}</label>
            <div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="${icon}" style="width: 14px; height: 14px; color: #666;"></i>
                <span style="font-size: 0.8rem; color: #666;">${displayText}</span>
            </div>
        `;

        // Add checkbox event listener
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            handleTaskCheck(this, taskText, category, icon, taskId);
        });

        return taskElement;
    }
    
    // Handle task check and archiving
    function handleTaskCheck(checkbox, taskText, category, icon, taskId) {
        const label = checkbox.nextElementSibling;
        
        if (checkbox.checked) {
            // Make task look completed
            label.style.textDecoration = 'line-through';
            label.style.color = '#999';
            
            console.log('Task checked, scheduling archive for:', taskText, 'ID:', taskId);
            
            // Schedule archiving after 2 seconds
            setTimeout(() => {
                if (checkbox.checked) { // Double-check it's still checked
                    console.log('Archiving task:', taskText);
                    archiveTask(taskText, category, icon);
                    removeTaskFromAllFilters(taskId);
                } else {
                    console.log('Task was unchecked, not archiving');
                }
            }, 2000);
        } else {
            // Restore normal appearance
            label.style.textDecoration = 'none';
            label.style.color = 'inherit';
        }
    }
    
    // Archive completed task
    function archiveTask(taskText, category, icon) {
        const archiveContainer = document.querySelector('[data-filter="archiv"] .checkbox-group');
        if (archiveContainer) {
            const archivedTaskElement = document.createElement('div');
            archivedTaskElement.className = 'checkbox-item';
            archivedTaskElement.setAttribute('data-category', category);
            archivedTaskElement.innerHTML = `
                <input type="checkbox" checked disabled>
                <label style="text-decoration: line-through; color: #ccc;">${taskText}</label>
                <div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="${icon}" style="width: 14px; height: 14px; color: #ccc;"></i>
                    <span style="font-size: 0.8rem; color: #ccc;">Heute</span>
                </div>
            `;
            
            archiveContainer.appendChild(archivedTaskElement);
            
            // Re-initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Show notification
            showArchiveNotification(taskText);
        }
    }
    
    // Remove task from all active filters using ID
    function removeTaskFromAllFilters(taskId) {
        console.log('Removing task with ID:', taskId);
        const allTaskElements = document.querySelectorAll('.todo-filter:not([data-filter="archiv"]) .checkbox-item');
        let removed = 0;
        allTaskElements.forEach(task => {
            const checkbox = task.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.id === taskId) {
                console.log('Found and removing task element');
                task.remove();
                removed++;
            }
        });
        console.log('Removed', removed, 'task elements');
    }
    
    // Show archive notification
    function showArchiveNotification(taskText) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-size: 0.9rem;
            max-width: 300px;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>📦</span>
                <div>
                    <div style="font-weight: 500;">Todo archiviert</div>
                    <div style="font-size: 0.8rem; opacity: 0.9;">"${taskText.length > 30 ? taskText.substring(0, 30) + '...' : taskText}"</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    function addTaskToFilters(taskElement, category, date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = date ? new Date(date) : today;
        taskDate.setHours(0, 0, 0, 0);
        
        // Determine which filters to add the task to
        let categories = ['alle', category];
        
        // Only add to 'heute' if task is for today or overdue
        if (!date || taskDate.getTime() <= today.getTime()) {
            categories.push('heute');
        }
        
        const categories_unique = [...new Set(categories)];
        
        categories_unique.forEach(filterName => {
            const container = document.querySelector(`[data-filter="${filterName}"] .checkbox-group`);
            if (container) {
                const taskToAdd = taskElement.cloneNode(true);
                
                // Re-add event listeners to cloned elements
                const checkbox = taskToAdd.querySelector('input[type="checkbox"]');
                const label = taskToAdd.querySelector('label');
                const taskText = label.textContent;
                const iconElement = taskToAdd.querySelector('i[data-lucide]');
                const icon = iconElement ? iconElement.getAttribute('data-lucide') : 'circle';
                
                checkbox.addEventListener('change', function() {
                    handleTaskCheck(this, taskText, category, icon, checkbox.id);
                });
                
                container.appendChild(taskToAdd);
            }
        });

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    if (addTaskBtn && newTaskInput && newTaskCategory) {
        addTaskBtn.onclick = function() {
            const taskText = newTaskInput.value.trim();
            const category = newTaskCategory.value;
            const date = newTaskDate ? newTaskDate.value : '';
            const time = newTaskTime ? newTaskTime.value : '';
            
            if (taskText) {
                console.log('Creating task:', taskText, category, date, time);
                
                const taskElement = createTaskElement(taskText, category, date, time);
                addTaskToFilters(taskElement, category, date);
                
                // Clear inputs after creating task
                newTaskInput.value = '';
                // Reset to defaults
                if (newTaskDate) newTaskDate.value = getTodayString();
                if (newTaskTime) newTaskTime.value = '20:00';
            }
        };
        
        // Allow Enter key to add task
        newTaskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTaskBtn.click();
            }
        });
    }
    
    // Initialize existing checkboxes for consistent behavior
    function initializeExistingCheckboxes() {
        const existingCheckboxes = document.querySelectorAll('.checkbox-item input[type="checkbox"]:not([disabled])');
        existingCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const label = this.nextElementSibling;
                if (this.checked) {
                    label.style.textDecoration = 'line-through';
                    label.style.color = '#999';
                } else {
                    label.style.textDecoration = 'none';
                    label.style.color = 'inherit';
                }
            });
        });
    }
    
    // Initialize todo system
    showTodoFilter('heute'); // Start with 'heute' filter
    initializeExistingCheckboxes(); // Make existing checkboxes consistent
    
    console.log('Dashboard initialized successfully! 🚀');
});