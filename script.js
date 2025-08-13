// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// Global constants to avoid repetition
const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                     'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// Utility functions
const Utils = {
    getCurrentMonthYear() {
        const now = new Date();
        return {
            month: now.getMonth(),
            year: now.getFullYear(),
            monthName: MONTH_NAMES[now.getMonth()],
            display: `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
        };
    },
    
    getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    },
    
    updateElement(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    },
    
    getElement(id) {
        return document.getElementById(id);
    },
    
    setElementStyle(id, styles) {
        const el = document.getElementById(id);
        if (el) Object.assign(el.style, styles);
    }
};

// === AUTHENTICATION SYSTEM ===
const Auth = {
    isAuthenticated: false,
    currentUser: null,
    
    async init() {
        // Make Auth available globally IMMEDIATELY for mobile login
        window.Auth = this;
        
        // Initialize Supabase first
        const supabaseReady = initializeSupabase();
        
        if (!supabaseReady || !supabase) {
            console.log('⚠️ Supabase not configured - using demo mode');
            this.showDashboard();
            return;
        }
        
        // Check if user is already logged in
        this.currentUser = supabase.getCurrentUser();
        if (supabase.isAuthenticated()) {
            console.log('✅ User already authenticated:', this.currentUser.email);
            this.isAuthenticated = true;
            this.hideAuthScreen();
            this.showDashboard();
        } else {
            this.showAuthScreen();
        }
        
        this.setupAuthHandlers();
    },
    
    setupAuthHandlers() {
        console.log('🔧 Setting up auth handlers...');
        
        const loginBtn = document.getElementById('login-btn');
        const passwordField = document.getElementById('login-password');
        const logoutBtn = document.getElementById('logout-btn');
        
        console.log('🔍 Elements found:', { loginBtn: !!loginBtn, passwordField: !!passwordField, logoutBtn: !!logoutBtn });
        
        // Log mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            console.log(`📱 Mobile detected: ${navigator.userAgent.substring(0, 50)}...`);
        }
        
        if (loginBtn) {
            // Simplified event handling for better mobile compatibility
            const handleLoginEvent = (e) => {
                console.log('🖱️ Login button pressed!');
                e.preventDefault();
                e.stopPropagation();
                
                // Log button press
                console.log(`✅ Button pressed at ${new Date().toTimeString().split(' ')[0]}`);
                
                // Add visual feedback
                loginBtn.style.transform = 'scale(0.98)';
                loginBtn.style.backgroundColor = '#0056b3';
                setTimeout(() => {
                    loginBtn.style.transform = 'scale(1)';
                    loginBtn.style.backgroundColor = '';
                }, 200);
                
                // Call login handler
                this.handleLogin();
            };
            
            // Add multiple event listeners for maximum compatibility
            loginBtn.addEventListener('click', handleLoginEvent, { passive: false });
            loginBtn.addEventListener('touchend', handleLoginEvent, { passive: false });
            
            // Prevent double-tap zoom on iOS
            loginBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
        }
        
        if (passwordField) {
            passwordField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('⌨️ Enter pressed in password field!');
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        console.log('✅ Auth handlers set up');
    },
    
    
    async handleLogin() {
        console.log('🚪 handleLogin() called');
        
        const emailField = document.getElementById('login-email');
        const passwordField = document.getElementById('login-password');
        
        console.log('📍 Form fields:', { emailField: !!emailField, passwordField: !!passwordField });
        
        if (!emailField || !passwordField) {
            console.error('❌ Form fields not found!');
            return;
        }
        
        const email = emailField.value.trim();
        const password = passwordField.value;
        
        console.log('📝 Form values:', { email, passwordLength: password.length });
        
        if (!email || !password) {
            console.log('⚠️ Empty fields detected');
            this.showAuthError('login', 'Please fill in all fields');
            return;
        }
        
        this.setAuthLoading('login', true);
        this.clearAuthErrors();
        
        try {
            console.log('🔄 Attempting login for:', email);
            const { user, session, error } = await supabase.signIn(email, password);
            
            console.log('📥 Login response:', { user, session, error });
            
            if (error) {
                console.error('❌ Login error:', error);
                this.showAuthError('login', `Login failed: ${error}`);
                return;
            }
            
            if (!user || !session) {
                console.error('❌ No user or session returned');
                this.showAuthError('login', 'Login failed: No user data returned');
                return;
            }
            
            console.log('✅ Login successful:', user.email);
            this.currentUser = user;
            this.isAuthenticated = true;
            this.hideAuthScreen();
            this.showDashboard();
            
        } catch (error) {
            console.error('❌ Login exception:', error);
            this.showAuthError('login', `Login failed: ${error.message}`);
        } finally {
            this.setAuthLoading('login', false);
        }
    },
    
    
    async handleLogout() {
        console.log('🚪 handleLogout() called');
        try {
            console.log('🔄 Calling supabase.signOut()...');
            await supabase.signOut();
            
            console.log('🔄 Clearing localStorage and reloading...');
            localStorage.clear();
            window.location.reload();
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Even if supabase logout fails, clear local data and reload
            localStorage.clear();
            window.location.reload();
        }
    },
    
    showAuthScreen() {
        console.log('📱 showAuthScreen() called');
        const authScreen = document.getElementById('auth-screen');
        const layout = document.querySelector('.layout');
        const nav = document.querySelector('.sidebar-nav');
        
        console.log('🔍 Elements found:', {
            authScreen: !!authScreen,
            layout: !!layout,
            nav: !!nav
        });
        
        if (authScreen) {
            console.log('🔄 Removing hide class from auth-screen...');
            authScreen.classList.remove('hide');
            authScreen.style.display = 'flex';
            console.log('✅ Auth screen classes:', authScreen.className);
            console.log('✅ Auth screen display:', authScreen.style.display);
        }
        
        if (layout) {
            console.log('🔄 Hiding layout...');
            layout.style.display = 'none';
        }
        
        if (nav) {
            console.log('🔄 Hiding navigation...');
            nav.style.display = 'none';
            nav.style.visibility = 'hidden';
            console.log('✅ Navigation display:', nav.style.display);
        }
        
        console.log('✅ showAuthScreen() completed');
    },
    
    hideAuthScreen() {
        console.log('🔒 hideAuthScreen() called');
        const authScreen = document.getElementById('auth-screen');
        const nav = document.querySelector('.sidebar-nav');
        
        if (authScreen) {
            authScreen.classList.add('hide');
            authScreen.style.display = 'none';
        }
        
        if (nav) {
            nav.style.display = 'flex';
            nav.style.visibility = 'visible';
            console.log('✅ Navigation restored:', nav.style.display, nav.style.visibility);
        }
    },
    
    showDashboard() {
        document.querySelector('.layout').style.display = 'flex';
    },
    
    showAuthError(form, message) {
        const errorEl = document.getElementById(`${form}-error`);
        errorEl.textContent = message;
        errorEl.classList.add('show');
    },
    
    clearAuthErrors() {
        document.querySelectorAll('.auth-error').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });
    },
    
    setAuthLoading(form, loading) {
        const btn = document.getElementById(`${form}-btn`);
        btn.disabled = loading;
        btn.textContent = loading ? 'Please wait...' : 'Login';
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard loading...');
    
    // Initialize Authentication first
    await Auth.init();

    // Dark Mode System
    let darkMode = {
        enabled: false,
        
        init() {
            // Load saved dark mode preference
            const savedMode = localStorage.getItem('darkMode');
            if (savedMode === 'true') {
                this.enabled = true;
                this.apply();
            }
            
            // Set up toggle
            this.setupToggle();
        },
        
        setupToggle() {
            const toggle = document.getElementById('darkModeToggle');
            const slider = document.getElementById('darkModeSlider');
            
            if (!toggle || !slider) return;
            
            // Set initial toggle state
            this.updateToggleUI();
            
            // Add click handler
            toggle.addEventListener('click', () => {
                this.toggle();
            });
        },
        
        toggle() {
            this.enabled = !this.enabled;
            this.apply();
            this.updateToggleUI();
            this.save();
            
            console.log('Dark mode:', this.enabled ? 'enabled' : 'disabled');
        },
        
        applyInlineStyles() {
            // Update inline styles that can't be handled by CSS variables
            const elementsToUpdate = [
                // Update all elements with inline background colors
                ...document.querySelectorAll('[style*="background: #f"]'),
                ...document.querySelectorAll('[style*="background-color: #f"]'),
                ...document.querySelectorAll('[style*="color: #6"]'),
                ...document.querySelectorAll('[style*="color: #3"]'),
                ...document.querySelectorAll('[style*="border: 1px solid #e"]')
            ];
            
            elementsToUpdate.forEach(element => {
                if (this.enabled) {
                    // Dark mode inline style fixes
                    const style = element.getAttribute('style') || '';
                    let newStyle = style
                        .replace(/background:\s*#f[a-f0-9]{5}/gi, 'background: #2d2d2d')
                        .replace(/background-color:\s*#f[a-f0-9]{5}/gi, 'background-color: #2d2d2d')
                        .replace(/color:\s*#666[a-f0-9]*/gi, 'color: #b3b3b3')
                        .replace(/color:\s*#333[a-f0-9]*/gi, 'color: #ffffff')
                        .replace(/border:\s*1px solid #e[a-f0-9]{5}/gi, 'border: 1px solid #333333');
                    element.setAttribute('style', newStyle);
                } else {
                    // Light mode - restore original styles  
                    const style = element.getAttribute('style') || '';
                    let newStyle = style
                        .replace(/background:\s*#2d2d2d/gi, 'background: #ffffff')
                        .replace(/background-color:\s*#2d2d2d/gi, 'background-color: #ffffff')
                        .replace(/color:\s*#b3b3b3/gi, 'color: #666666')
                        .replace(/color:\s*#ffffff/gi, 'color: #333333')
                        .replace(/border:\s*1px solid #333333/gi, 'border: 1px solid #e0e0e0');
                    element.setAttribute('style', newStyle);
                }
            });
        },

        apply() {
            if (this.enabled) {
                document.body.setAttribute('data-theme', 'dark');
                document.documentElement.style.setProperty('--bg-primary', '#121212');
                document.documentElement.style.setProperty('--bg-secondary', '#1e1e1e');
                document.documentElement.style.setProperty('--text-primary', '#ffffff');
                document.documentElement.style.setProperty('--text-secondary', '#b3b3b3');
                document.documentElement.style.setProperty('--border-color', '#333333');
                document.documentElement.style.setProperty('--card-bg', '#1e1e1e');
                document.documentElement.style.setProperty('--nav-bg', '#1a1a1a');
                document.documentElement.style.setProperty('--input-bg', '#2d2d2d');
                document.documentElement.style.setProperty('--input-border', '#404040');
                document.documentElement.style.setProperty('--button-bg', '#007bff');
                document.documentElement.style.setProperty('--button-text', '#ffffff');
                document.documentElement.style.setProperty('--streak-bg', '#2d2d2d');
                document.documentElement.style.setProperty('--progress-bg', '#333333');
                document.documentElement.style.setProperty('--tab-bg', '#2d2d2d');
                document.documentElement.style.setProperty('--tab-active-bg', '#007bff');
                document.documentElement.style.setProperty('--checkbox-bg', '#2d2d2d');
                document.documentElement.style.setProperty('--form-section-bg', '#2d2d2d');
                document.documentElement.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.3)');
            } else {
                document.body.removeAttribute('data-theme');
                document.documentElement.style.setProperty('--bg-primary', '#ffffff');
                document.documentElement.style.setProperty('--bg-secondary', '#f8f9fa');
                document.documentElement.style.setProperty('--text-primary', '#333333');
                document.documentElement.style.setProperty('--text-secondary', '#666666');
                document.documentElement.style.setProperty('--border-color', '#e0e0e0');
                document.documentElement.style.setProperty('--card-bg', '#ffffff');
                document.documentElement.style.setProperty('--nav-bg', '#ffffff');
                document.documentElement.style.setProperty('--input-bg', '#ffffff');
                document.documentElement.style.setProperty('--input-border', '#e0e0e0');
                document.documentElement.style.setProperty('--button-bg', '#007bff');
                document.documentElement.style.setProperty('--button-text', '#ffffff');
                document.documentElement.style.setProperty('--streak-bg', '#fafafa');
                document.documentElement.style.setProperty('--progress-bg', '#e9ecef');
                document.documentElement.style.setProperty('--tab-bg', '#ffffff');
                document.documentElement.style.setProperty('--tab-active-bg', '#000000');
                document.documentElement.style.setProperty('--checkbox-bg', '#ffffff');
                document.documentElement.style.setProperty('--form-section-bg', '#ffffff');
                document.documentElement.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.1)');
            }
            
            // Apply inline style fixes
            setTimeout(() => this.applyInlineStyles(), 100);
        },
        
        updateToggleUI() {
            const toggle = document.getElementById('darkModeToggle');
            const slider = document.getElementById('darkModeSlider');
            
            if (!toggle || !slider) return;
            
            if (this.enabled) {
                toggle.style.background = '#007bff';
                slider.style.transform = 'translateX(30px)';
            } else {
                toggle.style.background = '#e0e0e0';
                slider.style.transform = 'translateX(0px)';
            }
        },
        
        save() {
            localStorage.setItem('darkMode', this.enabled.toString());
        }
    };
    
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
        
        // Initialize journal when first accessed
        if (tabId === 'journal') {
            if (!window.journalInitialized) {
                console.log('First time accessing journal - initializing...');
                setTimeout(() => {
                    initializeJournal();
                    window.journalInitialized = true;
                }, 100);
            }
        }
        
        // Initialize analytics when first accessed
        if (tabId === 'analytics') {
            if (!window.analyticsInitialized) {
                console.log('First time accessing analytics - initializing...');
                setTimeout(() => {
                    console.log('About to initialize heatmap filters...');
                    
                    // Direct initialization without function calls
                    const allTabs = document.querySelectorAll('[data-period]');
                    console.log('Found ALL tabs:', allTabs.length);
                    
                    allTabs.forEach((tab, i) => {
                        console.log(`Tab ${i}: ${tab.getAttribute('data-period')} (${tab.textContent.trim()})`);
                        
                        tab.addEventListener('click', function() {
                            console.log('TAB CLICKED:', this.getAttribute('data-period'));
                            
                            const period = this.getAttribute('data-period');
                            const heatmapType = this.getAttribute('data-heatmap');
                            
                            // Update active state
                            this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                            this.classList.add('active');
                            
                            // Update display
                            const containerType = heatmapType === 'training' ? 'sport' : 'work';
                            updateHeatmapDisplay(containerType, period);
                        });
                    });
                    
                    console.log('About to initialize analytics heatmaps...');
                    // initializeAnalyticsHeatmaps(); // DISABLED - too complex for now
                    console.log('Analytics initialization complete');
                    window.analyticsInitialized = true;
                }, 100);
            }
        }
        
        // Initialize motivation slideshow when first accessed
        if (tabId === 'motivation') {
            if (!window.motivationInitialized) {
                console.log('First time accessing motivation - initializing slideshow...');
                setTimeout(() => {
                    initializeMotivationSlideshow();
                    window.motivationInitialized = true;
                }, 100);
            }
        }
        
        // Initialize resources when first accessed
        if (tabId === 'ressourcen') {
            if (!window.resourcesInitialized) {
                console.log('First time accessing resources - initializing...');
                setTimeout(() => {
                    initializeResources();
                    window.resourcesInitialized = true;
                }, 100);
            }
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
        
        // Update progress when switching routines
        updateRoutineProgress();
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
        
        // Sort todos when showing heute filter
        if (filterName === 'heute') {
            setTimeout(sortHeuteTodos, 50);
        }
        
        // Show/hide daily progress in todos tab
        const todosTabProgress = document.getElementById('todoProgress');
        const todosTabProgressText = document.getElementById('todoProgressText');
        
        if (filterName === 'heute') {
            if (todosTabProgress) todosTabProgress.style.display = 'block';
            if (todosTabProgressText) todosTabProgressText.style.display = 'block';
            setTimeout(updateDailyProgress, 100); // Update progress when showing heute
        } else {
            if (todosTabProgress) todosTabProgress.style.display = 'none';
            if (todosTabProgressText) todosTabProgressText.style.display = 'none';
        }
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
    
    // Central todo state management system
    const todoState = {
        todos: new Map(), // Map of shared todo ID -> todo data
        nextId: 1000, // Start IDs at 1000 to avoid conflicts with existing IDs
        
        // Generate a unique shared ID for todos
        generateId() {
            return `shared_todo_${this.nextId++}`;
        },
        
        // Add or update a todo in the central state
        setTodo(id, data) {
            this.todos.set(id, {
                ...data,
                lastModified: Date.now()
            });
            console.log('Todo state updated:', id, data);
        },
        
        // Get todo data by ID
        getTodo(id) {
            return this.todos.get(id);
        },
        
        // Mark todo as checked/unchecked
        setTodoChecked(id, checked) {
            const todo = this.todos.get(id);
            if (todo) {
                todo.checked = checked;
                todo.lastModified = Date.now();
                this.syncTodoAcrossTabs(id);
                console.log(`Todo ${id} checked status updated:`, checked);
                
                // Update daily progress when todo status changes
                setTimeout(updateDailyProgress, 50);
                
                if (checked) {
                    this.scheduleArchiving(id);
                }
            }
        },
        
        // Schedule archiving with duplicate prevention
        scheduleArchiving(id) {
            const todo = this.todos.get(id);
            if (!todo) return;
            
            // Mark as pending archival to prevent duplicates
            if (todo.pendingArchival) {
                console.log(`Todo ${id} already scheduled for archival, skipping`);
                return;
            }
            
            todo.pendingArchival = true;
            console.log(`Scheduling archival for todo ${id}:`, todo.text);
            
            setTimeout(() => {
                // Double-check the todo is still checked and pending
                const currentTodo = this.todos.get(id);
                if (currentTodo && currentTodo.checked && currentTodo.pendingArchival) {
                    console.log(`Archiving todo ${id}:`, currentTodo.text);
                    this.archiveTodo(id);
                } else {
                    console.log(`Todo ${id} no longer pending archival or was unchecked`);
                    if (currentTodo) currentTodo.pendingArchival = false;
                }
            }, 2000);
        },
        
        // Sync todo checked state across all tabs
        syncTodoAcrossTabs(id) {
            const todo = this.todos.get(id);
            if (!todo) return;
            
            // Find all checkbox elements with this shared ID
            const checkboxes = document.querySelectorAll(`input[data-shared-id="${id}"]`);
            
            checkboxes.forEach(checkbox => {
                if (checkbox.checked !== todo.checked) {
                    checkbox.checked = todo.checked;
                    
                    // Update visual styling
                    const label = checkbox.nextElementSibling;
                    if (label) {
                        if (todo.checked) {
                            label.style.textDecoration = 'line-through';
                            label.style.color = '#999';
                        } else {
                            label.style.textDecoration = 'none';
                            label.style.color = 'inherit';
                        }
                    }
                }
            });
        },
        
        // Archive a todo and remove from all tabs
        archiveTodo(id) {
            const todo = this.todos.get(id);
            if (!todo) return;
            
            // Archive to the archive section
            archiveTask(todo.text, todo.category, todo.icon);
            
            // Remove all DOM elements with this shared ID
            const allElements = document.querySelectorAll(`[data-shared-id="${id}"]`);
            allElements.forEach(element => {
                const parentItem = element.closest('.checkbox-item');
                if (parentItem && !parentItem.closest('[data-filter="archiv"]')) {
                    parentItem.remove();
                }
            });
            
            // Remove from central state
            this.todos.delete(id);
            console.log(`Todo ${id} fully archived and removed from state`);
        }
    };
    
    function createTaskElement(taskText, category, date, time, sharedId = null) {
        const taskId = 'task_' + (++taskCounter);
        
        // Generate or use provided shared ID for synchronization
        const todoSharedId = sharedId || todoState.generateId();
        
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
        taskElement.setAttribute('data-shared-id', todoSharedId);
        taskElement.innerHTML = `
            <input type="checkbox" id="${taskId}" data-shared-id="${todoSharedId}">
            <label for="${taskId}">${taskText}</label>
            <div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="${icon}" style="width: 14px; height: 14px; color: #666;"></i>
                <span style="font-size: 0.8rem; color: #666;">${displayText}</span>
            </div>
        `;

        // Store todo data in central state
        todoState.setTodo(todoSharedId, {
            text: taskText,
            category: category,
            icon: icon,
            date: date,
            time: time,
            checked: false
        });

        // Add checkbox event listener with shared ID
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            handleTaskCheckSync(todoSharedId, this.checked);
        });

        return taskElement;
    }
    
    // New synchronized task check handler
    async function handleTaskCheckSync(sharedId, checked) {
        console.log(`🔄 Task sync: ${sharedId} → ${checked}`);
        
        // Update central state (local sync)
        todoState.setTodoChecked(sharedId, checked);
        
        // Save to cloud storage for cross-device sync
        if (window.cloudStorage) {
            try {
                const todoData = todoState.todos.get(sharedId);
                if (todoData) {
                    const cloudData = {
                        id: sharedId,
                        text: todoData.text,
                        category: todoData.category,
                        completed: checked,
                        date: todoData.date || null,
                        time: todoData.time || null,
                        updated_at: new Date().toISOString()
                    };
                    await window.cloudStorage.saveTodo(cloudData);
                    console.log(`☁️ Todo synced to cloud: ${sharedId}`);
                }
            } catch (error) {
                console.error('❌ Cloud sync failed:', error);
                // Continue with local sync even if cloud fails
            }
        }
        
        // Update monthly streak displays
        await updateMonthlyStreakDisplays();
    }
    
    // Legacy handler for backward compatibility (will be phased out)
    function handleTaskCheck(checkbox, taskText, category, icon, taskId) {
        const label = checkbox.nextElementSibling;
        const isOnHomePage = checkbox.closest('#home') !== null;
        const isOnTodosPage = checkbox.closest('#todos') !== null;
        const currentTab = isOnHomePage ? 'Home' : (isOnTodosPage ? 'Todos' : 'Unknown');
        
        if (checkbox.checked) {
            // Make task look completed
            label.style.textDecoration = 'line-through';
            label.style.color = '#999';
            
            console.log(`Task checked on ${currentTab} tab, scheduling archive for:`, taskText, 'ID:', taskId, 'Category:', category);
            
            // Schedule archiving after 2 seconds (consistent across all tabs)
            setTimeout(() => {
                // Double-check the task is still checked (user might have unchecked it)
                const currentCheckbox = document.getElementById(taskId);
                if (currentCheckbox && currentCheckbox.checked) {
                    console.log(`Archiving task from ${currentTab} tab:`, taskText);
                    archiveTask(taskText, category, icon);
                    removeTaskFromAllFilters(taskId);
                } else {
                    console.log(`Task ${taskId} was unchecked before archiving, not archiving`);
                }
            }, 2000);
        } else {
            // Restore normal appearance when unchecked
            label.style.textDecoration = 'none';
            label.style.color = 'inherit';
            console.log(`Task unchecked on ${currentTab} tab:`, taskText, 'ID:', taskId);
        }
        
        // Update monthly streak displays
        updateMonthlyStreakDisplays();
    }
    
    // Archive completed task
    function archiveTask(taskText, category, icon) {
        const archiveContainer = document.querySelector('[data-filter="archiv"] .checkbox-group');
        if (archiveContainer) {
            // Create timestamp for when task was archived
            const now = new Date();
            const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            const dateString = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
            const timestampString = `${dateString} ${timeString}`;
            
            const archivedTaskElement = document.createElement('div');
            archivedTaskElement.className = 'checkbox-item';
            archivedTaskElement.setAttribute('data-category', category);
            archivedTaskElement.setAttribute('data-archived-at', now.toISOString());
            archivedTaskElement.innerHTML = `
                <input type="checkbox" checked disabled>
                <label style="text-decoration: line-through; color: #ccc;">${taskText}</label>
                <div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="${icon}" style="width: 14px; height: 14px; color: #ccc;"></i>
                    <span style="font-size: 0.8rem; color: #ccc;" title="Archiviert am ${timestampString}">${timestampString}</span>
                </div>
            `;
            
            // Insert at the beginning of archive (most recently archived first)
            if (archiveContainer.firstChild) {
                archiveContainer.insertBefore(archivedTaskElement, archiveContainer.firstChild);
            } else {
                archiveContainer.appendChild(archivedTaskElement);
            }
            
            // Re-initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Show notification
            showArchiveNotification(taskText);
            
            console.log(`Task archived successfully: "${taskText}" at ${timestampString}`);
        } else {
            console.error('Archive container not found! Could not archive task:', taskText);
        }
    }
    
    // Legacy function - now handled by todoState.archiveTodo()
    function removeTaskFromAllFilters(taskId) {
        console.log('Legacy removeTaskFromAllFilters called for:', taskId);
        console.log('This function is deprecated - use todoState.archiveTodo() instead');
        
        // For backward compatibility, still remove by DOM ID
        const allTaskElements = document.querySelectorAll('.checkbox-item');
        let removed = 0;
        allTaskElements.forEach(task => {
            const checkbox = task.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.id === taskId && !task.closest('[data-filter="archiv"]') && !task.closest('#morning-routine') && !task.closest('#evening-routine')) {
                console.log('Found and removing legacy task element');
                task.remove();
                removed++;
            }
        });
        
        console.log('Removed', removed, 'legacy task elements');
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
    
    // Insert task in correct chronological order (date + time)
    function insertTaskInTimeOrder(container, taskElement, time, date = null) {
        // Get target datetime for new task
        const getTaskDateTime = (elem, taskTime, taskDate) => {
            let targetDate = new Date();
            if (taskDate && taskDate !== '') {
                targetDate = new Date(taskDate);
            }
            
            let targetTime = taskTime || '23:59';
            const [hours, minutes] = targetTime.split(':').map(Number);
            targetDate.setHours(hours, minutes, 0, 0);
            
            return targetDate;
        };
        
        const newTaskDateTime = getTaskDateTime(taskElement, time, date);
        const existingTasks = Array.from(container.children);
        let inserted = false;
        
        for (let i = 0; i < existingTasks.length; i++) {
            const existingTask = existingTasks[i];
            const existingTimeSpan = existingTask.querySelector('span');
            const existingTimeText = existingTimeSpan ? existingTimeSpan.textContent.trim() : '';
            const existingDate = existingTask.getAttribute('data-date');
            
            // Parse existing task time
            let existingTime = '23:59';
            if (existingTimeText.match(/^\d{1,2}:\d{2}$/)) {
                existingTime = existingTimeText;
            } else if (existingTimeText.includes('Morgen')) {
                const timeMatch = existingTimeText.match(/(\d{1,2}):(\d{2})/);
                existingTime = timeMatch ? timeMatch[0] : '08:00';
            } else if (existingTimeText.includes('Überfällig')) {
                const timeMatch = existingTimeText.match(/(\d{1,2}):(\d{2})/);
                existingTime = timeMatch ? timeMatch[0] : '00:01';
            }
            
            const existingDateTime = getTaskDateTime(existingTask, existingTime, existingDate);
            
            if (newTaskDateTime < existingDateTime) {
                container.insertBefore(taskElement, existingTask);
                inserted = true;
                break;
            }
        }
        
        if (!inserted) {
            container.appendChild(taskElement);
        }
    }
    
    // Extract time from text like "15:00", "Morgen 20:00", "Heute", etc.
    function extractTimeFromText(text) {
        // Match HH:MM pattern
        const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
            return timeMatch[0]; // Return "HH:MM"
        }
        
        // Handle special cases
        if (text.includes('Heute')) return '23:59'; // Put "Heute" at end
        if (text.includes('Überfällig')) return '00:00'; // Put overdue at start
        
        return null;
    }

    function addTaskToFilters(taskElement, category, date, time) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = date ? new Date(date) : today;
        taskDate.setHours(0, 0, 0, 0);
        
        // Get the shared ID from the original task element
        const sharedId = taskElement.getAttribute('data-shared-id');
        
        // Determine which filters to add the task to
        let categories = ['alle', category];
        
        // Add to 'heute' if task is for today (exact match)
        if (!date || taskDate.getTime() === today.getTime()) {
            categories.push('heute');
        }
        
        const categories_unique = [...new Set(categories)];
        
        // Add to todo filters
        categories_unique.forEach(filterName => {
            const container = document.querySelector(`[data-filter="${filterName}"] .checkbox-group`);
            if (container) {
                const taskToAdd = taskElement.cloneNode(true);
                
                // Update the checkbox ID to avoid conflicts but keep shared ID
                const checkbox = taskToAdd.querySelector('input[type="checkbox"]');
                const label = taskToAdd.querySelector('label');
                const newId = 'task_' + (++taskCounter) + '_' + filterName;
                checkbox.id = newId;
                label.setAttribute('for', newId);
                
                // Re-add event listeners with shared ID sync
                checkbox.addEventListener('change', function() {
                    handleTaskCheckSync(sharedId, this.checked);
                });
                
                // Insert task in correct chronological order
                insertTaskInTimeOrder(container, taskToAdd, time, date);
            }
        });
        
        // Also add to home page if it's for today (exact match)
        if (!date || taskDate.getTime() === today.getTime()) {
            const homeContainer = document.querySelector('#home section.card .checkbox-group');
            if (homeContainer) {
                const homeTaskToAdd = taskElement.cloneNode(true);
                
                // Update the checkbox ID to avoid conflicts but keep shared ID
                const homeCheckbox = homeTaskToAdd.querySelector('input[type="checkbox"]');
                const homeLabel = homeTaskToAdd.querySelector('label');
                const newHomeId = 'task_' + (++taskCounter) + '_home';
                homeCheckbox.id = newHomeId;
                homeLabel.setAttribute('for', newHomeId);
                
                // Re-add event listeners with shared ID sync
                homeCheckbox.addEventListener('change', function() {
                    handleTaskCheckSync(sharedId, this.checked);
                });
                
                // Insert task in correct chronological order on home page too
                insertTaskInTimeOrder(homeContainer, homeTaskToAdd, time, date);
            }
        }

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
                addTaskToFilters(taskElement, category, date, time);
                
                // Update progress after adding new task
                updateDailyProgress();
                
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
    
    
    // Initialize existing checkboxes with synchronization support
    function initializeExistingCheckboxes() {
        console.log('Initializing existing checkboxes with synchronization...');
        
        // First, identify all existing todos and group them by text content
        const todoGroups = new Map(); // text -> [checkboxes]
        
        const existingCheckboxes = document.querySelectorAll('.checkbox-item input[type="checkbox"]:not([disabled])');
        existingCheckboxes.forEach(checkbox => {
            // Skip routine checkboxes as they have their own specialized handler
            const parentRoutine = checkbox.closest('#morning-routine, #evening-routine');
            if (parentRoutine) return;
            
            // Skip checkboxes in the archive section as they are already disabled
            const isArchived = checkbox.closest('[data-filter="archiv"]');
            if (isArchived) return;
            
            // Extract todo information
            const checkboxItem = checkbox.closest('.checkbox-item');
            const label = checkbox.nextElementSibling;
            const taskText = label ? label.textContent : 'Unknown Task';
            const category = checkboxItem ? checkboxItem.getAttribute('data-category') || 'privat' : 'privat';
            const iconElement = checkboxItem ? checkboxItem.querySelector('i[data-lucide]') : null;
            const icon = iconElement ? iconElement.getAttribute('data-lucide') : getIconForCategory(category);
            const isChecked = checkbox.checked;
            
            if (!todoGroups.has(taskText)) {
                todoGroups.set(taskText, []);
            }
            
            todoGroups.get(taskText).push({
                checkbox,
                checkboxItem,
                label,
                taskText,
                category,
                icon,
                isChecked
            });
        });
        
        // Now process each group and assign shared IDs
        todoGroups.forEach((group, taskText) => {
            // Generate a shared ID for this todo group
            const sharedId = todoState.generateId();
            console.log(`Assigning shared ID ${sharedId} to "${taskText}" (${group.length} instances)`);
            
            // Store todo data in central state
            const firstTodo = group[0];
            todoState.setTodo(sharedId, {
                text: taskText,
                category: firstTodo.category,
                icon: firstTodo.icon,
                date: '',
                time: '',
                checked: firstTodo.isChecked
            });
            
            // Process each checkbox in the group
            group.forEach((todoData, index) => {
                const { checkbox, checkboxItem, taskText, category, icon } = todoData;
                
                // Add shared ID data attributes
                checkboxItem.setAttribute('data-shared-id', sharedId);
                checkbox.setAttribute('data-shared-id', sharedId);
                
                // Ensure unique DOM ID while keeping shared data ID
                checkbox.id = checkbox.id || `existing_todo_${sharedId}_${index}`;
                
                // Remove any existing event listeners and add sync handler
                const newCheckbox = checkbox.cloneNode(true);
                checkbox.parentNode.replaceChild(newCheckbox, checkbox);
                
                newCheckbox.addEventListener('change', function() {
                    handleTaskCheckSync(sharedId, this.checked);
                });
                
                console.log(`  - Initialized instance ${index + 1}: DOM ID ${newCheckbox.id}, shared ID ${sharedId}`);
            });
        });
        
        console.log(`Initialized ${todoGroups.size} unique todos with synchronization support`);
    }
    
    // Get default icon for category
    function getIconForCategory(category) {
        switch(category) {
            case 'privat': return 'home';
            case 'arbeit': return 'briefcase';
            case 'uni': return 'book-open';
            default: return 'circle';
        }
    }
    
    // Routine Progress Tracking
    function updateRoutineProgress() {
        const morningRoutine = document.getElementById('morning-routine');
        const eveningRoutine = document.getElementById('evening-routine');
        const progressBar = document.getElementById('routine-progress');
        
        // Determine which routine is currently visible
        const isEveningVisible = eveningRoutine && eveningRoutine.style.display !== 'none';
        const currentRoutine = isEveningVisible ? eveningRoutine : morningRoutine;
        
        if (!currentRoutine || !progressBar) return;
        
        // Count checkboxes in the current routine
        const checkboxes = currentRoutine.querySelectorAll('input[type="checkbox"]');
        const checkedBoxes = currentRoutine.querySelectorAll('input[type="checkbox"]:checked');
        
        const total = checkboxes.length;
        const completed = checkedBoxes.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Update progress bar only
        progressBar.style.width = percentage + '%';
        
        console.log(`Routine progress updated: ${completed}/${total} (${percentage}%)`);
    }
    
    // Initialize routine progress tracking
    function initializeRoutineProgress() {
        console.log('🔍 DEBUG: initializeRoutineProgress called');
        
        const morningRoutine = document.getElementById('morning-routine');
        const eveningRoutine = document.getElementById('evening-routine');
        
        console.log(`🔍 DEBUG: morningRoutine found: ${!!morningRoutine}`);
        console.log(`🔍 DEBUG: eveningRoutine found: ${!!eveningRoutine}`);
        
        // Add event listeners to routine checkboxes
        [morningRoutine, eveningRoutine].forEach((routine, index) => {
            if (!routine) {
                console.log(`🔍 DEBUG: Routine ${index} not found`);
                return;
            }
            
            const checkboxes = routine.querySelectorAll('input[type="checkbox"]');
            console.log(`🔍 DEBUG: Routine ${index} has ${checkboxes.length} checkboxes`);
            
            checkboxes.forEach((checkbox, cbIndex) => {
                console.log(`🔍 DEBUG: Adding event listener to checkbox ${cbIndex} (id: ${checkbox.id})`);
                
                checkbox.addEventListener('change', function() {
                    console.log(`🔍 DEBUG: Checkbox changed: ${this.id} = ${this.checked}`);
                    
                    const label = this.nextElementSibling;
                    
                    // Handle visual styling
                    if (this.checked) {
                        label.style.textDecoration = 'line-through';
                        label.style.color = '#999';
                    } else {
                        label.style.textDecoration = 'none';
                        label.style.color = 'inherit';
                    }
                    
                    // Update progress immediately
                    updateRoutineProgress();
                    
                    // Check if routine is completed and update monthly streaks
                    setTimeout(async () => {
                        console.log('🔍 DEBUG: About to call checkAndSaveRoutineCompletion');
                        await checkAndSaveRoutineCompletion();
                    }, 100);
                });
            });
        });
        
        // Update progress on initial load
        updateRoutineProgress();
    }
    
    // Routine Completion Tracking for Monthly Streaks
    async function checkAndSaveRoutineCompletion() {
        console.log('🔍 DEBUG: checkAndSaveRoutineCompletion called');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Check morning routine completion
        const morningComplete = isRoutineComplete('morning');
        console.log(`🔍 DEBUG: morningComplete = ${morningComplete}`);
        await saveRoutineCompletion('morning', today, morningComplete);
        
        // Check evening routine completion
        const eveningComplete = isRoutineComplete('evening');
        console.log(`🔍 DEBUG: eveningComplete = ${eveningComplete}`);
        await saveRoutineCompletion('evening', today, eveningComplete);
        
        // Update monthly streak counters
        await updateMonthlyRoutineStreak('morning');
        await updateMonthlyRoutineStreak('evening');
        
        // Update monthly streak displays
        await updateMonthlyStreakDisplays();
    }
    
    function isRoutineComplete(routineType) {
        const routine = document.getElementById(`${routineType}-routine`);
        if (!routine) return false;
        
        const checkboxes = routine.querySelectorAll('input[type="checkbox"]');
        const checkedBoxes = routine.querySelectorAll('input[type="checkbox"]:checked');
        
        return checkboxes.length === checkedBoxes.length && checkboxes.length > 0;
    }
    
    async function getRoutineCompletionData() {
        return await cloudStorage.getRoutineCompletionData();
    }
    
    async function saveRoutineCompletion(routineType, date, completed) {
        console.log(`🔍 DEBUG: saveRoutineCompletion called: ${routineType}, ${date}, ${completed}`);
        
        // Save to both cloud and localStorage for monthly streak system
        const completionData = await getRoutineCompletionData();
        if (!completionData[date]) completionData[date] = {};
        completionData[date][routineType] = completed;
        await cloudStorage.saveRoutineCompletionData(completionData);
        
        // Also save to localStorage for monthly streak calculations
        const localData = JSON.parse(localStorage.getItem('routineCompletionData') || '{}');
        if (!localData[date]) localData[date] = {};
        localData[date][routineType] = completed;
        localStorage.setItem('routineCompletionData', JSON.stringify(localData));
        
        console.log(`🔍 DEBUG: Saved to both cloud and localStorage`);
        console.log(`Saved ${routineType} routine completion for ${date}: ${completed}`);
    }
    
    async function updateMonthlyRoutineStreak(routineType) {
        try {
            // Calculate consecutive daily streak from new completion system
            const streak = calculateRoutineStreak(routineType);
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            // Update streak tiles
            const countElement = document.getElementById(`${routineType}RoutineStreakCount`);
            const dateElement = document.getElementById(`${routineType}RoutineStreakDate`);
            
            if (countElement) {
                countElement.textContent = streak;
            }
            
            if (dateElement) {
                dateElement.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
            }
            
            console.log(`🔥 ${routineType} routine streak: ${streak} days`);
        } catch (error) {
            console.log(`Error in updateMonthlyRoutineStreak(${routineType}):`, error);
        }
    }
    
    function calculateRoutineStreak(routineType) {
        try {
            // Get all completions from new system
            const completions = cloudStorage.getLocalRoutineCompletions();
            if (!completions || completions.length === 0) {
                console.log(`No completions found for ${routineType}`);
                return 0;
            }
            
            const today = new Date();
            let streak = 0;
            
            // Check consecutive days backwards from today
            for (let i = 0; i < 365; i++) { // Max 365 day streak
                const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                // Check if all routine items were completed for this date and routine type
                const dayCompletions = completions.filter(c => 
                    c.date === dateStr && 
                    c.template_id.startsWith(routineType) && 
                    c.completed
                );
                
                // Count unique completed items for this day
                const completedItems = new Set(dayCompletions.map(c => c.template_id)).size;
                const totalItems = 5; // We have 5 items per routine
                
                if (completedItems === totalItems) {
                    streak++;
                    console.log(`✅ ${routineType} completed on ${dateStr} (${completedItems}/${totalItems})`);
                } else {
                    console.log(`❌ ${routineType} incomplete on ${dateStr} (${completedItems}/${totalItems})`);
                    break; // Streak broken
                }
            }
            
            return streak;
            
        } catch (error) {
            console.error('Error calculating routine streak:', error);
            return 0;
        }
    }
    
    // === MONTHLY STREAK SYSTEM ===
    
    function calculateMonthlyRoutineCount(routineType, month = null, year = null) {
        try {
            console.log(`🔍 DEBUG: calculateMonthlyRoutineCount called for ${routineType}`);
            
            const now = new Date();
            const targetMonth = month !== null ? month : now.getMonth();
            const targetYear = year !== null ? year : now.getFullYear();
            
            let monthlyCount = 0;
            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            
            // Check storage data
            const completionData = JSON.parse(localStorage.getItem('routineCompletionData') || '{}');
            console.log(`🔍 DEBUG: routineCompletionData:`, completionData);
            
            // Check each day of the target month
            for (let day = 1; day <= daysInMonth; day++) {
                const checkDate = new Date(targetYear, targetMonth, day);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                const dayData = completionData[dateStr];
                
                if (dayData && dayData[routineType] === true) {
                    console.log(`🔍 DEBUG: Found completion for ${routineType} on ${dateStr}`);
                    monthlyCount++;
                }
            }
            
            console.log(`📅 ${routineType} routine completed ${monthlyCount} times in ${MONTH_NAMES[targetMonth]} ${targetYear}`);
            return monthlyCount;
            
        } catch (error) {
            console.error('Error calculating monthly routine count:', error);
            return 0;
        }
    }
    
    function calculateMonthlyTodoCount(month = null, year = null) {
        try {
            const now = new Date();
            const targetMonth = month !== null ? month : now.getMonth();
            const targetYear = year !== null ? year : now.getFullYear();
            
            const todos = cloudStorage.getLocalTodos();
            if (!todos || todos.length === 0) {
                return 0;
            }
            
            // Count completed todos in the target month
            const monthlyTodos = todos.filter(todo => {
                if (!todo.completed || !todo.updated_at) return false;
                
                const todoDate = new Date(todo.updated_at);
                return todoDate.getMonth() === targetMonth && 
                       todoDate.getFullYear() === targetYear;
            });
            
            console.log(`✅ ${monthlyTodos.length} todos completed in ${MONTH_NAMES[targetMonth]} ${targetYear}`);
            return monthlyTodos.length;
            
        } catch (error) {
            console.error('Error calculating monthly todo count:', error);
            return 0;
        }
    }
    
    async function updateMonthlyStreakDisplays() {
        try {
            console.log('🔍 DEBUG: updateMonthlyStreakDisplays called');
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            console.log(`🔍 DEBUG: Current month: ${currentMonth}, year: ${currentYear}`);
            
            // Calculate monthly counts
            const morningCount = calculateMonthlyRoutineCount('morning', currentMonth, currentYear);
            const eveningCount = calculateMonthlyRoutineCount('evening', currentMonth, currentYear);
            const todoCount = calculateMonthlyTodoCount(currentMonth, currentYear);
            
            console.log(`🔍 DEBUG: Counts - Morning: ${morningCount}, Evening: ${eveningCount}, Todos: ${todoCount}`);
            
            // Update HTML elements - get all streak tiles
            const streakTiles = document.querySelectorAll('.streak-tile');
            console.log(`🔍 DEBUG: Found ${streakTiles.length} streak tiles`);
            
            streakTiles.forEach((tile, index) => {
                const numberElement = tile.querySelector('.streak-number');
                const dateElement = tile.querySelector('.streak-date');
                
                console.log(`🔍 DEBUG: Tile ${index} - numberElement: ${!!numberElement}, dateElement: ${!!dateElement}`);
                
                if (numberElement && dateElement) {
                    let count = 0;
                    
                    // Map tiles to their respective counts based on position
                    switch (index) {
                        case 0: // Morgenroutine
                            count = morningCount;
                            break;
                        case 1: // Abendroutine  
                            count = eveningCount;
                            break;
                        case 2: // Todos Erledigt
                            count = todoCount;
                            break;
                    }
                    
                    console.log(`🔍 DEBUG: Setting tile ${index} to count ${count}`);
                    numberElement.textContent = count;
                    dateElement.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
                }
            });
            
            console.log(`🔥 Monthly streaks updated: Morning: ${morningCount}, Evening: ${eveningCount}, Todos: ${todoCount}`);
            
        } catch (error) {
            console.error('Error updating monthly streak displays:', error);
        }
    }
    
    function checkForMonthlyReset() {
        const today = new Date();
        const lastResetKey = 'lastMonthlyReset';
        const lastReset = localStorage.getItem(lastResetKey);
        
        if (!lastReset) {
            // First time running, just set the current month
            localStorage.setItem(lastResetKey, `${today.getFullYear()}-${today.getMonth()}`);
            return false;
        }
        
        const [lastYear, lastMonth] = lastReset.split('-').map(Number);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Check if we've moved to a new month
        if (currentYear > lastYear || (currentYear === lastYear && currentMonth > lastMonth)) {
            console.log(`🔄 New month detected! Resetting streaks for ${MONTH_NAMES[currentMonth]} ${currentYear}`);
            localStorage.setItem(lastResetKey, `${currentYear}-${currentMonth}`);
            return true;
        }
        
        return false;
    }
    
    // Initialize routine streak counting
    function initializeRoutineStreaks() {
        updateMonthlyRoutineStreak('morning');
        updateMonthlyRoutineStreak('evening');
        
        // Check for monthly reset
        checkForMonthlyReset();
        
        // Update monthly displays
        updateMonthlyStreakDisplays();
    }
    
    // Goals System with Edit Buttons
    function openGoalEditModal(goalCard, isNewGoal = false) {
        const nameElement = goalCard.querySelector('.goal-name');
        const categoryElement = goalCard.querySelector('.goal-category');
        const descriptionElement = goalCard.querySelector('.goal-description');
        const progressElement = goalCard.querySelector('.goal-percentage');
        const progressBar = goalCard.querySelector('.progress-fill');
        
        const currentName = isNewGoal ? '' : nameElement.textContent;
        const currentCategory = categoryElement.textContent;
        const currentDescription = isNewGoal ? '' : descriptionElement.textContent;
        const currentProgress = parseInt(progressElement.textContent);
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const currentTargetDate = isNewGoal ? '' : (goalCard.getAttribute('data-target-date') || '');
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 450px; width: 90%;">
                <h3 style="margin: 0 0 1.5rem 0; color: #333;">${isNewGoal ? 'Neues Ziel erstellen' : 'Ziel bearbeiten'}</h3>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Kategorie:</label>
                    <select id="goalCategoryInput" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                        <option value="Persönlich" ${currentCategory === 'Persönlich' ? 'selected' : ''}>Persönlich</option>
                        <option value="Fitness" ${currentCategory === 'Fitness' ? 'selected' : ''}>Fitness</option>
                        <option value="Karriere" ${currentCategory === 'Karriere' ? 'selected' : ''}>Karriere</option>
                        <option value="Bildung" ${currentCategory === 'Bildung' ? 'selected' : ''}>Bildung</option>
                        <option value="Gesundheit" ${currentCategory === 'Gesundheit' ? 'selected' : ''}>Gesundheit</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Name:</label>
                    <input type="text" id="goalNameInput" value="${currentName}" placeholder="z.B. 10kg abnehmen" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Zieldatum:</label>
                    <input type="date" id="goalTargetDateInput" value="${currentTargetDate}" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Beschreibung:</label>
                    <textarea id="goalDescriptionInput" placeholder="Durch gesunde Ernährung und Sport..." style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; min-height: 60px; resize: vertical;">${currentDescription}</textarea>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Fortschritt (%):</label>
                    <input type="number" id="goalProgressInput" value="${currentProgress}" min="0" max="100" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                    <div style="margin-top: 0.5rem; background: #f5f5f5; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div id="previewProgressBar" style="background: #007bff; height: 100%; width: ${currentProgress}%; transition: width 0.2s;"></div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.75rem; justify-content: space-between;">
                    ${!isNewGoal ? '<button id="deleteGoalBtn" style="padding: 0.6rem 1.2rem; border: 1px solid #dc3545; background: white; color: #dc3545; border-radius: 4px; cursor: pointer;">🗑 Löschen</button>' : '<div></div>'}
                    <div style="display: flex; gap: 0.75rem;">
                        <button id="cancelGoalEdit" style="padding: 0.6rem 1.2rem; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Abbrechen</button>
                        <button id="saveGoalEdit" style="padding: 0.6rem 1.2rem; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">${isNewGoal ? 'Erstellen' : 'Speichern'}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const categoryInput = modal.querySelector('#goalCategoryInput');
        const nameInput = modal.querySelector('#goalNameInput');
        const targetDateInput = modal.querySelector('#goalTargetDateInput');
        const descriptionInput = modal.querySelector('#goalDescriptionInput');
        const progressInput = modal.querySelector('#goalProgressInput');
        const previewBar = modal.querySelector('#previewProgressBar');
        const saveBtn = modal.querySelector('#saveGoalEdit');
        const cancelBtn = modal.querySelector('#cancelGoalEdit');
        const deleteBtn = modal.querySelector('#deleteGoalBtn');
        
        // Live preview
        progressInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.min(Math.max(value, 0), 100);
            previewBar.style.width = value + '%';
        });
        
        // Focus name input
        nameInput.focus();
        nameInput.select();
        
        function saveGoal() {
            const newCategory = categoryInput.value;
            const newName = nameInput.value.trim();
            const newTargetDate = targetDateInput.value;
            const newDescription = descriptionInput.value.trim();
            let newProgress = parseInt(progressInput.value) || 0;
            newProgress = Math.min(Math.max(newProgress, 0), 100);
            
            categoryElement.textContent = newCategory;
            nameElement.textContent = newName;
            descriptionElement.textContent = newDescription;
            progressElement.textContent = newProgress + '%';
            progressBar.style.width = newProgress + '%';
            
            // Store target date in data attribute
            goalCard.setAttribute('data-target-date', newTargetDate);
            
            // Update target date display if needed
            updateGoalDateDisplay(goalCard, newTargetDate);
            
            document.body.removeChild(modal);
            console.log('Goal updated:', newCategory, newName, newTargetDate, newDescription, newProgress + '%');
        }
        
        function cancelEdit() {
            document.body.removeChild(modal);
        }
        
        // Event listeners
        saveBtn.addEventListener('click', saveGoal);
        cancelBtn.addEventListener('click', cancelEdit);
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (confirm(`Möchtest du das Ziel "${currentName}" wirklich löschen?`)) {
                    document.body.removeChild(modal);
                    deleteGoal(goalCard);
                }
            });
        }
        
        // Keyboard shortcuts
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                progressInput.focus();
                progressInput.select();
            }
        });
        
        progressInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveGoal();
        });
        
        // ESC to cancel
        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') cancelEdit();
        });
        
        // Click outside to cancel
        modal.addEventListener('click', function(e) {
            if (e.target === modal) cancelEdit();
        });
    }
    
    // Add edit button to a single card
    function addEditButtonToCard(card) {
        // Add minimalist edit button
        const editBtn = document.createElement('button');
        editBtn.style.cssText = `
            position: absolute; top: 12px; left: 12px;
            background: transparent; border: none;
            width: 20px; height: 20px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: #999; opacity: 0.5;
            transition: all 0.2s ease;
        `;
        // Use clean dots icon
        if (typeof lucide !== 'undefined') {
            editBtn.innerHTML = '<i data-lucide="more-horizontal" style="width: 16px; height: 16px;"></i>';
            setTimeout(() => lucide.createIcons(editBtn), 10);
        } else {
            editBtn.innerHTML = '⋯';
        }
        editBtn.title = 'Ziel bearbeiten';
        
        // Make card position relative
        card.style.position = 'relative';
        card.appendChild(editBtn);
        
        // Edit button event
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openGoalEditModal(card);
        });
        
        // Hover effects for edit button
        editBtn.addEventListener('mouseenter', function() {
            this.style.opacity = '1';
            this.style.color = '#333';
        });
        
        editBtn.addEventListener('mouseleave', function() {
            this.style.opacity = '0.5';
            this.style.color = '#999';
        });
    }
    
    // Delete goal function
    function deleteGoal(goalCard) {
        const goalName = goalCard.querySelector('.goal-name').textContent;
        
        // Simple confirmation
        if (confirm(`Möchtest du das Ziel "${goalName}" wirklich löschen?`)) {
            // Fade out animation
            goalCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            goalCard.style.opacity = '0';
            goalCard.style.transform = 'scale(0.95)';
            
            // Remove after animation
            setTimeout(() => {
                if (goalCard.parentNode) {
                    goalCard.parentNode.removeChild(goalCard);
                }
                console.log('Goal deleted:', goalName);
            }, 300);
        }
    }
    
    // Add edit buttons to all existing goal cards
    function initializeGoals() {
        const goalCards = document.querySelectorAll('.goal-card');
        goalCards.forEach(card => {
            addEditButtonToCard(card);
            makeDraggable(card);
        });
        
        // Make goals grid a drop zone
        const goalsGrid = document.querySelector('.goals-grid');
        if (goalsGrid) {
            makeDropZone(goalsGrid, '.goal-card');
        }
        
        // Initialize Lucide icons for all buttons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Add new goal functionality
    function addNewGoal() {
        const goalsGrid = document.querySelector('.goals-grid');
        if (!goalsGrid) return;
        
        const newGoalCard = document.createElement('div');
        newGoalCard.className = 'goal-card';
        newGoalCard.innerHTML = `
            <div class="goal-category">Persönlich</div>
            <div class="goal-name">Neues Ziel</div>
            <div class="goal-description"></div>
            <div class="goal-date" style="font-size: 0.8rem; color: #666; margin-bottom: 1rem;"></div>
            <div class="goal-progress-section">
                <div class="goal-progress-header">
                    <span style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Fortschritt</span>
                    <span class="goal-percentage">0%</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%;"></div>
                    </div>
                </div>
            </div>
        `;
        
        goalsGrid.appendChild(newGoalCard);
        
        // Add edit button to new goal
        addEditButtonToCard(newGoalCard);
        makeDraggable(newGoalCard);
        
        // Make it immediately editable
        setTimeout(() => openGoalEditModal(newGoalCard, true), 100);
    }
    
    // Update goal date display
    function updateGoalDateDisplay(goalCard, targetDate) {
        const goalDateElement = goalCard.querySelector('.goal-date');
        if (goalDateElement && targetDate) {
            const date = new Date(targetDate);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            goalDateElement.textContent = `Zieldatum: ${date.toLocaleDateString('de-DE', options)}`;
        } else if (goalDateElement) {
            goalDateElement.textContent = '';
        }
    }
    
    // Add "+" button for new goals
    function addNewGoalButton() {
        const tabsContainer = document.querySelector('#ziele .tabs');
        if (tabsContainer) {
            const addBtn = document.createElement('div');
            addBtn.className = 'tab';
            addBtn.style.cssText = 'cursor: pointer; display: flex; align-items: center; justify-content: center; min-width: 40px;';
            addBtn.innerHTML = '+';
            addBtn.addEventListener('click', addNewGoal);
            tabsContainer.appendChild(addBtn);
        }
    }

    // Goals Filter System
    let currentGoalFilter = 'monat';
    const goalFilters = document.querySelectorAll('[data-goal-filter]');
    
    function isGoalInFilter(targetDate, filterName) {
        if (!targetDate && filterName === 'alle') return true;
        if (!targetDate) return false;
        
        const date = new Date(targetDate);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentQuarter = Math.floor(currentMonth / 3);
        
        const targetMonth = date.getMonth();
        const targetYear = date.getFullYear();
        const targetQuarter = Math.floor(targetMonth / 3);
        
        switch(filterName) {
            case 'monat':
                // Only goals in current month
                return targetYear === currentYear && targetMonth === currentMonth;
                
            case 'quartal':
                // Goals in current quarter (including current month)
                return targetYear === currentYear && targetQuarter === currentQuarter;
                
            case 'jahr':
                // All goals in current year (including current quarter and month)
                return targetYear === currentYear;
                
            case 'alle':
                // All goals regardless of date
                return true;
                
            default:
                return false;
        }
    }
    
    function showGoalFilter(filterName) {
        currentGoalFilter = filterName;
        console.log('Switching to goal filter:', filterName);
        
        // Update active tab
        goalFilters.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-goal-filter') === filterName) {
                tab.classList.add('active');
            }
        });
        
        // Get all goal cards and their container
        const goalsGrid = document.querySelector('.goals-grid');
        const goalCards = Array.from(document.querySelectorAll('.goal-card'));
        
        // Filter and sort visible cards
        const visibleCards = goalCards.filter(card => {
            const targetDate = card.getAttribute('data-target-date');
            return isGoalInFilter(targetDate, filterName);
        });
        
        // Sort visible cards by target date (earliest first)
        visibleCards.sort((a, b) => {
            const dateA = a.getAttribute('data-target-date');
            const dateB = b.getAttribute('data-target-date');
            
            // Cards without dates go to end
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            return new Date(dateA) - new Date(dateB);
        });
        
        // Hide all cards first
        goalCards.forEach(card => {
            card.style.display = 'none';
        });
        
        // Re-append visible cards in sorted order
        visibleCards.forEach(card => {
            card.style.display = 'flex';
            goalsGrid.appendChild(card); // This moves the card to the end
        });
    }
    
    // Goal filter click handlers
    goalFilters.forEach(tab => {
        tab.onclick = function() {
            const filterName = this.getAttribute('data-goal-filter');
            showGoalFilter(filterName);
        };
    });
    
    // Initialize existing goals with date attributes for demo
    function initializeExistingGoalsWithDates() {
        const goalCards = document.querySelectorAll('.goal-card');
        const demoDates = [
            '2025-09-01', // Abnehmen - nächster Monat (jahr)
            '2025-07-31', // Meditation - diesen Monat (monat)
            '2025-08-15', // Buch - nächster Monat (jahr)
            '2025-12-31', // Freelance - dieses Jahr (jahr)
            '2025-10-30', // Französisch - nächstes Quartal (jahr)
            '2025-08-20', // Minimalismus - nächster Monat (jahr)
            '2026-06-30'  // Master - 2026 (nur in 'alle' sichtbar)
        ];
        
        goalCards.forEach((card, index) => {
            if (index < demoDates.length) {
                card.setAttribute('data-target-date', demoDates[index]);
                updateGoalDateDisplay(card, demoDates[index]);
            }
        });
    }

    // Vision Board System
    const predefinedIcons = [
        '🏠', '🌍', '💪', '💼', '🎓', '❤️', '🚗', '✈️', '💰', '📚',
        '🎯', '🌟', '🔥', '💎', '🏆', '🌈', '🚀', '🎨', '🎵', '🌱',
        '⛵', '🏔️', '🏖️', '🎪', '🎭', '🎬', '📷', '🍽️', '☕', '🍷'
    ];

    function openVisionEditModal(visionItem = null, isNewVision = false) {
        const currentType = isNewVision ? 'goal' : (visionItem.getAttribute('data-vision-type') || 'goal');
        const currentIcon = isNewVision ? '🌟' : (visionItem.querySelector('.vision-icon')?.textContent || '🌟');
        const currentTitle = isNewVision ? '' : (visionItem.querySelector('.vision-title')?.textContent || '');
        const currentDescription = isNewVision ? '' : (visionItem.querySelector('.vision-description')?.textContent || '');
        const currentQuote = isNewVision ? '' : (visionItem.querySelector('.vision-quote')?.textContent || '');
        const currentAuthor = isNewVision ? '' : (visionItem.querySelector('.vision-author')?.textContent || '');
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 500px; width: 90%;">
                <h3 style="margin: 0 0 1.5rem 0; color: #333;">${isNewVision ? 'Neue Vision erstellen' : 'Vision bearbeiten'}</h3>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Typ:</label>
                    <select id="visionTypeInput" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                        <option value="goal" ${currentType === 'goal' ? 'selected' : ''}>Ziel/Vision</option>
                        <option value="quote" ${currentType === 'quote' ? 'selected' : ''}>Zitat</option>
                    </select>
                </div>
                
                <div id="goalFields" style="display: ${currentType === 'goal' ? 'block' : 'none'};">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Icon:</label>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div id="selectedIcon" style="font-size: 2rem; padding: 0.5rem; border: 2px solid #ddd; border-radius: 4px; min-width: 60px; text-align: center;">${currentIcon}</div>
                            <button type="button" id="chooseIconBtn" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Icon wählen</button>
                        </div>
                        <div id="iconPicker" style="display: none; margin-top: 1rem; max-height: 150px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 1rem;">
                            <div style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 0.5rem;">
                                ${predefinedIcons.map(icon => `<div class="icon-option" style="font-size: 1.5rem; padding: 0.5rem; text-align: center; cursor: pointer; border-radius: 4px; transition: background 0.2s;" data-icon="${icon}">${icon}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Titel:</label>
                        <input type="text" id="visionTitleInput" value="${currentTitle}" placeholder="z.B. Traumhaus" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Beschreibung:</label>
                        <input type="text" id="visionDescriptionInput" value="${currentDescription}" placeholder="z.B. 2026" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                    </div>
                </div>
                
                <div id="quoteFields" style="display: ${currentType === 'quote' ? 'block' : 'none'};">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Zitat:</label>
                        <textarea id="visionQuoteInput" placeholder="Der Weg ist das Ziel" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; min-height: 60px; resize: vertical;">${currentQuote}</textarea>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;">Autor:</label>
                        <input type="text" id="visionAuthorInput" value="${currentAuthor}" placeholder="z.B. Konfuzius" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.75rem; justify-content: space-between; margin-top: 2rem;">
                    ${!isNewVision ? '<button id="deleteVisionBtn" style="padding: 0.6rem 1.2rem; border: 1px solid #dc3545; background: white; color: #dc3545; border-radius: 4px; cursor: pointer;">🗑 Löschen</button>' : '<div></div>'}
                    <div style="display: flex; gap: 0.75rem;">
                        <button id="cancelVisionEdit" style="padding: 0.6rem 1.2rem; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Abbrechen</button>
                        <button id="saveVisionEdit" style="padding: 0.6rem 1.2rem; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">${isNewVision ? 'Erstellen' : 'Speichern'}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const typeInput = modal.querySelector('#visionTypeInput');
        const goalFields = modal.querySelector('#goalFields');
        const quoteFields = modal.querySelector('#quoteFields');
        const selectedIconDiv = modal.querySelector('#selectedIcon');
        const iconPicker = modal.querySelector('#iconPicker');
        const chooseIconBtn = modal.querySelector('#chooseIconBtn');
        const saveBtn = modal.querySelector('#saveVisionEdit');
        const cancelBtn = modal.querySelector('#cancelVisionEdit');
        const deleteBtn = modal.querySelector('#deleteVisionBtn');
        
        let selectedIcon = currentIcon;
        
        // Type change handler
        typeInput.addEventListener('change', function() {
            if (this.value === 'goal') {
                goalFields.style.display = 'block';
                quoteFields.style.display = 'none';
            } else {
                goalFields.style.display = 'none';
                quoteFields.style.display = 'block';
            }
        });
        
        // Icon picker handlers
        chooseIconBtn.addEventListener('click', function() {
            iconPicker.style.display = iconPicker.style.display === 'none' ? 'block' : 'none';
        });
        
        modal.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', function() {
                selectedIcon = this.getAttribute('data-icon');
                selectedIconDiv.textContent = selectedIcon;
                iconPicker.style.display = 'none';
            });
            
            option.addEventListener('mouseenter', function() {
                this.style.background = '#f0f0f0';
            });
            
            option.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
            });
        });
        
        function saveVision() {
            const type = typeInput.value;
            
            if (type === 'goal') {
                const title = modal.querySelector('#visionTitleInput').value.trim();
                const description = modal.querySelector('#visionDescriptionInput').value.trim();
                
                if (isNewVision) {
                    createNewVisionItem(type, selectedIcon, title, description);
                } else {
                    updateVisionItem(visionItem, type, selectedIcon, title, description);
                }
            } else {
                const quote = modal.querySelector('#visionQuoteInput').value.trim();
                const author = modal.querySelector('#visionAuthorInput').value.trim();
                
                if (isNewVision) {
                    createNewVisionItem(type, null, null, null, quote, author);
                } else {
                    updateVisionItem(visionItem, type, null, null, null, quote, author);
                }
            }
            
            document.body.removeChild(modal);
        }
        
        function cancelEdit() {
            document.body.removeChild(modal);
        }
        
        // Event listeners
        saveBtn.addEventListener('click', saveVision);
        cancelBtn.addEventListener('click', cancelEdit);
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (confirm('Möchtest du diese Vision wirklich löschen?')) {
                    document.body.removeChild(modal);
                    deleteVision(visionItem);
                }
            });
        }
        
        // ESC to cancel
        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') cancelEdit();
        });
        
        // Click outside to cancel
        modal.addEventListener('click', function(e) {
            if (e.target === modal) cancelEdit();
        });
    }

    function createNewVisionItem(type, icon, title, description, quote, author) {
        const visionGrid = document.querySelector('.vision-grid');
        if (!visionGrid) return;
        
        const visionItem = document.createElement('div');
        visionItem.className = 'vision-item';
        visionItem.setAttribute('data-vision-type', type);
        
        if (type === 'goal') {
            visionItem.innerHTML = `
                <div class="vision-icon">${icon}</div>
                <div class="vision-title">${title}</div>
                <div class="vision-description">${description}</div>
            `;
        } else {
            visionItem.innerHTML = `
                <div class="vision-quote">${quote}</div>
                <div class="vision-author">${author}</div>
            `;
        }
        
        visionGrid.appendChild(visionItem);
        addEditButtonToVisionItem(visionItem);
        makeDraggable(visionItem);
    }

    function updateVisionItem(visionItem, type, icon, title, description, quote, author) {
        visionItem.setAttribute('data-vision-type', type);
        
        if (type === 'goal') {
            visionItem.innerHTML = `
                <div class="vision-icon">${icon}</div>
                <div class="vision-title">${title}</div>
                <div class="vision-description">${description}</div>
            `;
        } else {
            visionItem.innerHTML = `
                <div class="vision-quote">${quote}</div>
                <div class="vision-author">${author}</div>
            `;
        }
        
        addEditButtonToVisionItem(visionItem);
        makeDraggable(visionItem);
    }

    function deleteVision(visionItem) {
        visionItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        visionItem.style.opacity = '0';
        visionItem.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (visionItem.parentNode) {
                visionItem.parentNode.removeChild(visionItem);
            }
        }, 300);
    }

    function addEditButtonToVisionItem(visionItem) {
        // Add minimalist edit button
        const editBtn = document.createElement('button');
        editBtn.style.cssText = `
            position: absolute; top: 12px; left: 12px;
            background: transparent; border: none;
            width: 20px; height: 20px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: #999; opacity: 0.5;
            transition: all 0.2s ease;
        `;
        if (typeof lucide !== 'undefined') {
            editBtn.innerHTML = '<i data-lucide="more-horizontal" style="width: 16px; height: 16px;"></i>';
            setTimeout(() => lucide.createIcons(editBtn), 10);
        } else {
            editBtn.innerHTML = '⋯';
        }
        editBtn.title = 'Vision bearbeiten';
        
        visionItem.style.position = 'relative';
        visionItem.appendChild(editBtn);
        
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openVisionEditModal(visionItem);
        });
        
        editBtn.addEventListener('mouseenter', function() {
            this.style.opacity = '1';
            this.style.color = '#333';
        });
        
        editBtn.addEventListener('mouseleave', function() {
            this.style.opacity = '0.5';
            this.style.color = '#999';
        });
    }

    function initializeVisionBoard() {
        // Add edit buttons to existing vision items
        const visionItems = document.querySelectorAll('.vision-item');
        visionItems.forEach(item => {
            addEditButtonToVisionItem(item);
            makeDraggable(item);
        });
        
        // Add new vision button handler
        const addVisionBtn = document.getElementById('addVisionBtn');
        if (addVisionBtn) {
            addVisionBtn.addEventListener('click', function() {
                openVisionEditModal(null, true);
            });
        }
        
        // Make vision grid a drop zone
        const visionGrid = document.querySelector('.vision-grid');
        if (visionGrid) {
            makeDropZone(visionGrid, '.vision-item');
        }
    }
    
    // Drag and Drop functionality
    function makeDraggable(element) {
        element.draggable = true;
        element.style.cursor = 'grab';
        
        element.addEventListener('dragstart', function(e) {
            this.style.opacity = '0.5';
            this.style.cursor = 'grabbing';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.outerHTML);
            e.dataTransfer.setData('text/plain', this.className);
        });
        
        element.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
            this.style.cursor = 'grab';
        });
    }
    
    function makeDropZone(container, draggableSelector) {
        container.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(container, e.clientY, draggableSelector);
            const dragElement = document.querySelector('.dragging') || container.querySelector('[style*="opacity: 0.5"]');
            
            if (afterElement == null) {
                container.appendChild(dragElement);
            } else {
                container.insertBefore(dragElement, afterElement);
            }
        });
        
        container.addEventListener('drop', function(e) {
            e.preventDefault();
            // Drop is handled by dragover for live reordering
        });
        
        container.addEventListener('dragenter', function(e) {
            e.preventDefault();
        });
    }
    
    function getDragAfterElement(container, y, selector) {
        const draggableElements = [...container.querySelectorAll(`${selector}:not([style*="opacity: 0.5"])`)];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Day Tracking System for Weekly Activities
    let weeklyTrackingData = {}; // Store day selections per week and type
    
    function getWeekKey(weekStart) {
        return `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`;
    }
    
    function saveDaySelection(type, day, selected) {
        const weekKey = getWeekKey(currentWeekStart);
        if (!weeklyTrackingData[weekKey]) {
            weeklyTrackingData[weekKey] = {};
        }
        if (!weeklyTrackingData[weekKey][type]) {
            weeklyTrackingData[weekKey][type] = {};
        }
        weeklyTrackingData[weekKey][type][day] = selected;
        console.log(`Saved ${type} day ${day}: ${selected} for week ${weekKey}`);
    }
    
    function loadDaySelections() {
        const weekKey = getWeekKey(currentWeekStart);
        const weekData = weeklyTrackingData[weekKey] || {};
        
        ['sport', 'nutrition', 'work7am'].forEach(type => {
            const typeData = weekData[type] || {};
            const dayButtons = document.querySelectorAll(`.day-button[data-type="${type}"]`);
            
            dayButtons.forEach(button => {
                const day = button.getAttribute('data-day');
                const isSelected = typeData[day] || false;
                
                if (isSelected) {
                    button.classList.add('selected');
                } else {
                    button.classList.remove('selected');
                }
            });
            
            updateDayCounter(type);
        });
        
        // Update monthly streaks when loading new week
        updateMonthlySportStreak();
        updateMonthlyWorkStreak();
        updateMonthlyNutritionStreak();
        
        // Sync to Analytics
        try {
            updateSportHeatmap('monat');
            updateWork7amHeatmap('monat');
        } catch (error) {
            console.log('Analytics sync error on week change:', error);
        }
        
        console.log(`Loaded day selections for week ${weekKey}`, weekData);
    }
    
    function updateDayCounter(type) {
        const dayButtons = document.querySelectorAll(`.day-button[data-type="${type}"]`);
        const selectedCount = document.querySelectorAll(`.day-button[data-type="${type}"].selected`).length;
        const totalCount = dayButtons.length;
        
        const countElement = document.getElementById(`${type}Count`);
        if (countElement) {
            countElement.textContent = `${selectedCount}/${totalCount} Tage`;
        }
    }
    
    function initializeDayTracking() {
        const dayButtons = document.querySelectorAll('.day-button');
        
        dayButtons.forEach(button => {
            button.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                const day = this.getAttribute('data-day');
                const isSelected = this.classList.contains('selected');
                
                // Toggle selection
                if (isSelected) {
                    this.classList.remove('selected');
                    saveDaySelection(type, day, false);
                } else {
                    this.classList.add('selected');
                    saveDaySelection(type, day, true);
                }
                
                // Update counter
                updateDayCounter(type);
                
                // Update Analytics heatmaps 
                // updateAnalyticsHeatmap(type, day, !isSelected); // DISABLED - analytics disabled
                
                console.log(`Toggled ${type} day ${day}: ${!isSelected}`);
            });
        });
        
        // Initialize counters
        updateDayCounter('sport');
        updateDayCounter('nutrition');
        updateDayCounter('work7am');
    }
    
    // Get current week number from journal display
    function getCurrentWeekNumber() {
        const currentWeekElement = document.getElementById('currentWeek');
        if (currentWeekElement) {
            const weekText = currentWeekElement.textContent; // e.g. "KW 30 • 21.-27. Juli 2025"
            const match = weekText.match(/KW (\d+)/);
            if (match) {
                return parseInt(match[1]);
            }
        }
        return 31; // fallback to current week
    }

    // Update Analytics heatmaps when day-buttons are clicked
    function updateAnalyticsHeatmap(type, day, isSelected) {
        console.log(`updateAnalyticsHeatmap called: type=${type}, day=${day}, isSelected=${isSelected}`);
        
        // Get the currently displayed week number from the journal
        const currentWeek = getCurrentWeekNumber();
        console.log(`Current week from journal: ${currentWeek}`);
        
        // Find the heatmap cell for the current week and day
        const selector = `[data-week="${currentWeek}"] [data-day="${day}"][data-type="${type}"]`;
        console.log(`Looking for heatmap cell with selector: ${selector}`);
        
        const heatmapCell = document.querySelector(selector);
        console.log(`Found heatmap cell:`, heatmapCell);
        
        if (heatmapCell) {
            const oldClass = heatmapCell.className;
            
            if (isSelected) {
                // Set to fully active
                heatmapCell.className = 'heatmap-cell heat-100';
            } else {
                // Set to inactive  
                heatmapCell.className = 'heatmap-cell heat-0';
            }
            
            console.log(`Updated Analytics heatmap cell: ${oldClass} → ${heatmapCell.className}`);
            console.log(`Analytics heatmap updated for ${type} day ${day} week ${currentWeek}: ${isSelected ? 'active' : 'inactive'}`);
        } else {
            console.warn(`Could not find heatmap cell for ${type} day ${day} week ${currentWeek}`);
            console.warn(`Searched for selector: ${selector}`);
            // Let's check if any similar cells exist
            console.warn(`Available cells for ${type}:`, document.querySelectorAll(`[data-type="${type}"]`));
        }
    }
    
    // Generate heatmap HTML based on period and type
    function generateHeatmapHTML(period, type) {
        let html = '';
        
        switch(period) {
            case '4weeks':
                // 4 weeks = 28 days in voller Breite mit Wochentagen
                html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; font-size: 0.9rem; color: #666; margin-bottom: 1rem; text-transform: uppercase; text-align: center; font-weight: 500;">
                    <span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>
                </div>`;
                
                [31, 30, 29, 28].forEach(weekNum => {
                    html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 1rem;" data-week="${weekNum}">`;
                    [1,2,3,4,5,6,0].forEach(day => {
                        html += `<div class="heatmap-cell heat-0" data-day="${day}" data-type="${type}" style="aspect-ratio: 1; min-height: 45px;"></div>`;
                    });
                    html += `</div>`;
                    html += `<div style="text-align: center; font-size: 0.8rem; color: #666; margin: 0.5rem 0 1rem 0; font-weight: 500;">KW ${weekNum}</div>`;
                });
                break;
                
            case '3months':
                // 3 months = 12 weeks in vollbreitem 4x3 Layout  
                html += `<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 1rem;">`;
                const weeks = [31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20];
                weeks.forEach(week => {
                    html += `<div class="heatmap-cell heat-0" data-week="${week}" data-type="${type}" style="aspect-ratio: 1; min-height: 40px; position: relative; display: flex; align-items: center; justify-content: center; font-weight: 500;">
                        KW${week}
                    </div>`;
                });
                html += `</div>`;
                break;
                
            case '6months':
                // 6 months = 6 month blocks (6x1 grid)  
                html += `<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 2rem;">`;
                ['Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul'].forEach((month, i) => {
                    html += `<div class="heatmap-cell heat-0" data-month="${i+2}" data-type="${type}" style="aspect-ratio: 1; min-height: 48px; position: relative; margin-bottom: 20px;">
                        <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; color: #666;">${month}</div>
                    </div>`;
                });
                html += `</div>`;
                break;
                
            case '1year':
                // 1 year = 12 months (6x2 grid)
                html += `<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 2rem;">`;
                ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'].forEach((month, i) => {
                    html += `<div class="heatmap-cell heat-0" data-month="${i+1}" data-type="${type}" style="aspect-ratio: 1; min-height: 40px; position: relative; margin-bottom: 20px;">
                        <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; color: #666;">${month}</div>
                    </div>`;
                });
                html += `</div>`;
                html += `<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 1rem;">`;
                ['Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'].forEach((month, i) => {
                    html += `<div class="heatmap-cell heat-0" data-month="${i+7}" data-type="${type}" style="aspect-ratio: 1; min-height: 40px; position: relative; margin-bottom: 20px;">
                        <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; color: #666;">${month}</div>
                    </div>`;
                });
                html += `</div>`;
                break;
        }
        
        return html;
    }
    
    // Update heatmap display based on selected period
    function updateHeatmapDisplay(heatmapType, period) {
        console.log(`updateHeatmapDisplay called: ${heatmapType}, ${period}`);
        
        const containerId = `${heatmapType}-heatmap-container`;
        const container = document.getElementById(containerId);
        const dataType = heatmapType === 'sport' ? 'sport' : 'work7am';
        
        console.log(`Looking for container: ${containerId}`, container);
        
        if (container) {
            const html = generateHeatmapHTML(period, dataType);
            console.log(`Generated HTML length: ${html.length}`);
            container.innerHTML = html;
            
            // Reload data for the new display
            loadHeatmapData(heatmapType, period, dataType);
            console.log(`Heatmap display updated for ${heatmapType} - ${period}`);
        } else {
            console.error(`Container not found: ${containerId}`);
        }
    }
    
    // Load and apply existing data to heatmap
    function loadHeatmapData(heatmapType, period, dataType) {
        const storedData = localStorage.getItem('weeklyTrackingData');
        const weeklyData = storedData ? JSON.parse(storedData) : {};
        
        if (period === '4weeks') {
            // Load week-based data (same as before)
            [28, 29, 30, 31].forEach(weekNum => {
                const weekKey = `2025-07-${weekNum}`;
                if (weeklyData[weekKey] && weeklyData[weekKey][dataType]) {
                    Object.entries(weeklyData[weekKey][dataType]).forEach(([day, isSelected]) => {
                        const heatmapCell = document.querySelector(`[data-week="${weekNum}"] [data-day="${day}"][data-type="${dataType}"]`);
                        if (heatmapCell && isSelected) {
                            heatmapCell.className = 'heatmap-cell heat-100';
                        }
                    });
                }
            });
        }
        // For other periods, we'll add aggregation logic later
    }
    
    // Initialize heatmap filter tabs
    function initializeHeatmapFilters() {
        console.log('Initializing heatmap filter tabs...');
        
        // More specific selectors for sport and work tabs
        const sportTabs = document.querySelectorAll('[data-heatmap="training"] [data-period]');
        const workTabs = document.querySelectorAll('[data-heatmap="work"] [data-period]');
        
        console.log('Found sport tabs:', sportTabs.length);
        console.log('Found work tabs:', workTabs.length);
        
        // Initialize sport tabs
        sportTabs.forEach((tab, index) => {
            console.log(`Sport Tab ${index}:`, tab.getAttribute('data-period'), tab.textContent);
            
            // Remove any existing listeners
            tab.onclick = null;
            
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('SPORT TAB CLICKED!', this.getAttribute('data-period'));
                
                const period = this.getAttribute('data-period');
                const parentTabs = this.parentElement;
                
                // Update active tab
                parentTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update heatmap display
                updateHeatmapDisplay('sport', period);
            }, true);
            
            // Fallback onclick
            tab.onclick = function(e) {
                e.preventDefault();
                console.log('ONCLICK SPORT TAB!', this.getAttribute('data-period'));
                const period = this.getAttribute('data-period');
                const parentTabs = this.parentElement;
                parentTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                updateHeatmapDisplay('sport', period);
            };
        });
        
        // Initialize work tabs
        workTabs.forEach((tab, index) => {
            console.log(`Work Tab ${index}:`, tab.getAttribute('data-period'), tab.textContent);
            
            // Remove any existing listeners
            tab.onclick = null;
            
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('WORK TAB CLICKED!', this.getAttribute('data-period'));
                
                const period = this.getAttribute('data-period');
                const parentTabs = this.parentElement;
                
                // Update active tab
                parentTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update heatmap display
                updateHeatmapDisplay('work', period);
            }, true);
            
            // Fallback onclick
            tab.onclick = function(e) {
                e.preventDefault();
                console.log('ONCLICK WORK TAB!', this.getAttribute('data-period'));
                const period = this.getAttribute('data-period');
                const parentTabs = this.parentElement;
                parentTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                updateHeatmapDisplay('work', period);
            };
        });
        
        console.log('Heatmap filter tabs initialized');
    }
    
    // Initialize Analytics heatmaps with default 4weeks view
    function initializeAnalyticsHeatmaps() {
        console.log('Initializing Analytics heatmaps...');
        
        // Set up default 4weeks view
        updateHeatmapDisplay('sport', '4weeks');
        updateHeatmapDisplay('work', '4weeks');
        
        console.log('Analytics heatmaps initialized with 4 weeks view');
    }
    
    function updateMonthlySportStreak() {
        try {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            let totalSportDays = 0;
            
            // Get all stored weekly data
            const storedData = localStorage.getItem('weeklyTrackingData');
            const weeklyData = storedData ? JSON.parse(storedData) : {};
            
            // Count sport days for current month across all weeks
            Object.keys(weeklyData).forEach(weekKey => {
                // Parse week key to get week date
                const [year, month, day] = weekKey.split('-').map(Number);
                const weekDate = new Date(year, month - 1, day);
                
                // Check if this week belongs to current month/year
                if (weekDate.getFullYear() === currentYear && weekDate.getMonth() === currentMonth) {
                    const weekData = weeklyData[weekKey];
                    if (weekData.sport) {
                        // Count selected sport days in this week
                        Object.values(weekData.sport).forEach(isSelected => {
                            if (isSelected) totalSportDays++;
                        });
                    }
                }
            });
            
            // Also count current week if not saved yet
            const currentWeekSelectedSport = document.querySelectorAll('.day-button[data-type="sport"].selected').length;
            const currentWeekKey = getCurrentWeekKey();
            if (!weeklyData[currentWeekKey]) {
                totalSportDays += currentWeekSelectedSport;
            }
            
            // Update sport streak tile
            const sportCountElement = document.getElementById('sportStreakCount');
            const sportDateElement = document.getElementById('sportStreakDate');
            
            if (sportCountElement) {
                sportCountElement.textContent = totalSportDays;
            }
            
            if (sportDateElement) {
                const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
                sportDateElement.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
            }
            
            console.log(`Monthly sport streak updated: ${totalSportDays} days in ${MONTH_NAMES[currentMonth]} ${currentYear}`);
        } catch (error) {
            console.log('Error in updateMonthlySportStreak:', error);
        }
    }
    
    function updateMonthlyWorkStreak() {
        try {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            let totalWorkDays = 0;
            
            // Get all stored weekly data
            const storedData = localStorage.getItem('weeklyTrackingData');
            const weeklyData = storedData ? JSON.parse(storedData) : {};
            
            // Count work7am days for current month across all weeks
            Object.keys(weeklyData).forEach(weekKey => {
                // Parse week key to get week date
                const [year, month, day] = weekKey.split('-').map(Number);
                const weekDate = new Date(year, month - 1, day);
                
                // Check if this week belongs to current month/year
                if (weekDate.getFullYear() === currentYear && weekDate.getMonth() === currentMonth) {
                    const weekData = weeklyData[weekKey];
                    if (weekData.work7am) {
                        // Count selected work7am days in this week
                        Object.values(weekData.work7am).forEach(isSelected => {
                            if (isSelected) totalWorkDays++;
                        });
                    }
                }
            });
            
            // Also count current week if not saved yet
            const currentWeekSelectedWork = document.querySelectorAll('.day-button[data-type="work7am"].selected').length;
            const currentWeekKey = getCurrentWeekKey();
            if (!weeklyData[currentWeekKey]) {
                totalWorkDays += currentWeekSelectedWork;
            }
            
            // Update work streak tile
            const workCountElement = document.getElementById('workStreakCount');
            const workDateElement = document.getElementById('workStreakDate');
            
            if (workCountElement) {
                workCountElement.textContent = totalWorkDays;
            }
            
            if (workDateElement) {
                const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
                workDateElement.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
            }
            
            console.log(`Monthly work streak updated: ${totalWorkDays} days in ${MONTH_NAMES[currentMonth]} ${currentYear}`);
        } catch (error) {
            console.log('Error in updateMonthlyWorkStreak:', error);
        }
    }
    
    function updateMonthlyNutritionStreak() {
        try {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            let totalNutritionDays = 0;
            
            // Get all stored weekly data
            const storedData = localStorage.getItem('weeklyTrackingData');
            const weeklyData = storedData ? JSON.parse(storedData) : {};
            
            // Count nutrition days for current month across all weeks
            Object.keys(weeklyData).forEach(weekKey => {
                // Parse week key to get week date
                const [year, month, day] = weekKey.split('-').map(Number);
                const weekDate = new Date(year, month - 1, day);
                
                // Check if this week belongs to current month/year
                if (weekDate.getFullYear() === currentYear && weekDate.getMonth() === currentMonth) {
                    const weekData = weeklyData[weekKey];
                    if (weekData.nutrition) {
                        // Count selected nutrition days in this week
                        Object.values(weekData.nutrition).forEach(isSelected => {
                            if (isSelected) totalNutritionDays++;
                        });
                    }
                }
            });
            
            // Also count current week if not saved yet
            const currentWeekSelectedNutrition = document.querySelectorAll('.day-button[data-type="nutrition"].selected').length;
            const currentWeekKey = getCurrentWeekKey();
            if (!weeklyData[currentWeekKey]) {
                totalNutritionDays += currentWeekSelectedNutrition;
            }
            
            // Update nutrition streak tile
            const nutritionCountElement = document.getElementById('nutritionStreakCount');
            const nutritionDateElement = document.getElementById('nutritionStreakDate');
            
            if (nutritionCountElement) {
                nutritionCountElement.textContent = totalNutritionDays;
            }
            
            if (nutritionDateElement) {
                const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
                nutritionDateElement.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
            }
            
            console.log(`Monthly nutrition streak updated: ${totalNutritionDays} days in ${MONTH_NAMES[currentMonth]} ${currentYear}`);
        } catch (error) {
            console.log('Error in updateMonthlyNutritionStreak:', error);
        }
    }
    
    function getCurrentWeekKey() {
        const weekStart = getWeekStart(new Date());
        return `${weekStart.getFullYear()}-${(weekStart.getMonth() + 1).toString().padStart(2, '0')}-${weekStart.getDate().toString().padStart(2, '0')}`;
    }

    // Journal System
    let currentDate = new Date();
    let currentWeekStart = getWeekStart(new Date());
    
    function formatDate(date) {
        const options = { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        };
        return date.toLocaleDateString('de-DE', options);
    }
    
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
        return new Date(d.setDate(diff));
    }
    
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    function formatWeek(weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekNum = getWeekNumber(weekStart);
        const startDay = weekStart.getDate().toString().padStart(2, '0');
        const endDay = weekEnd.getDate().toString().padStart(2, '0');
        
        // Check if week spans across different months
        const startMonth = weekStart.getMonth();
        const endMonth = weekEnd.getMonth();
        const startYear = weekStart.getFullYear();
        const endYear = weekEnd.getFullYear();
        
        if (startMonth === endMonth && startYear === endYear) {
            // Same month and year - use simple format
            const monthName = weekStart.toLocaleDateString('de-DE', { month: 'long' });
            return `KW ${weekNum} • ${startDay}.-${endDay}. ${monthName} ${startYear}`;
        } else if (startYear === endYear) {
            // Same year, different months - show both dates with their months
            const startMonthName = weekStart.toLocaleDateString('de-DE', { month: 'long' });
            const endMonthName = weekEnd.toLocaleDateString('de-DE', { month: 'long' });
            return `KW ${weekNum} • ${startDay}. ${startMonthName} - ${endDay}. ${endMonthName} ${startYear}`;
        } else {
            // Different years - show full date ranges
            const startMonthName = weekStart.toLocaleDateString('de-DE', { month: 'long' });
            const endMonthName = weekEnd.toLocaleDateString('de-DE', { month: 'long' });
            return `KW ${weekNum} • ${startDay}. ${startMonthName} ${startYear} - ${endDay}. ${endMonthName} ${endYear}`;
        }
    }
    
    function updateDateDisplay() {
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            currentDateElement.textContent = formatDate(currentDate);
        }
        
        const currentWeekElement = document.getElementById('currentWeek');
        if (currentWeekElement) {
            currentWeekElement.textContent = formatWeek(currentWeekStart);
        }
    }
    
    let currentJournalCategory = 'general';
    let journalEntries = {}; // Store entries per date and category
    
    function getJournalKey() {
        return `${formatDate(currentDate)}-${currentJournalCategory}`;
    }
    
    function saveJournalEntry() {
        const journalText = document.getElementById('journalText');
        if (journalText) {
            journalEntries[getJournalKey()] = journalText.value;
        }
    }
    
    function loadJournalEntry() {
        const journalText = document.getElementById('journalText');
        const key = getJournalKey();
        
        if (journalText) {
            journalText.value = journalEntries[key] || '';
        }
        
        // Update placeholder based on category
        updateJournalPlaceholder();
        updateCategoryVisualState();
    }
    
    function updateCategoryVisualState() {
        const journalCategories = document.querySelectorAll('.journal-category');
        
        journalCategories.forEach(category => {
            const categoryName = category.getAttribute('data-category');
            const key = `${formatDate(currentDate)}-${categoryName}`;
            const hasContent = journalEntries[key] && journalEntries[key].trim().length > 0;
            
            // Reset styling first
            if (categoryName === currentJournalCategory) {
                // Active category styling
                category.style.background = '#000';
                category.style.color = 'white';
            } else if (hasContent) {
                // Has content but not active - darker gray background
                category.style.background = '#e0e0e0';
                category.style.color = '#333';
                category.style.borderColor = '#bbb';
            } else {
                // No content and not active - default styling
                category.style.background = 'transparent';
                category.style.color = 'inherit';
                category.style.borderColor = '#e0e0e0';
            }
        });
    }
    
    function updateJournalPlaceholder() {
        const journalText = document.getElementById('journalText');
        if (!journalText) return;
        
        const placeholders = {
            'general': 'Wie war dein Tag? Was hast du gelernt? Wofür bist du dankbar?',
            'private': 'Wie fühlst du dich? Was beschäftigt dich privat?',
            'work': 'Wie lief die Arbeit heute? Welche Projekte hast du vorangebracht?',
            'health': 'Wie geht es deiner Gesundheit? Wie fühlst du dich körperlich?',
            'nutrition': 'Was hast du gegessen? Wie war deine Ernährung heute?',
            'sport': 'Welchen Sport hast du gemacht? Wie war dein Training?',
            'crypto': 'Wie entwickeln sich deine Investments? Welche Märkte beobachtest du?'
        };
        
        journalText.placeholder = placeholders[currentJournalCategory] || placeholders['general'];
    }

    function initializeJournal() {
        console.log('=== INITIALIZING JOURNAL ===');
        
        const prevDayBtn = document.getElementById('prevDay');
        const nextDayBtn = document.getElementById('nextDay');
        const todayBtn = document.getElementById('todayBtn');
        const prevWeekBtn = document.getElementById('prevWeek');
        const nextWeekBtn = document.getElementById('nextWeek');
        const currentWeekBtn = document.getElementById('currentWeekBtn');
        const moodEmojis = document.querySelectorAll('.mood-emoji');
        const journalCategories = document.querySelectorAll('.journal-category');
        const journalText = document.getElementById('journalText');
        
        console.log('Journal elements found:', {
            prevWeekBtn: !!prevWeekBtn,
            nextWeekBtn: !!nextWeekBtn, 
            currentWeekBtn: !!currentWeekBtn,
            moodEmojis: moodEmojis.length,
            journalCategories: journalCategories.length,
            journalText: !!journalText
        });
        
        // Date navigation
        if (prevDayBtn) {
            prevDayBtn.addEventListener('click', function() {
                saveJournalEntry(); // Save current entry before switching
                currentDate.setDate(currentDate.getDate() - 1);
                updateDateDisplay();
                loadJournalEntry(); // Load entry for new date
                console.log('Previous day:', formatDate(currentDate));
            });
        }
        
        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', function() {
                saveJournalEntry(); // Save current entry before switching
                currentDate.setDate(currentDate.getDate() + 1);
                updateDateDisplay();
                loadJournalEntry(); // Load entry for new date
                console.log('Next day:', formatDate(currentDate));
            });
        }
        
        // "Heute" button - jump to today's date
        if (todayBtn) {
            todayBtn.addEventListener('click', function() {
                saveJournalEntry(); // Save current entry before switching
                currentDate = new Date(); // Reset to today
                updateDateDisplay();
                loadJournalEntry(); // Load entry for today
                console.log('Jumped to today:', formatDate(currentDate));
            });
        }
        
        // Category selection
        journalCategories.forEach(category => {
            category.addEventListener('click', function() {
                saveJournalEntry(); // Save current entry before switching category
                
                // Update current category
                currentJournalCategory = this.getAttribute('data-category');
                loadJournalEntry(); // Load entry for this category (includes visual state update)
                
                console.log('Journal category selected:', currentJournalCategory);
            });
        });
        
        // Auto-save on text change
        if (journalText) {
            journalText.addEventListener('input', function() {
                saveJournalEntry();
                updateCategoryVisualState(); // Update visual state when content changes
            });
        }
        
        // Mood selection
        moodEmojis.forEach(emoji => {
            emoji.addEventListener('click', function() {
                // Remove selected class from all emojis
                moodEmojis.forEach(e => {
                    e.classList.remove('selected');
                    e.style.border = '1px solid transparent';
                });
                
                // Add selected class to clicked emoji
                this.classList.add('selected');
                this.style.border = '1px solid #000';
                
                console.log('Mood selected:', this.getAttribute('data-mood'));
            });
        });
        
        // Week navigation
        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', function() {
                currentWeekStart.setDate(currentWeekStart.getDate() - 7);
                updateDateDisplay();
                loadDaySelections(); // Load day tracking data for the new week
                console.log('Previous week:', formatWeek(currentWeekStart));
            });
        }
        
        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', function() {
                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
                updateDateDisplay();
                loadDaySelections(); // Load day tracking data for the new week
                console.log('Next week:', formatWeek(currentWeekStart));
            });
        }
        
        // "Aktuelle Woche" button - jump to current week
        if (currentWeekBtn) {
            currentWeekBtn.addEventListener('click', function() {
                currentWeekStart = getWeekStart(new Date()); // Reset to current week start
                updateDateDisplay();
                loadDaySelections(); // Load day tracking data for the current week
                console.log('Jumped to current week:', formatWeek(currentWeekStart));
            });
        }
        
        // Initialize date display and load current entry
        updateDateDisplay();
        loadJournalEntry();
        
        // Initialize day buttons for sport/nutrition/work7am tracking
        console.log('Initializing day buttons...');
        const dayButtons = document.querySelectorAll('.day-button');
        console.log('Found day buttons:', dayButtons.length);
        
        dayButtons.forEach((button, index) => {
            console.log(`Setting up button ${index}:`, button.getAttribute('data-type'), button.getAttribute('data-day'));
            
            button.addEventListener('click', function() {
                console.log('Day button clicked:', this.getAttribute('data-type'), this.getAttribute('data-day'));
                
                const type = this.getAttribute('data-type');
                const day = this.getAttribute('data-day');
                const isSelected = this.classList.contains('selected');
                
                // Toggle selection
                if (isSelected) {
                    this.classList.remove('selected');
                    saveDaySelection(type, day, false);
                } else {
                    this.classList.add('selected');
                    saveDaySelection(type, day, true);
                }
                
                // Update counter
                updateDayCounter(type);
                
                // Update Analytics heatmaps
                // updateAnalyticsHeatmap(type, day, !isSelected); // DISABLED - analytics disabled
                
                // Update monthly streak tiles on home page
                if (type === 'sport') {
                    updateMonthlySportStreak();
                } else if (type === 'work7am') {
                    updateMonthlyWorkStreak();
                } else if (type === 'nutrition') {
                    updateMonthlyNutritionStreak();
                }
                
                console.log(`Toggled ${type} day ${day}: ${!isSelected}`);
            });
        });
        
        // Initialize counters
        updateDayCounter('sport');
        updateDayCounter('nutrition');
        updateDayCounter('work7am');
        
        console.log('Day buttons initialized');
    }
    
    // Initialize current week's day selections from HTML state
    function initializeCurrentWeekData() {
        const weekKey = getWeekKey(currentWeekStart);
        if (!weeklyTrackingData[weekKey]) {
            weeklyTrackingData[weekKey] = {};
        }
        
        // Initialize from current HTML state
        ['sport', 'nutrition', 'work7am'].forEach(type => {
            if (!weeklyTrackingData[weekKey][type]) {
                weeklyTrackingData[weekKey][type] = {};
            }
            
            const dayButtons = document.querySelectorAll(`.day-button[data-type="${type}"]`);
            dayButtons.forEach(button => {
                const day = button.getAttribute('data-day');
                const isSelected = button.classList.contains('selected');
                weeklyTrackingData[weekKey][type][day] = isSelected;
            });
        });
        
        console.log(`Initialized current week data for ${weekKey}`, weeklyTrackingData[weekKey]);
    }

    // Heatmap Filter System for Analytics
    function initializeHeatmapFilters() {
        // Get all heatmap filter tabs with their specific period attributes
        const heatmapFilters = document.querySelectorAll('[data-routine-period], [data-mood-period], [data-training-period], [data-work-period]');
        
        heatmapFilters.forEach(tab => {
            tab.addEventListener('click', function() {
                // Get the heatmap type from data-heatmap attribute
                const heatmapType = this.getAttribute('data-heatmap');
                
                // Get the period from whichever period attribute exists
                const period = this.getAttribute('data-routine-period') || 
                              this.getAttribute('data-mood-period') || 
                              this.getAttribute('data-training-period') || 
                              this.getAttribute('data-work-period');
                
                // Remove active class from all tabs in the same heatmap section
                const siblingTabs = document.querySelectorAll(`[data-heatmap="${heatmapType}"]`);
                siblingTabs.forEach(siblingTab => {
                    siblingTab.classList.remove('active');
                });
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Log the selection for now (later this can trigger data updates)
                console.log(`Heatmap filter selected - Type: ${heatmapType}, Period: ${period}`);
                
                // Update heatmap visualization based on selected period
                if (heatmapType === 'training') {
                    updateSportHeatmap(period);
                } else if (heatmapType === 'work') {
                    updateWork7amHeatmap(period);
                }
                // TODO: Add morning, evening, mood heatmap updates later
            });
        });
        
        console.log('Heatmap filters initialized for Analytics section');
    }

    // Heatmap Update Functions for Analytics Sync
    function updateSportHeatmap(period = 'monat') {
        console.log(`Updating sport heatmap for period: ${period}`);
        
        const sportData = getWeeklyTrackingData('sport', period);
        const trainingElement = document.querySelector('[data-heatmap="training"]');
        if (!trainingElement) {
            console.log('Training heatmap element not found');
            return;
        }
        
        const section = trainingElement.closest('section');
        if (!section) {
            console.log('Training section not found');
            return;
        }
        
        const heatmapContainer = section.querySelector('.heatmap');
        if (!heatmapContainer) {
            console.log('Training heatmap container not found');
            return;
        }
        
        updateHeatmapCells(heatmapContainer, sportData);
    }
    
    function updateWork7amHeatmap(period = 'monat') {
        console.log(`Updating work7am heatmap for period: ${period}`);
        
        const workData = getWeeklyTrackingData('work7am', period);
        const workElement = document.querySelector('[data-heatmap="work"]');
        if (!workElement) {
            console.log('Work heatmap element not found');
            return;
        }
        
        const section = workElement.closest('section');
        if (!section) {
            console.log('Work section not found');
            return;
        }
        
        const heatmapContainer = section.querySelector('.heatmap');
        if (!heatmapContainer) {
            console.log('Work heatmap container not found');
            return;
        }
        
        updateHeatmapCells(heatmapContainer, workData);
    }
    
    function getWeeklyTrackingData(type, period) {
        const storedData = localStorage.getItem('weeklyTrackingData');
        const weeklyData = storedData ? JSON.parse(storedData) : {};
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const result = [];
        
        // Get date range based on period
        let startDate, endDate;
        if (period === 'woche') {
            startDate = getWeekStart(now);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
        } else if (period === 'monat') {
            startDate = new Date(currentYear, currentMonth, 1);
            endDate = new Date(currentYear, currentMonth + 1, 0);
        } else if (period === 'quartal') {
            const quarterStart = Math.floor(currentMonth / 3) * 3;
            startDate = new Date(currentYear, quarterStart, 1);
            endDate = new Date(currentYear, quarterStart + 3, 0);
        }
        
        // Collect data for the period
        Object.keys(weeklyData).forEach(weekKey => {
            const [year, month, day] = weekKey.split('-').map(Number);
            const weekDate = new Date(year, month - 1, day);
            
            if (weekDate >= startDate && weekDate <= endDate) {
                const weekData = weeklyData[weekKey];
                if (weekData[type]) {
                    Object.keys(weekData[type]).forEach(dayNum => {
                        if (weekData[type][dayNum]) {
                            const actualDate = new Date(weekDate);
                            actualDate.setDate(weekDate.getDate() + parseInt(dayNum));
                            result.push(actualDate);
                        }
                    });
                }
            }
        });
        
        return result;
    }
    
    function updateHeatmapCells(heatmapContainer, dataPoints) {
        const cells = heatmapContainer.querySelectorAll('.heatmap-cell');
        
        // Clear existing heat classes
        cells.forEach(cell => {
            cell.className = 'heatmap-cell heat-0';
        });
        
        // Simple demonstration: mark cells with data as active
        // In a real implementation, you'd map dates to specific cells
        const totalCells = cells.length;
        const activeCells = Math.min(dataPoints.length, totalCells);
        
        for (let i = 0; i < activeCells; i++) {
            if (cells[i]) {
                // Heat level based on activity intensity (simplified)
                const heatLevel = Math.min(100, (dataPoints.length / totalCells) * 100);
                const heatClass = getHeatClass(heatLevel);
                cells[i].className = `heatmap-cell ${heatClass}`;
            }
        }
        
        console.log(`Updated heatmap with ${dataPoints.length} data points`);
    }
    
    function getHeatClass(percentage) {
        if (percentage >= 90) return 'heat-100';
        if (percentage >= 70) return 'heat-80';
        if (percentage >= 50) return 'heat-60';
        if (percentage >= 30) return 'heat-40';
        if (percentage >= 10) return 'heat-20';
        return 'heat-0';
    }
    
    // Old analytics functions removed - using new dynamic system

    // Populate heute filter with all category todos (avoid duplicates)
    function populateHeuteFilter() {
        const heuteContainer = document.querySelector('[data-filter="heute"] .checkbox-group');
        if (!heuteContainer) return;
        
        // Get existing texts in heute to avoid duplicates
        const existingTexts = new Set();
        const existingTodos = heuteContainer.querySelectorAll('.checkbox-item label');
        existingTodos.forEach(label => {
            existingTexts.add(label.textContent.trim());
        });
        
        // Get all todos from privat, arbeit, uni that should appear in heute
        ['privat', 'arbeit', 'uni'].forEach(category => {
            const categoryTodos = document.querySelectorAll(`[data-filter="${category}"] .checkbox-item`);
            categoryTodos.forEach(todo => {
                const label = todo.querySelector('label');
                const todoText = label ? label.textContent.trim() : '';
                
                // Only add if not already exists in heute
                if (!existingTexts.has(todoText)) {
                    const todoClone = todo.cloneNode(true);
                    
                    // Update IDs to avoid conflicts
                    const checkbox = todoClone.querySelector('input');
                    const clonedLabel = todoClone.querySelector('label');
                    const originalId = checkbox.id || `todo_${Math.random().toString(36).substr(2, 9)}`;
                    const newId = `heute_${originalId}`;
                    
                    checkbox.id = newId;
                    if (clonedLabel) clonedLabel.setAttribute('for', newId);
                    
                    // Add to heute container
                    heuteContainer.appendChild(todoClone);
                    existingTexts.add(todoText);
                    
                    console.log(`Added "${todoText}" from ${category} to heute`);
                }
            });
        });
        
        console.log('Populated heute filter with todos from all categories (no duplicates)');
    }

    // Sort existing todos in heute filter chronologically
    function sortHeuteTodos() {
        const heuteContainer = document.querySelector('[data-filter="heute"] .checkbox-group');
        if (!heuteContainer) return;
        
        const allTodos = Array.from(heuteContainer.children);
        
        // Sort todos chronologically
        allTodos.sort((a, b) => {
            const getDateTime = (todo) => {
                const timeSpan = todo.querySelector('span');
                const timeText = timeSpan ? timeSpan.textContent.trim() : '';
                
                // Default to today
                let date = new Date();
                date.setHours(0, 0, 0, 0);
                
                // Check for date attribute
                const dateAttr = todo.getAttribute('data-date');
                if (dateAttr && dateAttr !== '') {
                    date = new Date(dateAttr);
                }
                
                // Parse time from display text
                let time = '23:59'; // Default end of day
                
                if (timeText.includes('Überfällig')) {
                    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
                    time = timeMatch ? timeMatch[0] : '00:01';
                    date.setDate(date.getDate() - 1); // Yesterday
                } else if (timeText.includes('Morgen')) {
                    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
                    time = timeMatch ? timeMatch[0] : '08:00';
                    date.setDate(date.getDate() + 1); // Tomorrow
                } else if (timeText.match(/^\d{1,2}:\d{2}$/)) {
                    time = timeText;
                } else if (timeText.includes('Heute')) {
                    time = '23:59';
                }
                
                // Combine date and time
                const [hours, minutes] = time.split(':').map(Number);
                const fullDateTime = new Date(date);
                fullDateTime.setHours(hours, minutes, 0, 0);
                
                return fullDateTime;
            };
            
            return getDateTime(a) - getDateTime(b);
        });
        
        // Clear container and re-add in sorted order
        heuteContainer.innerHTML = '';
        allTodos.forEach(todo => {
            heuteContainer.appendChild(todo);
        });
        
        console.log('Sorted heute todos chronologically');
    }

    // Daily Progress Tracking System
    let dailyProgressData = {
        date: null,
        totalTodosStarted: 0, // Total todos we started the day with
        archivedCount: 0,     // How many we completed and archived
        currentActive: 0      // How many are still active/visible
    };

    function updateDailyProgress() {
        const today = new Date().toDateString();
        const heuteContainer = document.querySelector('[data-filter="heute"] .checkbox-group');
        const counterElement = document.getElementById('todayTaskCounter');
        const todosTabProgressText = document.getElementById('todoProgressText');
        const todosTabProgressBar = document.querySelector('#todoProgress .progress-fill');
        
        if (!heuteContainer) return;
        
        // Reset progress if it's a new day
        if (dailyProgressData.date !== today) {
            const currentTodos = heuteContainer.querySelectorAll('.checkbox-item').length;
            dailyProgressData = {
                date: today,
                totalTodosStarted: currentTodos,
                archivedCount: 0,
                currentActive: currentTodos
            };
            console.log('Daily progress reset for new day:', today, 'Starting with', currentTodos, 'todos');
        }
        
        // Count current active todos
        const activeTodos = heuteContainer.querySelectorAll('.checkbox-item');
        dailyProgressData.currentActive = activeTodos.length;
        
        // Update total if new todos were added today
        const currentTotalTodos = dailyProgressData.currentActive + dailyProgressData.archivedCount;
        if (currentTotalTodos > dailyProgressData.totalTodosStarted) {
            dailyProgressData.totalTodosStarted = currentTotalTodos;
        }
        
        // Calculate completed todos based on archived count
        const completedToday = dailyProgressData.archivedCount;
        
        // Update counter displays - show completed vs original total
        const progressText = `${completedToday} von ${dailyProgressData.totalTodosStarted} erledigt`;
        
        if (counterElement) {
            counterElement.textContent = progressText;
        }
        if (todosTabProgressText) {
            todosTabProgressText.textContent = `${completedToday} von ${dailyProgressData.totalTodosStarted} Aufgaben erledigt`;
        }
        
        // Calculate progress percentage
        const percentage = dailyProgressData.totalTodosStarted > 0 
            ? Math.round((completedToday / dailyProgressData.totalTodosStarted) * 100)
            : 0;
        
        console.log(`Daily Progress: ${completedToday}/${dailyProgressData.totalTodosStarted} (${percentage}%) - ${dailyProgressData.currentActive} remaining`);
        
        // Update progress bars
        if (todosTabProgressBar) {
            todosTabProgressBar.style.width = percentage + '%';
        }
        
        // Update percentage text in todos tab
        const todosTabPercentageText = document.querySelector('#todoProgress .progress-text');
        if (todosTabPercentageText) {
            todosTabPercentageText.textContent = percentage + '%';
        }
        
        return {
            totalStarted: dailyProgressData.totalTodosStarted,
            completed: completedToday,
            remaining: dailyProgressData.currentActive,
            percentage: percentage
        };
    }

    // Initialize daily progress on startup
    function initializeDailyProgress() {
        // Check if todos were loaded/populated first
        setTimeout(() => {
            updateDailyProgress();
            console.log('Daily progress system initialized');
        }, 100);
    }

    // Monthly Todo Streak System
    let monthlyTodoData = {
        month: null,
        year: null,
        completedCount: 0
    };

    function updateMonthlyTodoStreak() {
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-11
        const currentYear = now.getFullYear();
        const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                           'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        
        const countElement = document.getElementById('monthlyTodosCount');
        const dateElement = document.getElementById('monthlyTodosDate');
        
        if (!countElement || !dateElement) return;
        
        // Reset count if it's a new month
        if (monthlyTodoData.month !== currentMonth || monthlyTodoData.year !== currentYear) {
            monthlyTodoData = {
                month: currentMonth,
                year: currentYear,
                completedCount: 0
            };
            console.log(`Monthly todo streak reset for ${MONTH_NAMES[currentMonth]} ${currentYear}`);
        }
        
        // Count archived todos from current month
        const archiveContainer = document.querySelector('[data-filter="archiv"] .checkbox-group');
        if (archiveContainer) {
            const archivedTodos = archiveContainer.querySelectorAll('.checkbox-item[data-archived-at]');
            let monthlyCount = 0;
            
            archivedTodos.forEach(todo => {
                const archivedAt = todo.getAttribute('data-archived-at');
                if (archivedAt) {
                    const archiveDate = new Date(archivedAt);
                    if (archiveDate.getMonth() === currentMonth && 
                        archiveDate.getFullYear() === currentYear) {
                        monthlyCount++;
                    }
                }
            });
            
            monthlyTodoData.completedCount = monthlyCount;
        }
        
        // Update display
        countElement.textContent = monthlyTodoData.completedCount;
        dateElement.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
        
        console.log(`Monthly todos completed: ${monthlyTodoData.completedCount} in ${MONTH_NAMES[currentMonth]} ${currentYear}`);
        
        return monthlyTodoData.completedCount;
    }

    function initializeMonthlyTodoStreak() {
        // Update monthly streak on startup
        setTimeout(() => {
            updateMonthlyTodoStreak();
            console.log('Monthly todo streak system initialized');
        }, 200);
    }

    // Keep Home showing exactly 5 current todos
    function updateHomeTodos() {
        const homeContainer = document.querySelector('#home section.card .checkbox-group');
        const heuteContainer = document.querySelector('[data-filter="heute"] .checkbox-group');
        
        if (!homeContainer || !heuteContainer) return;
        
        // Get all unchecked todos from heute (sorted by date AND time)
        const allHeuteTodos = Array.from(heuteContainer.querySelectorAll('.checkbox-item'))
            .filter(todo => {
                const checkbox = todo.querySelector('input[type="checkbox"]');
                return checkbox && !checkbox.checked;
            })
            .sort((a, b) => {
                // Extract date and time information
                const getDateTimeInfo = (todo) => {
                    const timeSpan = todo.querySelector('span');
                    const timeText = timeSpan ? timeSpan.textContent.trim() : '';
                    
                    // Get date from data attribute or assume today
                    const dateAttr = todo.getAttribute('data-date') || 
                                   todo.closest('.checkbox-item')?.getAttribute('data-date');
                    
                    let date = new Date();
                    if (dateAttr && dateAttr !== '') {
                        date = new Date(dateAttr);
                    }
                    
                    // Parse time from text (handle "Heute", "Morgen 20:00", "14:00", "Überfällig 15:00", etc.)
                    let time = '23:59'; // Default end time
                    
                    if (timeText.includes('Überfällig')) {
                        // Overdue tasks get priority (early time)
                        const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
                        time = timeMatch ? timeMatch[0] : '00:01';
                        date.setDate(date.getDate() - 1); // Yesterday
                    } else if (timeText.includes('Morgen')) {
                        const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
                        time = timeMatch ? timeMatch[0] : '08:00';
                        date.setDate(date.getDate() + 1); // Tomorrow
                    } else if (timeText.match(/^\d{1,2}:\d{2}$/)) {
                        // Direct time format like "14:00"
                        time = timeText;
                    } else if (timeText.includes('Heute')) {
                        time = '23:59'; // End of day
                    }
                    
                    // Combine date and time for sorting
                    const [hours, minutes] = time.split(':').map(Number);
                    const fullDateTime = new Date(date);
                    fullDateTime.setHours(hours, minutes, 0, 0);
                    
                    return fullDateTime;
                };
                
                const dateTimeA = getDateTimeInfo(a);
                const dateTimeB = getDateTimeInfo(b);
                
                return dateTimeA - dateTimeB; // Chronological order
            });
        
        // Clear current home todos
        homeContainer.innerHTML = '';
        
        // Add first 5 unchecked todos to home
        const todosToShow = allHeuteTodos.slice(0, 5);
        todosToShow.forEach((todo, index) => {
            const homeClone = todo.cloneNode(true);
            
            // Update IDs to avoid conflicts but keep shared-id for sync
            const checkbox = homeClone.querySelector('input');
            const label = homeClone.querySelector('label');
            const sharedId = todo.getAttribute('data-shared-id') || todo.querySelector('input')?.getAttribute('data-shared-id');
            
            const newId = `home_todo_${index}_${Date.now()}`;
            checkbox.id = newId;
            if (label) label.setAttribute('for', newId);
            
            // Maintain shared-id for synchronization
            if (sharedId) {
                homeClone.setAttribute('data-shared-id', sharedId);
                checkbox.setAttribute('data-shared-id', sharedId);
            }
            
            // Add sync event listener
            checkbox.addEventListener('change', function() {
                if (sharedId) {
                    console.log(`Home todo checked: ${sharedId}, ${this.checked}`);
                    todoState.setTodoChecked(sharedId, this.checked);
                }
                // Update home todos and daily progress when something gets checked
                setTimeout(() => {
                    updateHomeTodos();
                    updateDailyProgress();
                }, 100);
            });
            
            homeContainer.appendChild(homeClone);
        });
        
        console.log(`Updated Home to show ${todosToShow.length}/5 current todos`);
    }

    // Extend the task archiving to also update home todos, daily progress, and monthly streak
    const originalArchiveTodo = todoState.archiveTodo;
    todoState.archiveTodo = function(id) {
        originalArchiveTodo.call(this, id);
        
        // Increment archived count for today's progress
        const today = new Date().toDateString();
        if (dailyProgressData.date === today) {
            dailyProgressData.archivedCount++;
        }
        
        // Update all counters after archiving
        setTimeout(() => {
            updateHomeTodos();
            updateDailyProgress();
            updateMonthlyTodoStreak();
        }, 300);
    };

    // === DEADLINE MANAGEMENT SYSTEM ===
    
    let deadlines = [];
    
    // Initialize with demo data if no cloud data exists
    async function initializeDefaultDeadlines() {
        const existingDeadlines = await cloudStorage.getDeadlines();
        
        if (!existingDeadlines || existingDeadlines.length === 0) {
            const defaultDeadlines = [
                { title: "Klausur Mathematik", date: "2025-08-12", category: "uni" },
                { title: "Projekt Deadline", date: "2025-08-16", category: "arbeit" },
                { title: "Hausarbeit Abgabe", date: "2025-08-24", category: "uni" },
                { title: "Präsentation Uni", date: "2025-09-01", category: "uni" },
                { title: "Semester Ende", date: "2025-09-23", category: "uni" },
                { title: "Geburtstag Mama", date: "2025-10-15", category: "privat" }
            ];
            
            // Save demo data to cloud
            for (const deadline of defaultDeadlines) {
                await cloudStorage.saveDeadline(deadline);
            }
            
            deadlines = defaultDeadlines;
        } else {
            deadlines = existingDeadlines;
        }
    }
    
    function calculateDaysUntil(dateString) {
        const today = new Date();
        const targetDate = new Date(dateString);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    async function updateDeadlineDisplay() {
        // Load deadlines from cloud first
        deadlines = await cloudStorage.getDeadlines();
        
        // Find the deadline section by looking for the specific heading
        const section = Array.from(document.querySelectorAll('section')).find(s => {
            const h2 = s.querySelector('h2');
            return h2 && h2.textContent.includes('🚨 Wichtige Termine');
        });
        
        const streakGrid = section ? section.querySelector('.streak-grid') : null;
        if (!streakGrid) return;
        
        // Sort deadlines by urgency (soonest first)
        const sortedDeadlines = [...deadlines].sort((a, b) => {
            return calculateDaysUntil(a.date) - calculateDaysUntil(b.date);
        });
        
        // Take only first 6 for display
        const displayDeadlines = sortedDeadlines.slice(0, 6);
        
        // Clear current display
        streakGrid.innerHTML = '';
        
        // Generate deadline tiles
        displayDeadlines.forEach((deadline, index) => {
            const daysUntil = calculateDaysUntil(deadline.date);
            
            const tile = document.createElement('div');
            tile.className = 'streak-tile deadline-tile';
            tile.setAttribute('data-deadline-index', index);
            tile.style.cursor = 'pointer';
            
            // Add urgency styling based on days
            let urgencyClass = '';
            if (daysUntil <= 7) urgencyClass = 'urgent';
            else if (daysUntil <= 30) urgencyClass = 'soon';
            else urgencyClass = 'relaxed';
            
            tile.innerHTML = `
                <div class="streak-number">${daysUntil}</div>
                <div class="streak-label">Tage bis</div>
                <div class="streak-date">${deadline.title}</div>
            `;
            
            // Add click event for editing
            tile.addEventListener('click', () => openDeadlineEditModal(deadline, index));
            
            // Add hover effect
            tile.addEventListener('mouseenter', () => {
                tile.style.transform = 'translateY(-2px)';
                tile.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            });
            tile.addEventListener('mouseleave', () => {
                tile.style.transform = 'translateY(0)';
                tile.style.boxShadow = 'none';
            });
            
            streakGrid.appendChild(tile);
        });
        
        console.log('Deadline display updated');
    }
    
    function openDeadlineEditModal(deadline = null, index = -1) {
        const isEdit = deadline !== null;
        const modalTitle = isEdit ? 'Termin bearbeiten' : 'Neuer Termin';
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;
        
        modal.innerHTML = `
            <div style="background: var(--card-bg); padding: 2rem; border-radius: 8px; width: 100%; max-width: 400px; border: 1px solid var(--border-color);">
                <h3 style="margin: 0 0 1.5rem 0; color: var(--text-primary);">${modalTitle}</h3>
                
                <div class="form-group">
                    <label class="form-label">Titel</label>
                    <input type="text" id="deadlineTitle" class="form-input" value="${deadline?.title || ''}" placeholder="z.B. Klausur Mathematik">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Datum</label>
                    <input type="date" id="deadlineDate" class="form-input" value="${deadline?.date || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Kategorie</label>
                    <select id="deadlineCategory" class="form-select">
                        <option value="privat" ${deadline?.category === 'privat' ? 'selected' : ''}>Privat</option>
                        <option value="arbeit" ${deadline?.category === 'arbeit' ? 'selected' : ''}>Arbeit</option>
                        <option value="uni" ${deadline?.category === 'uni' ? 'selected' : ''}>Uni</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 2rem; flex-wrap: wrap;">
                    ${isEdit ? '<button id="deleteDeadlineBtn" class="btn" style="background: #dc3545; border-color: #dc3545; color: white; margin-right: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem; white-space: nowrap;">Löschen</button>' : ''}
                    <button id="cancelDeadlineBtn" class="btn" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); min-width: 80px; padding: 0.5rem 1rem;">Abbrechen</button>
                    <button id="saveDeadlineBtn" class="btn" style="background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--input-border); min-width: 80px; padding: 0.5rem 1rem;">${isEdit ? 'Speichern' : 'Hinzufügen'}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const titleInput = modal.querySelector('#deadlineTitle');
        const dateInput = modal.querySelector('#deadlineDate');
        const categorySelect = modal.querySelector('#deadlineCategory');
        const cancelBtn = modal.querySelector('#cancelDeadlineBtn');
        const saveBtn = modal.querySelector('#saveDeadlineBtn');
        const deleteBtn = modal.querySelector('#deleteDeadlineBtn');
        
        // Close modal function
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        // Cancel button
        cancelBtn.addEventListener('click', closeModal);
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Save button
        saveBtn.addEventListener('click', async () => {
            const title = titleInput.value.trim();
            const date = dateInput.value;
            const category = categorySelect.value;
            
            if (!title || !date) {
                alert('Bitte Titel und Datum eingeben!');
                return;
            }
            
            const newDeadline = { title, date, category };
            
            if (isEdit) {
                // Update existing deadline
                newDeadline.id = deadlines[index].id;
                deadlines[index] = newDeadline;
                await cloudStorage.saveDeadline(newDeadline);
                console.log('Deadline updated:', newDeadline);
            } else {
                // Add new deadline
                await cloudStorage.saveDeadline(newDeadline);
                deadlines.push(newDeadline);
                console.log('Deadline added:', newDeadline);
            }
            
            await updateDeadlineDisplay();
            closeModal();
        });
        
        // Delete button (only in edit mode)
        if (deleteBtn && isEdit) {
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Termin wirklich löschen?')) {
                    const deadlineId = deadlines[index].id;
                    await cloudStorage.deleteDeadline(deadlineId);
                    deadlines.splice(index, 1);
                    await updateDeadlineDisplay();
                    closeModal();
                    console.log('Deadline deleted');
                }
            });
        }
        
        // Focus first input
        titleInput.focus();
    }
    
    async function initializeDeadlines() {
        // Initialize default deadlines if needed
        await initializeDefaultDeadlines();
        
        // Add deadline button
        const addBtn = document.getElementById('addDeadlineBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => openDeadlineEditModal());
        }
        
        // Initial display update
        await updateDeadlineDisplay();
        
        console.log('Deadline management initialized with cloud sync');
    }

    // === RESOURCES SYSTEM ===
    
    let resourcesInitialized = false;
    
    function showResourceFilter(filter) {
        // Hide all resource filters
        document.querySelectorAll('.resource-filter').forEach(filterDiv => {
            filterDiv.style.display = 'none';
        });
        
        // Remove active class from all resource tabs
        document.querySelectorAll('[data-resource-filter]').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected filter
        const targetFilter = document.querySelector(`[data-filter="${filter}"].resource-filter`);
        if (targetFilter) {
            targetFilter.style.display = 'block';
        }
        
        // Add active class to selected tab
        const activeTab = document.querySelector(`[data-resource-filter="${filter}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // For "alle" filter, populate with all links
        if (filter === 'alle') {
            populateAllLinksFilter();
        }
    }
    
    function showNotesFilter(filter) {
        // Hide all notes filters
        document.querySelectorAll('.notes-filter').forEach(filterDiv => {
            filterDiv.style.display = 'none';
        });
        
        // Remove active class from all notes tabs
        document.querySelectorAll('[data-notes-filter]').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected filter
        const targetFilter = document.querySelector(`[data-filter="${filter}"].notes-filter`);
        if (targetFilter) {
            targetFilter.style.display = 'block';
        }
        
        // Add active class to selected tab
        const activeTab = document.querySelector(`[data-notes-filter="${filter}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }
    
    function populateAllLinksFilter() {
        const alleContainer = document.querySelector('[data-filter="alle"].resource-filter .links-grid');
        if (!alleContainer) return;
        
        // Clear existing content
        alleContainer.innerHTML = '';
        
        // Get all link cards from other categories
        const allLinkCards = document.querySelectorAll('.link-card[data-category]');
        
        allLinkCards.forEach(linkCard => {
            const clone = linkCard.cloneNode(true);
            alleContainer.appendChild(clone);
        });
    }
    
    function generateLinkIcon(title) {
        // Generate a simple icon from the first letter or use common patterns
        const firstLetter = title.charAt(0).toUpperCase();
        const colors = ['#667eea', '#f093fb', '#4facfe', '#fa709a', '#a8edea', '#667eea', '#764ba2'];
        const colorIndex = title.length % colors.length;
        
        return {
            letter: firstLetter,
            color: colors[colorIndex]
        };
    }
    
    function addNewLink() {
        const titleInput = document.getElementById('newLinkTitle');
        const urlInput = document.getElementById('newLinkUrl');
        const categorySelect = document.getElementById('newLinkCategory');
        
        if (!titleInput || !urlInput || !categorySelect) return;
        
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();
        const category = categorySelect.value;
        
        if (!title || !url) {
            alert('Bitte Titel und URL eingeben!');
            return;
        }
        
        // Basic URL validation
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            urlInput.value = 'https://' + url;
        }
        
        const icon = generateLinkIcon(title);
        
        // Create new link card
        const linkCard = document.createElement('a');
        linkCard.href = urlInput.value;
        linkCard.target = '_blank';
        linkCard.className = 'link-card';
        linkCard.setAttribute('data-category', category);
        linkCard.style.cssText = `
            display: flex; 
            align-items: center; 
            gap: 1rem; 
            padding: 1rem; 
            background: var(--card-bg); 
            border: 1px solid var(--border-color); 
            text-decoration: none; 
            color: var(--text-primary); 
            transition: all 0.2s; 
            border-radius: 4px;
        `;
        
        linkCard.innerHTML = `
            <div style="width: 40px; height: 40px; background: ${icon.color}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.9rem;">${icon.letter}</div>
            <div style="flex: 1;">
                <div style="font-weight: 500; margin-bottom: 0.2rem;">${title}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Custom Link</div>
            </div>
        `;
        
        // Add to appropriate category container
        const categoryContainer = document.querySelector(`[data-filter="${category}"].resource-filter .links-grid`);
        if (categoryContainer) {
            categoryContainer.appendChild(linkCard);
        }
        
        // Clear form
        titleInput.value = '';
        urlInput.value = '';
        categorySelect.value = 'privat';
        
        console.log(`Added new link: ${title} (${category})`);
    }
    
    function initializeResources() {
        if (resourcesInitialized) return;
        
        // Initialize resource filter tabs
        document.querySelectorAll('[data-resource-filter]').forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.getAttribute('data-resource-filter');
                showResourceFilter(filter);
            });
        });
        
        // Initialize notes filter tabs
        document.querySelectorAll('[data-notes-filter]').forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.getAttribute('data-notes-filter');
                showNotesFilter(filter);
            });
        });
        
        // Add link button
        const addLinkBtn = document.getElementById('addLinkBtn');
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', addNewLink);
        }
        
        // Enter key support for adding links
        const titleInput = document.getElementById('newLinkTitle');
        const urlInput = document.getElementById('newLinkUrl');
        
        [titleInput, urlInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        addNewLink();
                    }
                });
            }
        });
        
        // Add hover effects to link cards
        const addHoverEffects = () => {
            document.querySelectorAll('.link-card').forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-2px)';
                    card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = 'none';
                });
            });
        };
        
        addHoverEffects();
        
        // Show default filters
        showResourceFilter('privat');
        showNotesFilter('privat');
        
        resourcesInitialized = true;
        console.log('Resources system initialized');
    }

    // === MOTIVATIONAL SLIDESHOW SYSTEM ===
    
    let currentSlide = 0;
    let autoPlayInterval = null;
    let isAutoPlaying = true;
    
    function showSlide(slideIndex) {
        const slides = document.querySelectorAll('.motivational-slide');
        const indicators = document.querySelectorAll('.indicator');
        const slideCounter = document.getElementById('slideCounter');
        
        // Hide all slides
        slides.forEach(slide => {
            slide.style.display = 'none';
        });
        
        // Reset all indicators
        indicators.forEach(indicator => {
            indicator.style.background = '#ccc';
            indicator.style.opacity = '0.5';
        });
        
        // Show current slide
        if (slides[slideIndex]) {
            slides[slideIndex].style.display = 'flex';
        }
        
        // Highlight current indicator
        if (indicators[slideIndex]) {
            indicators[slideIndex].style.background = '#333';
            indicators[slideIndex].style.opacity = '1';
        }
        
        // Update counter
        if (slideCounter) {
            slideCounter.textContent = `${slideIndex + 1}/${slides.length}`;
        }
        
        currentSlide = slideIndex;
    }
    
    function nextSlide() {
        const slides = document.querySelectorAll('.motivational-slide');
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    function prevSlide() {
        const slides = document.querySelectorAll('.motivational-slide');
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }
    
    function toggleAutoPlay() {
        const autoPlayBtn = document.getElementById('autoPlayToggle');
        
        if (isAutoPlaying) {
            // Stop auto play
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
            isAutoPlaying = false;
            autoPlayBtn.textContent = 'Play';
            autoPlayBtn.style.background = 'transparent';
            autoPlayBtn.style.color = '#666';
        } else {
            // Start auto play
            autoPlayInterval = setInterval(nextSlide, 4000); // 4 seconds
            isAutoPlaying = true;
            autoPlayBtn.textContent = 'Auto';
            autoPlayBtn.style.background = '#000';
            autoPlayBtn.style.color = 'white';
        }
    }
    
    function initializeMotivationSlideshow() {
        // Show first slide
        showSlide(0);
        
        // Start auto play
        if (isAutoPlaying) {
            autoPlayInterval = setInterval(nextSlide, 4000);
        }
        
        // Add event listeners
        const nextBtn = document.getElementById('nextSlide');
        const prevBtn = document.getElementById('prevSlide');
        const autoPlayBtn = document.getElementById('autoPlayToggle');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                // Reset auto play timer
                if (isAutoPlaying) {
                    clearInterval(autoPlayInterval);
                    autoPlayInterval = setInterval(nextSlide, 4000);
                }
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                // Reset auto play timer
                if (isAutoPlaying) {
                    clearInterval(autoPlayInterval);
                    autoPlayInterval = setInterval(nextSlide, 4000);
                }
            });
        }
        
        if (autoPlayBtn) {
            autoPlayBtn.addEventListener('click', toggleAutoPlay);
        }
        
        // Add click events to indicators
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                showSlide(index);
                // Reset auto play timer
                if (isAutoPlaying) {
                    clearInterval(autoPlayInterval);
                    autoPlayInterval = setInterval(nextSlide, 4000);
                }
            });
        });
        
        console.log('Motivational slideshow initialized');
    }

    // === DAILY QUOTE SYSTEM ===
    
    const dailyQuotes = [
        { text: "Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was du tust.", author: "Steve Jobs" },
        { text: "Das Leben ist das, was passiert, während du andere Pläne machst.", author: "John Lennon" },
        { text: "Sei die Veränderung, die du in der Welt sehen willst.", author: "Mahatma Gandhi" },
        { text: "Der Weg ist das Ziel.", author: "Konfuzius" },
        { text: "Was du heute kannst besorgen, das verschiebe nicht auf morgen.", author: "Benjamin Franklin" },
        { text: "Erfolg ist nicht endgültig, Misserfolg ist nicht tödlich: Es ist der Mut weiterzumachen, der zählt.", author: "Winston Churchill" },
        { text: "Die beste Zeit, einen Baum zu pflanzen, war vor 20 Jahren. Die zweitbeste Zeit ist jetzt.", author: "Chinesisches Sprichwort" },
        { text: "Du musst die Dinge sein, die du in der Welt sehen willst.", author: "Mahatma Gandhi" },
        { text: "Das Geheimnis des Erfolgs ist anzufangen.", author: "Mark Twain" },
        { text: "Glaube an dich selbst und alles ist möglich.", author: "Unknown" },
        { text: "Kleine Fortschritte täglich führen zu großen Ergebnissen jährlich.", author: "Unknown" },
        { text: "Träume nicht dein Leben, lebe deinen Traum.", author: "Unknown" },
        { text: "Der beste Weg, die Zukunft vorherzusagen, ist, sie zu erschaffen.", author: "Peter Drucker" },
        { text: "Erfolg ist die Summe kleiner Anstrengungen, die Tag für Tag wiederholt werden.", author: "Robert Collier" },
        { text: "Was hinter uns liegt und was vor uns liegt, sind winzige Angelegenheiten im Vergleich zu dem, was in uns liegt.", author: "Ralph Waldo Emerson" },
        { text: "Disziplin ist die Brücke zwischen Zielen und Leistung.", author: "Jim Rohn" },
        { text: "Du wirst morgen sein, was du heute denkst.", author: "Buddha" },
        { text: "Jeder Tag ist eine neue Chance, das zu werden, was du sein möchtest.", author: "Unknown" },
        { text: "Fortschritt ist unmöglich ohne Veränderung.", author: "George Bernard Shaw" },
        { text: "Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben.", author: "Eleanor Roosevelt" },
        { text: "Motivation bringt dich in Gang. Gewohnheit hält dich in Bewegung.", author: "Jim Ryun" },
        { text: "Ein Jahr von heute wirst du dir wünschen, du hättest heute angefangen.", author: "Karen Lamb" },
        { text: "Perfektion ist nicht erreichbar, aber wenn wir nach Perfektion streben, können wir Exzellenz erreichen.", author: "Vince Lombardi" },
        { text: "Der Unterschied zwischen Gewöhnlich und Außergewöhnlich ist das kleine Extra.", author: "Jimmy Johnson" },
        { text: "Konzentriere dich auf das, was du kontrollieren kannst.", author: "Unknown" },
        { text: "Jeder Experte war einmal ein Anfänger.", author: "Helen Hayes" },
        { text: "Die größte Revolution unserer Generation ist die Entdeckung, dass Menschen ihr Leben ändern können, indem sie ihre Einstellung ändern.", author: "William James" },
        { text: "Warte nicht auf den perfekten Moment. Nimm den Moment und mach ihn perfekt.", author: "Unknown" },
        { text: "Deine einzige Begrenzung ist deine Vorstellungskraft.", author: "Unknown" },
        { text: "Großartige Dinge entstehen nie in der Komfortzone.", author: "Unknown" },
        { text: "Es ist nie zu spät, das zu werden, was du hättest sein können.", author: "George Eliot" }
    ];
    
    function getTodaysQuote() {
        // Use current date as seed to get same quote for the whole day
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const quoteIndex = dayOfYear % dailyQuotes.length;
        return dailyQuotes[quoteIndex];
    }
    
    function updateDailyQuote() {
        const quote = getTodaysQuote();
        const quoteTextElement = document.getElementById('dailyQuoteText');
        const quoteAuthorElement = document.getElementById('dailyQuoteAuthor');
        
        if (quoteTextElement && quoteAuthorElement) {
            quoteTextElement.textContent = `"${quote.text}"`;
            quoteAuthorElement.textContent = `— ${quote.author}`;
            console.log('Daily quote updated:', quote.text, 'by', quote.author);
        }
    }
    
    function initializeDailyQuote() {
        updateDailyQuote();
        console.log('Daily quote system initialized');
    }

    // === ROUTINE RESET SYSTEM ===
    
    function getRoutineResetTime() {
        const routineResetInput = document.getElementById('routineResetTime');
        if (routineResetInput && routineResetInput.value) {
            return routineResetInput.value;
        }
        return '06:00'; // Default to 6:00 AM
    }
    
    async function saveRoutineResetTime(time) {
        await cloudStorage.saveRoutineResetTime(time);
    }
    
    async function loadRoutineResetTime() {
        const savedTime = await cloudStorage.getRoutineResetTime();
        if (savedTime) {
            const routineResetInput = document.getElementById('routineResetTime');
            if (routineResetInput) {
                routineResetInput.value = savedTime;
            }
            return savedTime;
        }
        return '06:00';
    }
    
    async function getLastRoutineResetDate() {
        return await cloudStorage.getLastRoutineResetDate();
    }
    
    async function saveLastRoutineResetDate(date) {
        await cloudStorage.saveLastRoutineResetDate(date);
    }
    
    async function shouldResetRoutines() {
        const now = new Date();
        const resetTime = await loadRoutineResetTime();
        const [resetHour, resetMinute] = resetTime.split(':').map(Number);
        
        // Create today's reset time
        const todayResetTime = new Date();
        todayResetTime.setHours(resetHour, resetMinute, 0, 0);
        
        const lastResetDate = await getLastRoutineResetDate();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // If we haven't reset today and current time is past reset time
        if (lastResetDate !== today && now >= todayResetTime) {
            return true;
        }
        
        // Handle case where reset time is tomorrow (e.g., user sets reset time after current time)
        if (lastResetDate !== today && now < todayResetTime) {
            // Check if we should have reset yesterday
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastResetDate !== yesterdayStr) {
                return true;
            }
        }
        
        return false;
    }
    
    async function resetRoutineCheckboxes() {
        const morningRoutine = document.getElementById('morning-routine');
        const eveningRoutine = document.getElementById('evening-routine');
        
        console.log('Resetting routine checkboxes for new day...');
        
        // Reset morning routine checkboxes
        if (morningRoutine) {
            const checkboxes = morningRoutine.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    // Update visual styling
                    const label = checkbox.nextElementSibling;
                    if (label) {
                        label.style.textDecoration = 'none';
                        label.style.color = 'inherit';
                    }
                }
            });
        }
        
        // Reset evening routine checkboxes
        if (eveningRoutine) {
            const checkboxes = eveningRoutine.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    // Update visual styling
                    const label = checkbox.nextElementSibling;
                    if (label) {
                        label.style.textDecoration = 'none';
                        label.style.color = 'inherit';
                    }
                }
            });
        }
        
        // Update progress bars
        updateRoutineProgress();
        
        // Update localStorage completion data to reflect unchecked state
        setTimeout(async () => {
            await checkAndSaveRoutineCompletion();
            await updateMonthlyRoutineStreak('morning');
            await updateMonthlyRoutineStreak('evening');
        }, 100);
        
        // Mark as reset for today
        const today = new Date().toISOString().split('T')[0];
        await saveLastRoutineResetDate(today);
        
        console.log('Routines reset successfully for', today);
    }
    
    async function checkAndResetRoutines() {
        if (await shouldResetRoutines()) {
            await resetRoutineCheckboxes();
        }
    }
    
    function cleanupRoutineCompletionData() {
        // Check if current routine completion data matches actual checkbox state
        const today = new Date().toISOString().split('T')[0];
        const completionData = getRoutineCompletionData();
        
        if (completionData[today]) {
            const morningActuallyComplete = isRoutineComplete('morning');
            const eveningActuallyComplete = isRoutineComplete('evening');
            
            // Fix any inconsistencies
            if (completionData[today].morning !== morningActuallyComplete || 
                completionData[today].evening !== eveningActuallyComplete) {
                
                console.log('Found inconsistent routine completion data, fixing...');
                completionData[today].morning = morningActuallyComplete;
                completionData[today].evening = eveningActuallyComplete;
                localStorage.setItem('routineCompletionData', JSON.stringify(completionData));
                
                // Update streak displays
                updateMonthlyRoutineStreak('morning');
                updateMonthlyRoutineStreak('evening');
            }
        }
    }
    
    function scheduleNextRoutineReset() {
        const now = new Date();
        const resetTime = getRoutineResetTime();
        const [resetHour, resetMinute] = resetTime.split(':').map(Number);
        
        // Calculate next reset time
        const nextResetTime = new Date();
        nextResetTime.setHours(resetHour, resetMinute, 0, 0);
        
        // If reset time has passed today, schedule for tomorrow
        if (nextResetTime <= now) {
            nextResetTime.setDate(nextResetTime.getDate() + 1);
        }
        
        const timeUntilReset = nextResetTime.getTime() - now.getTime();
        
        console.log('Next routine reset scheduled for:', nextResetTime.toLocaleString());
        console.log('Time until reset:', Math.round(timeUntilReset / 1000 / 60), 'minutes');
        
        setTimeout(() => {
            resetRoutineCheckboxes();
            // Schedule the next reset
            scheduleNextRoutineReset();
        }, timeUntilReset);
    }
    
    async function initializeRoutineReset() {
        // Load saved reset time
        await loadRoutineResetTime();
        
        // Clean up any inconsistent localStorage data on startup
        cleanupRoutineCompletionData();
        
        // Check if we need to reset routines now
        await checkAndResetRoutines();
        
        // Schedule next reset
        scheduleNextRoutineReset();
        
        // Save reset time when changed
        const routineResetInput = document.getElementById('routineResetTime');
        if (routineResetInput) {
            routineResetInput.addEventListener('change', function() {
                saveRoutineResetTime(this.value);
                console.log('Routine reset time updated to:', this.value);
                // Reschedule next reset with new time
                scheduleNextRoutineReset();
            });
        }
        
        console.log('Routine reset system initialized');
        console.log('Reset time:', getRoutineResetTime());
        console.log('Last reset date:', getLastRoutineResetDate());
    }

    // Initialize todo system
    populateHeuteFilter(); // Populate heute with all todos first
    sortHeuteTodos(); // Sort todos in heute chronologically
    initializeDailyProgress(); // Initialize daily progress tracking
    initializeMonthlyTodoStreak(); // Initialize monthly todo streak
    updateHomeTodos(); // Set up initial 5 todos on home
    showTodoFilter('heute'); // Start with 'heute' filter
    initializeExistingCheckboxes(); // Make existing checkboxes consistent
    initializeRoutineProgress(); // Initialize routine progress tracking
    initializeRoutineStreaks(); // Initialize routine streak counting
    initializeGoals(); // Make goals editable
    addNewGoalButton(); // Add new goal button
    initializeExistingGoalsWithDates(); // Add demo dates to existing goals
    showGoalFilter('monat'); // Start with month filter
    initializeVisionBoard(); // Initialize vision board
    // Initialize journal later when tab is accessed
    // initializeJournal(); // Will be called when journal tab is first accessed
    
    // Initialize day tracking system
    initializeCurrentWeekData(); // Capture current HTML state
    // initializeDayTracking(); // Will be called when journal tab is accessed
    
    // Analytics will be initialized when first accessed (like journal)
    
    // Initialize dark mode
    darkMode.init();
    
    // Add hover effects to monthly overview tiles
    function initializeMonthlyOverviewHover() {
        document.querySelectorAll('.streak-tile').forEach(tile => {
            // Skip deadline tiles as they already have hover effects
            if (!tile.classList.contains('deadline-tile')) {
                tile.addEventListener('mouseenter', () => {
                    tile.style.transform = 'translateY(-2px)';
                    tile.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    tile.style.transition = 'all 0.2s ease';
                });
                tile.addEventListener('mouseleave', () => {
                    tile.style.transform = 'translateY(0)';
                    tile.style.boxShadow = 'none';
                });
            }
        });
        console.log('Monthly overview hover effects initialized');
    }

    // Initialize daily quote system
    initializeDailyQuote();
    
    // Initialize deadline management
    initializeDeadlines();
    
    // Initialize monthly overview hover effects
    initializeMonthlyOverviewHover();
    
    // Initialize routine reset system
    initializeRoutineReset();
    
    // Debug function for manual testing
    window.debugAnalytics = function() {
        console.log('=== DEBUG ANALYTICS ===');
        console.log('Available tabs:', document.querySelectorAll('.tabs [data-period]'));
        console.log('Sport container:', document.getElementById('sport-heatmap-container'));
        console.log('Work container:', document.getElementById('work-heatmap-container'));
        
        console.log('Manually initializing filters...');
        initializeHeatmapFilters();
        // initializeAnalyticsHeatmaps(); // DISABLED - too complex for now
        console.log('=== END DEBUG ===');
    };

    // Force clear routine localStorage data on startup for clean state
    localStorage.removeItem('routineCompletionData');
    localStorage.removeItem('lastRoutineResetDate');
    console.log('Routine localStorage cleared for clean startup');
    
    // Debug function to clear routine localStorage data
    window.clearRoutineData = function() {
        localStorage.removeItem('routineCompletionData');
        localStorage.removeItem('lastRoutineResetDate');
        console.log('Routine localStorage data cleared');
        // Refresh streak displays
        updateMonthlyRoutineStreak('morning');
        updateMonthlyRoutineStreak('evening');
        console.log('Routine streaks reset to 0');
    };

    console.log('Dashboard initialized successfully! 🚀');
    console.log('Todo synchronization system ready:');
    console.log('- ✅ Todos are synchronized between Home and Todos tabs');
    console.log('- ✅ Checking a todo on one tab updates all instances');
    console.log('- ✅ Single archiving action prevents duplicates');
    console.log('- ✅ Shared IDs ensure perfect synchronization');
    console.log('- ✅ 2-second archiving delay with cancellation support');
    console.log(`- 📊 Central state tracks ${todoState.todos.size} todos`);
});