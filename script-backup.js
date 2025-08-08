// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', function() {
    // Tab Navigation System
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const quickTiles = document.querySelectorAll('.quick-tile[data-tab]');

    function showTab(tabId) {
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
        if (targetNavLink) {
            targetNavLink.classList.add('active');
        }
    }

    // Navigation click handlers - simple approach
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            showTab(tabId);
        });
    });

    // Quick tile click handlers
    quickTiles.forEach(tile => {
        tile.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            showTab(tabId);
        });
    });

    // Button navigation handlers (for "Alle Aufgaben anzeigen" etc.)
    const navButtons = document.querySelectorAll('button[data-tab]');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (tabId) {
                showTab(tabId);
            }
        });
    });

    // Demo mood selection
    const moodEmojis = document.querySelectorAll('.mood-emoji');
    moodEmojis.forEach(emoji => {
        emoji.addEventListener('click', function() {
            // Remove selected class from all mood emojis
            moodEmojis.forEach(e => e.classList.remove('selected'));
            // Add selected class to clicked emoji
            this.classList.add('selected');
        });
    });

    // Demo checkbox interactions
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:not([disabled])');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.checked) {
                label.style.textDecoration = 'line-through';
                label.style.color = '#999';
            } else {
                label.style.textDecoration = 'none';
                label.style.color = 'inherit';
            }
            
            // Update progress bars (simple demo)
            updateProgressBars();
        });
    });

    // Progress bar update function
    function updateProgressBars() {
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            // Simple demo calculation
            const section = bar.closest('.section, .card');
            if (section) {
                const checkboxes = section.querySelectorAll('input[type="checkbox"]:not([disabled])');
                const checked = section.querySelectorAll('input[type="checkbox"]:checked:not([disabled])');
                if (checkboxes.length > 0) {
                    const percentage = Math.round((checked.length / checkboxes.length) * 100);
                    bar.style.width = percentage + '%';
                    
                    const progressText = section.querySelector('.progress-text');
                    if (progressText) {
                        progressText.textContent = percentage + '%';
                    }
                }
            }
        });
    }

    // Initialize progress bars
    updateProgressBars();

    // Journal Day Navigation
    let currentJournalDate = new Date(2025, 6, 30); // 30. Juli 2025
    const journalEntries = {
        '2025-07-30': {
            text: 'Heute war ein produktiver Tag. Habe morgens meditiert und mich sehr fokussiert gefühlt. Das neue Projekt macht Fortschritte und ich bin zufrieden mit den Ergebnissen. Dankbar für die Zeit mit Familie und die kleinen Erfolge des Tages...',
            mood: 'neutral'
        },
        '2025-07-29': {
            text: 'Guter Start in die Woche. Training war intensiv und ich fühle mich energiegeladen. Heute Abend Zeit mit Familie verbracht. Neue Herausforderungen bei der Arbeit, aber ich bin motiviert sie anzugehen.',
            mood: 'happy'
        },
        '2025-07-28': {
            text: 'Ruhiger Sonntag. Viel gelesen und einen langen Spaziergang gemacht. Manchmal braucht man diese entspannten Tage. Zeit für Reflexion und Planung der kommenden Woche.',
            mood: 'happy'
        },
        '2025-07-27': {
            text: 'Samstag mit Freunden verbracht. Schöne Gespräche und gutes Essen. Balance zwischen Produktivität und Entspannung gefunden.',
            mood: 'very-happy'
        },
        '2025-07-26': {
            text: 'Intense Arbeitszeit heute. Deadline geschafft und stolz auf das Ergebnis. Meditation hat geholfen, fokussiert zu bleiben.',
            mood: 'neutral'
        }
    };

    function formatDate(date) {
        const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                       'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    function getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function updateJournalDisplay() {
        const dateElement = document.getElementById('currentDate');
        const textArea = document.getElementById('journalText');
        const nextBtn = document.getElementById('nextDay');
        
        if (dateElement && textArea) {
            dateElement.textContent = formatDate(currentJournalDate);
            const dateKey = getDateKey(currentJournalDate);
            const entry = journalEntries[dateKey];
            
            if (entry) {
                textArea.value = entry.text || '';
                updateMoodSelection(entry.mood || 'neutral');
            } else {
                textArea.value = '';
                updateMoodSelection('neutral');
            }
            
            // Disable next button if we're at today's date
            const today = new Date(2025, 6, 30);
            if (nextBtn) {
                nextBtn.disabled = currentJournalDate >= today;
                nextBtn.style.opacity = currentJournalDate >= today ? '0.3' : '1';
            }
        }
    }

    function updateMoodSelection(mood) {
        const moodEmojis = document.querySelectorAll('.mood-emoji');
        moodEmojis.forEach(emoji => {
            emoji.classList.remove('selected');
            emoji.style.background = 'transparent';
            if (emoji.getAttribute('data-mood') === mood) {
                emoji.classList.add('selected');
                emoji.style.background = '#f0f0f0';
            }
        });
    }

    function getCurrentMood() {
        const selectedMood = document.querySelector('.mood-emoji.selected');
        return selectedMood ? selectedMood.getAttribute('data-mood') : 'neutral';
    }

    // Journal navigation event listeners
    const prevDayBtn = document.getElementById('prevDay');
    const nextDayBtn = document.getElementById('nextDay');
    const journalTextArea = document.getElementById('journalText');
    const autoSaveStatus = document.getElementById('autoSaveStatus');
    let autoSaveTimeout;

    function showAutoSaveStatus() {
        if (autoSaveStatus) {
            autoSaveStatus.style.opacity = '1';
            setTimeout(() => {
                autoSaveStatus.style.opacity = '0';
            }, 2000);
        }
    }

    function autoSave() {
        if (journalTextArea) {
            const currentKey = getDateKey(currentJournalDate);
            if (!journalEntries[currentKey]) {
                journalEntries[currentKey] = { text: '', mood: 'neutral' };
            }
            journalEntries[currentKey].text = journalTextArea.value;
            journalEntries[currentKey].mood = getCurrentMood();
            showAutoSaveStatus();
        }
    }

    // Auto-save on typing (debounced)
    if (journalTextArea) {
        journalTextArea.addEventListener('input', function() {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(autoSave, 1000); // Save 1 second after user stops typing
        });
    }

    // Mood selection handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('mood-emoji')) {
            // Remove selected class from all mood emojis
            const moodEmojis = document.querySelectorAll('.mood-emoji');
            moodEmojis.forEach(emoji => {
                emoji.classList.remove('selected');
                emoji.style.background = 'transparent';
            });
            
            // Add selected class to clicked emoji
            e.target.classList.add('selected');
            e.target.style.background = '#f0f0f0';
            
            // Auto-save mood change
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(autoSave, 500);
        }
    });

    // Mood hover effects
    document.addEventListener('mouseover', function(e) {
        if (e.target.classList.contains('mood-emoji') && !e.target.classList.contains('selected')) {
            e.target.style.background = '#f8f8f8';
        }
    });

    document.addEventListener('mouseout', function(e) {
        if (e.target.classList.contains('mood-emoji') && !e.target.classList.contains('selected')) {
            e.target.style.background = 'transparent';
        }
    });

    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', function() {
            // Auto-save current entry before switching
            autoSave();
            currentJournalDate.setDate(currentJournalDate.getDate() - 1);
            updateJournalDisplay();
        });
    }

    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', function() {
            // Auto-save current entry before switching
            autoSave();
            currentJournalDate.setDate(currentJournalDate.getDate() + 1);
            updateJournalDisplay();
        });
    }

    // Initialize journal display
    updateJournalDisplay();

    // Week Navigation
    let currentWeekDate = new Date(2025, 6, 24); // 24. Juli 2025 (KW 30)
    const weeklyReflections = {
        '2025-W30': {
            reflection1: 'Training war sehr konstant und ich habe alle geplanten Einheiten geschafft. Das neue Projekt macht gute Fortschritte.',
            reflection2: 'Zeitmanagement zwischen Uni und Arbeit war manchmal schwierig. Sonntag war etwas unproduktiv.',
            reflection3: 'Bessere Planung für das Wochenende. Mehr Zeit für Erholung einplanen.',
            sport: [false, false, true, false, true, false, true], // Mo-So
            nutrition: [true, true, true, true, true, true, false]
        },
        '2025-W29': {
            reflection1: 'Großartige Woche mit vielen persönlichen Durchbrüchen. Meditation hilft enorm bei der Konzentration.',
            reflection2: 'Zu viele soziale Verpflichtungen, wenig Zeit für mich selbst.',
            reflection3: 'Grenzen setzen und bewusst Nein sagen zu unwichtigen Terminen.',
            sport: [true, false, true, false, false, true, false],
            nutrition: [true, true, false, true, true, true, true]
        },
        '2025-W28': {
            reflection1: 'Sehr produktive Arbeitswoche. Alle wichtigen Deadlines eingehalten.',
            reflection2: 'Ernährung war nicht optimal, zu viel Fast Food.',
            reflection3: 'Meal Prep am Sonntag wieder einführen.',
            sport: [true, false, true, true, false, false, true],
            nutrition: [false, true, false, true, true, false, true]
        }
    };

    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    function getWeekDateRange(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const formatDate = (date) => `${date.getDate()}.${date.getMonth() === 5 ? 'Juni' : date.getMonth() === 6 ? 'Juli' : 'August'}`;
        return `${formatDate(monday)}-${formatDate(sunday)}`;
    }

    function formatWeekDisplay(date) {
        const weekNum = getWeekNumber(date);
        const dateRange = getWeekDateRange(date);
        return `KW ${weekNum} • ${dateRange} ${date.getFullYear()}`;
    }

    function getWeekKey(date) {
        const weekNum = getWeekNumber(date);
        return `${date.getFullYear()}-W${weekNum}`;
    }

    function updateWeekDisplay() {
        const weekElement = document.getElementById('currentWeek');
        const weekStatsTitle = document.getElementById('weekStatsTitle');
        const nextBtn = document.getElementById('nextWeek');
        
        if (weekElement) {
            weekElement.textContent = formatWeekDisplay(currentWeekDate);
        }
        
        if (weekStatsTitle) {
            const weekNum = getWeekNumber(currentWeekDate);
            weekStatsTitle.textContent = `KW ${weekNum} - Kennzahlen:`;
        }
        
        // Load weekly reflection data
        const weekKey = getWeekKey(currentWeekDate);
        const weekData = weeklyReflections[weekKey];
        
        if (weekData) {
            const reflection1 = document.getElementById('weekReflection1');
            const reflection2 = document.getElementById('weekReflection2');
            const reflection3 = document.getElementById('weekReflection3');
            
            if (reflection1) reflection1.value = weekData.reflection1 || '';
            if (reflection2) reflection2.value = weekData.reflection2 || '';
            if (reflection3) reflection3.value = weekData.reflection3 || '';
            
            // Update day buttons
            updateDayButtons('sport', weekData.sport || [false, false, false, false, false, false, false]);
            updateDayButtons('nutrition', weekData.nutrition || [false, false, false, false, false, false, false]);
        } else {
            // Clear fields for new week
            const reflection1 = document.getElementById('weekReflection1');
            const reflection2 = document.getElementById('weekReflection2');
            const reflection3 = document.getElementById('weekReflection3');
            
            if (reflection1) reflection1.value = '';
            if (reflection2) reflection2.value = '';
            if (reflection3) reflection3.value = '';
            
            // Reset day buttons
            updateDayButtons('sport', [false, false, false, false, false, false, false]);
            updateDayButtons('nutrition', [false, false, false, false, false, false, false]);
        }
        
        // Disable next button if we're at current week
        const today = new Date(2025, 6, 30);
        const currentWeek = getWeekNumber(today);
        const displayWeek = getWeekNumber(currentWeekDate);
        if (nextBtn) {
            nextBtn.disabled = displayWeek >= currentWeek;
            nextBtn.style.opacity = displayWeek >= currentWeek ? '0.3' : '1';
        }
    }

    function updateDayButtons(type, days) {
        const buttons = document.querySelectorAll(`[data-type="${type}"]`);
        let count = 0;
        
        buttons.forEach((button, index) => {
            const dayIndex = parseInt(button.getAttribute('data-day'));
            const isActive = days[dayIndex];
            
            if (isActive) {
                button.classList.add('active');
                button.style.border = '2px solid #000';
                button.style.background = '#000';
                button.style.color = '#fff';
                count++;
            } else {
                button.classList.remove('active');
                button.style.border = '2px solid #e0e0e0';
                button.style.background = '#fff';
                button.style.color = '#000';
            }
        });
        
        // Update counter
        const counter = document.getElementById(type === 'sport' ? 'sportCount' : 'nutritionCount');
        if (counter) {
            counter.textContent = `${count}/7 Tage`;
        }
    }

    function saveDayButtonState() {
        const weekKey = getWeekKey(currentWeekDate);
        if (!weeklyReflections[weekKey]) {
            weeklyReflections[weekKey] = {
                reflection1: '',
                reflection2: '',
                reflection3: '',
                sport: [false, false, false, false, false, false, false],
                nutrition: [false, false, false, false, false, false, false]
            };
        }
        
        // Save sport data
        const sportButtons = document.querySelectorAll('[data-type="sport"]');
        sportButtons.forEach(button => {
            const dayIndex = parseInt(button.getAttribute('data-day'));
            weeklyReflections[weekKey].sport[dayIndex] = button.classList.contains('active');
        });
        
        // Save nutrition data
        const nutritionButtons = document.querySelectorAll('[data-type="nutrition"]');
        nutritionButtons.forEach(button => {
            const dayIndex = parseInt(button.getAttribute('data-day'));
            weeklyReflections[weekKey].nutrition[dayIndex] = button.classList.contains('active');
        });
    }

    // Week navigation event listeners
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const weekAutoSaveStatus = document.getElementById('weekAutoSaveStatus');
    const weekReflections = document.querySelectorAll('#weekReflection1, #weekReflection2, #weekReflection3');
    let weekAutoSaveTimeout;

    function showWeekAutoSaveStatus() {
        if (weekAutoSaveStatus) {
            weekAutoSaveStatus.style.opacity = '1';
            setTimeout(() => {
                weekAutoSaveStatus.style.opacity = '0';
            }, 2000);
        }
    }

    function autoSaveWeek() {
        const weekKey = getWeekKey(currentWeekDate);
        const reflection1 = document.getElementById('weekReflection1');
        const reflection2 = document.getElementById('weekReflection2');
        const reflection3 = document.getElementById('weekReflection3');
        
        if (!weeklyReflections[weekKey]) {
            weeklyReflections[weekKey] = {
                reflection1: '',
                reflection2: '',
                reflection3: '',
                sport: [false, false, false, false, false, false, false],
                nutrition: [false, false, false, false, false, false, false]
            };
        }
        
        weeklyReflections[weekKey].reflection1 = reflection1 ? reflection1.value : '';
        weeklyReflections[weekKey].reflection2 = reflection2 ? reflection2.value : '';
        weeklyReflections[weekKey].reflection3 = reflection3 ? reflection3.value : '';
        
        saveDayButtonState();
        showWeekAutoSaveStatus();
    }

    // Auto-save on typing for week reflections
    weekReflections.forEach(textarea => {
        textarea.addEventListener('input', function() {
            clearTimeout(weekAutoSaveTimeout);
            weekAutoSaveTimeout = setTimeout(autoSaveWeek, 1000);
        });
    });

    // Day button click handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('day-button')) {
            e.target.classList.toggle('active');
            
            if (e.target.classList.contains('active')) {
                e.target.style.border = '2px solid #000';
                e.target.style.background = '#000';
                e.target.style.color = '#fff';
            } else {
                e.target.style.border = '2px solid #e0e0e0';
                e.target.style.background = '#fff';
                e.target.style.color = '#000';
            }
            
            // Update counter
            const type = e.target.getAttribute('data-type');
            const buttons = document.querySelectorAll(`[data-type="${type}"]`);
            const activeCount = document.querySelectorAll(`[data-type="${type}"].active`).length;
            
            const counter = document.getElementById(type === 'sport' ? 'sportCount' : 'nutritionCount');
            if (counter) {
                counter.textContent = `${activeCount}/7 Tage`;
            }
            
            // Auto-save on button click
            clearTimeout(weekAutoSaveTimeout);
            weekAutoSaveTimeout = setTimeout(autoSaveWeek, 500);
        }
    });

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', function() {
            saveDayButtonState();
            autoSaveWeek();
            currentWeekDate.setDate(currentWeekDate.getDate() - 7);
            updateWeekDisplay();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', function() {
            saveDayButtonState();
            autoSaveWeek();
            currentWeekDate.setDate(currentWeekDate.getDate() + 7);
            updateWeekDisplay();
        });
    }

    // Initialize week display
    updateWeekDisplay();

    // Routine Toggle Functionality
    const routineToggleButtons = document.querySelectorAll('.focus-option[data-routine]');
    const morningRoutine = document.getElementById('morning-routine');
    const eveningRoutine = document.getElementById('evening-routine');
    const routineTitle = document.getElementById('routine-title');
    
    console.log('Found routine buttons:', routineToggleButtons.length);

    function showRoutine(routineType) {
        if (routineType === 'morning') {
            morningRoutine.style.display = 'flex';
            eveningRoutine.style.display = 'none';
            routineTitle.textContent = '☀️ Morgenroutine';
        } else if (routineType === 'evening') {
            morningRoutine.style.display = 'none';
            eveningRoutine.style.display = 'flex';
            routineTitle.textContent = '🌙 Abendroutine';
        }
        
        // Update progress bar for currently visible routine
        updateRoutineProgressBars();
    }

    function updateRoutineProgressBars() {
        const routineProgressBar = document.getElementById('routine-progress');
        const routineProgressText = document.getElementById('routine-progress-text');
        
        if (routineProgressBar && routineProgressText) {
            const visibleRoutine = morningRoutine.style.display !== 'none' ? morningRoutine : eveningRoutine;
            const checkboxes = visibleRoutine.querySelectorAll('input[type="checkbox"]:not([disabled])');
            const checked = visibleRoutine.querySelectorAll('input[type="checkbox"]:checked:not([disabled])');
            
            if (checkboxes.length > 0) {
                const percentage = Math.round((checked.length / checkboxes.length) * 100);
                routineProgressBar.style.width = percentage + '%';
                routineProgressText.textContent = percentage + '%';
            }
        }
    }

    // Routine toggle event listeners
    routineToggleButtons.forEach((button, index) => {
        console.log(`Setting up routine button ${index}:`, button.getAttribute('data-routine'));
        
        button.addEventListener('click', function() {
            console.log('Routine button clicked:', this.getAttribute('data-routine'));
            const routineType = this.getAttribute('data-routine');
            
            // Remove active class from all routine toggle buttons
            routineToggleButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show appropriate routine
            showRoutine(routineType);
        });
    });

    // Update routine progress when checkboxes change
    const routineCheckboxes = document.querySelectorAll('#morning-routine input[type="checkbox"], #evening-routine input[type="checkbox"]');
    routineCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.checked) {
                label.style.textDecoration = 'line-through';
                label.style.color = '#999';
            } else {
                label.style.textDecoration = 'none';
                label.style.color = 'inherit';
            }
            
            // Update routine progress bar
            updateRoutineProgressBars();
        });
    });

    // Initialize routine progress
    updateRoutineProgressBars();

    // Todo Filter System
    let currentTodoFilter = 'heute';
    const todoFilters = document.querySelectorAll('.tabs .tab[data-filter]');
    const todoFilterContainers = document.querySelectorAll('.todo-filter');

    function showTodoFilter(filterName) {
        currentTodoFilter = filterName;
        
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

        // Update progress bar for current filter
        updateTodoProgressForFilter(filterName);
    }

    function updateTodoProgressForFilter(filterName) {
        const progressBar = document.querySelector('#todoProgress .progress-fill');
        const progressText = document.querySelector('#todoProgress .progress-text');
        const progressTextInfo = document.getElementById('todoProgressText');
        
        if (progressBar && progressText) {
            const activeContainer = document.querySelector(`[data-filter="${filterName}"]`);
            if (activeContainer) {
                const checkboxes = activeContainer.querySelectorAll('input[type="checkbox"]:not([disabled])');
                const checked = activeContainer.querySelectorAll('input[type="checkbox"]:checked:not([disabled])');
                
                if (checkboxes.length > 0) {
                    const percentage = Math.round((checked.length / checkboxes.length) * 100);
                    progressBar.style.width = percentage + '%';
                    progressText.textContent = percentage + '%';
                    
                    if (progressTextInfo) {
                        progressTextInfo.textContent = `${checked.length} von ${checkboxes.length} Aufgaben erledigt`;
                    }
                } else {
                    progressBar.style.width = '0%';
                    progressText.textContent = '0%';
                    if (progressTextInfo) {
                        progressTextInfo.textContent = 'Keine Aufgaben';
                    }
                }
            }
        }
    }

    // Todo filter click handlers
    todoFilters.forEach(tab => {
        tab.addEventListener('click', function() {
            const filterName = this.getAttribute('data-filter');
            showTodoFilter(filterName);
        });
    });

    // Add new task functionality
    const addTaskBtn = document.getElementById('addTaskBtn');
    const newTaskInput = document.getElementById('newTaskInput');
    const newTaskCategory = document.getElementById('newTaskCategory');
    const newTaskTime = document.getElementById('newTaskTime');

    let taskCounter = 0;

    function createTaskElement(taskText, category, date, time) {
        const taskId = 'task_' + (++taskCounter);
        
        // Get category icon
        let icon = 'circle';
        switch(category) {
            case 'privat':
                icon = 'home';
                break;
            case 'arbeit':
                icon = 'briefcase';
                break;
            case 'uni':
                icon = 'book-open';
                break;
        }

        // Format date display
        let displayText = 'Heute';
        if (date) {
            const taskDate = new Date(date);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Reset time to compare dates only
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

        // Add event listener for checkbox
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.checked) {
                label.style.textDecoration = 'line-through';
                label.style.color = '#999';
            } else {
                label.style.textDecoration = 'none';
                label.style.color = 'inherit';
            }
            
            // Update progress bars and counters
            updateTodoProgressForFilter(currentTodoFilter);
            updateTodayTaskCounter();
        });

        return taskElement;
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
                // Clone the element for each container (except the first one)
                const taskToAdd = filterName === categories[0] ? taskElement : taskElement.cloneNode(true);
                
                // Re-add event listeners for cloned elements
                if (filterName !== categories[0]) {
                    const checkbox = taskToAdd.querySelector('input[type="checkbox"]');
                    checkbox.addEventListener('change', function() {
                        const label = this.nextElementSibling;
                        if (this.checked) {
                            label.style.textDecoration = 'line-through';
                            label.style.color = '#999';
                        } else {
                            label.style.textDecoration = 'none';
                            label.style.color = 'inherit';
                        }
                        
                        // Sync checkbox states across filters
                        syncTaskStates(this.id, this.checked);
                        updateTodoProgressForFilter(currentTodoFilter);
                    });
                }
                
                container.appendChild(taskToAdd);
            }
        });

        // Re-initialize Lucide icons for new elements
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function syncTaskStates(taskId, isChecked) {
        // Sync the state of checkboxes with the same ID across different filters
        const allCheckboxes = document.querySelectorAll(`input[id="${taskId}"]`);
        allCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const label = checkbox.nextElementSibling;
            if (isChecked) {
                label.style.textDecoration = 'line-through';
                label.style.color = '#999';
            } else {
                label.style.textDecoration = 'none';
                label.style.color = 'inherit';
            }
        });
    }

    // Show archive notification
    function showArchiveNotification(taskText) {
        // Create notification element
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

    // Add task button click handler
    if (addTaskBtn && newTaskInput && newTaskCategory) {
        const newTaskDate = document.getElementById('newTaskDate');
        
        addTaskBtn.addEventListener('click', function() {
            const taskText = newTaskInput.value.trim();
            const category = newTaskCategory.value;
            const date = newTaskDate ? newTaskDate.value : '';
            const time = newTaskTime.value;
            
            if (taskText) {
                const taskElement = createTaskElement(taskText, category, date, time);
                addTaskToFilters(taskElement, category, date);
                
                // Clear inputs
                newTaskInput.value = '';
                newTaskTime.value = '';
                if (newTaskDate) newTaskDate.value = '';
                
                // Update progress for current filter
                updateTodoProgressForFilter(currentTodoFilter);
                updateTodayTaskCounter();
            }
        });

        // Allow adding tasks with Enter key
        newTaskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTaskBtn.click();
            }
        });
    }

    // Archive completed tasks
    function archiveTask(taskElement) {
        const taskText = taskElement.querySelector('label').textContent.trim();
        const categoryElement = taskElement.querySelector('i[data-lucide]');
        const timeElement = taskElement.querySelector('span[style*="font-size: 0.8rem"]');
        
        let category = 'privat';
        let icon = 'home';
        let timeText = 'Keine Zeit';
        
        if (categoryElement) {
            const iconName = categoryElement.getAttribute('data-lucide');
            switch(iconName) {
                case 'briefcase':
                    category = 'arbeit';
                    icon = 'briefcase';
                    break;
                case 'book-open':
                    category = 'uni';
                    icon = 'book-open';
                    break;
                default:
                    category = 'privat';
                    icon = 'home';
            }
        }
        
        if (timeElement) {
            timeText = timeElement.textContent.trim();
        }
        
        // Create archived task element
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
        
        // Add to archive container
        const archiveContainer = document.querySelector('[data-filter="archiv"] .checkbox-group');
        if (archiveContainer) {
            archiveContainer.appendChild(archivedTaskElement);
        }
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function scheduleTaskArchival(taskElement, checkbox) {
        if (checkbox.checked) {
            // Schedule archival after 2 seconds (shorter delay for better UX)
            setTimeout(() => {
                if (checkbox.checked) { // Double-check it's still checked
                    // Archive the task first
                    archiveTask(taskElement);
                    
                    // Find and remove task from all active filters
                    const taskText = taskElement.querySelector('label').textContent.trim();
                    
                    // Remove from Home section
                    const homeTaskElements = document.querySelectorAll('#home .checkbox-item');
                    homeTaskElements.forEach(homeTask => {
                        const homeLabel = homeTask.querySelector('label');
                        if (homeLabel && homeLabel.textContent.trim() === taskText) {
                            homeTask.remove();
                        }
                    });
                    
                    // Remove from all todo filters except archive
                    const allTaskElements = document.querySelectorAll('.todo-filter:not([data-filter="archiv"]) .checkbox-item');
                    allTaskElements.forEach(task => {
                        const label = task.querySelector('label');
                        if (label && label.textContent.trim() === taskText) {
                            task.remove();
                        }
                    });
                    
                    // Update progress bars after removal
                    updateTodoProgressForFilter(currentTodoFilter);
                    updateProgressBars(); // Also update home section progress
                    updateTodayTaskCounter(); // Update today counter
                    
                    // Increment completed counter and show notifications
                    incrementTodayCompletedCounter();
                    showArchiveNotification(taskText);
                }
            }, 2000);
        }
    }

    // Sync existing task checkboxes across filters
    function initializeTaskSync() {
        const existingCheckboxes = document.querySelectorAll('.todo-filter input[type="checkbox"]:not([disabled])');
        existingCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const label = this.nextElementSibling;
                const taskText = label.textContent.trim();
                const taskElement = this.closest('.checkbox-item');
                
                // Find all checkboxes with the same task text and sync their state
                const allSimilarTasks = document.querySelectorAll('.todo-filter input[type="checkbox"]:not([disabled])');
                allSimilarTasks.forEach(otherCheckbox => {
                    const otherLabel = otherCheckbox.nextElementSibling;
                    if (otherLabel && otherLabel.textContent.trim() === taskText && otherCheckbox !== this) {
                        otherCheckbox.checked = this.checked;
                        
                        if (this.checked) {
                            otherLabel.style.textDecoration = 'line-through';
                            otherLabel.style.color = '#999';
                        } else {
                            otherLabel.style.textDecoration = 'none';
                            otherLabel.style.color = 'inherit';
                        }
                    }
                });
                
                // Also sync with home section
                const homeTaskElements = document.querySelectorAll('#home .checkbox-item');
                homeTaskElements.forEach(homeTask => {
                    const homeCheckbox = homeTask.querySelector('input[type="checkbox"]');
                    const homeLabel = homeTask.querySelector('label');
                    if (homeLabel && homeLabel.textContent.trim() === taskText && homeCheckbox !== this) {
                        homeCheckbox.checked = this.checked;
                        
                        if (this.checked) {
                            homeLabel.style.textDecoration = 'line-through';
                            homeLabel.style.color = '#999';
                        } else {
                            homeLabel.style.textDecoration = 'none';
                            homeLabel.style.color = 'inherit';
                        }
                    }
                });
                
                // Schedule archival if task is checked
                if (this.checked && taskElement) {
                    scheduleTaskArchival(taskElement, this);
                }
                
                updateTodoProgressForFilter(currentTodoFilter);
            });
        });

        // Also handle home section checkboxes
        const homeCheckboxes = document.querySelectorAll('#home .checkbox-item input[type="checkbox"]:not([disabled])');
        homeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const label = this.nextElementSibling;
                const taskText = label.textContent.trim();
                const taskElement = this.closest('.checkbox-item');
                
                // Sync with todo filters
                const allTodoTasks = document.querySelectorAll('.todo-filter input[type="checkbox"]:not([disabled])');
                allTodoTasks.forEach(todoCheckbox => {
                    const todoLabel = todoCheckbox.nextElementSibling;
                    if (todoLabel && todoLabel.textContent.trim() === taskText) {
                        todoCheckbox.checked = this.checked;
                        
                        if (this.checked) {
                            todoLabel.style.textDecoration = 'line-through';
                            todoLabel.style.color = '#999';
                        } else {
                            todoLabel.style.textDecoration = 'none';
                            todoLabel.style.color = 'inherit';
                        }
                    }
                });
                
                // Schedule archival if task is checked
                if (this.checked && taskElement) {
                    scheduleTaskArchival(taskElement, this);
                }
                
                updateTodoProgressForFilter(currentTodoFilter);
            });
        });
    }

    // Today task counter functionality
    let todayCompletedCount = 0; // Counter for completed tasks today
    
    function updateTodayTaskCounter() {
        const counter = document.getElementById('todayTaskCounter');
        if (counter) {
            const todayTasks = document.querySelectorAll('#home .checkbox-item');
            const todayCompleted = document.querySelectorAll('#home .checkbox-item input[type="checkbox"]:checked');
            
            counter.textContent = `${todayCompleted.length} von ${todayTasks.length} erledigt`;
            
            // Add visual feedback for completion
            if (todayTasks.length > 0 && todayCompleted.length === todayTasks.length) {
                counter.style.color = '#4CAF50';
                counter.style.fontWeight = '500';
            } else {
                counter.style.color = '#666';
                counter.style.fontWeight = 'normal';
            }
        }
    }
    
    // Function to increment completed counter when task is archived
    function incrementTodayCompletedCounter() {
        todayCompletedCount++;
        
        // Show completion notification
        const completedNotification = document.createElement('div');
        completedNotification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #2196F3;
            color: white;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            z-index: 9999;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
        `;
        completedNotification.innerHTML = `✅ ${todayCompletedCount} Aufgaben heute erledigt`;
        
        document.body.appendChild(completedNotification);
        
        // Animate in
        requestAnimationFrame(() => {
            completedNotification.style.opacity = '1';
            completedNotification.style.transform = 'translateY(0)';
        });
        
        // Remove after 2 seconds
        setTimeout(() => {
            completedNotification.style.opacity = '0';
            completedNotification.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (completedNotification.parentNode) {
                    completedNotification.parentNode.removeChild(completedNotification);
                }
            }, 300);
        }, 2000);
    }

    // Set default date to today and time to 20:00 for new tasks
    const newTaskDate = document.getElementById('newTaskDate');
    const newTaskTime = document.getElementById('newTaskTime');
    
    if (newTaskDate) {
        const today = new Date();
        const todayString = today.getFullYear() + '-' + 
            String(today.getMonth() + 1).padStart(2, '0') + '-' + 
            String(today.getDate()).padStart(2, '0');
        newTaskDate.value = todayString;
    }
    
    if (newTaskTime) {
        newTaskTime.value = '20:00';
    }

    // Initialize todo system
    initializeTaskSync();
    showTodoFilter('heute'); // Start with 'heute' filter
    updateTodoProgressForFilter('heute');
    updateTodayTaskCounter(); // Initialize counter

    console.log('Life OS Dashboard initialized successfully! 🚀');
});