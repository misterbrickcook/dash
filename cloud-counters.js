// Pure Cloud Counter System
// No local fallbacks - 100% cloud-based

class CloudCounters {
    constructor() {
        this.isInitialized = false;
        this.isInitializing = false;
        this.counters = {
            todos: 0,
            morning_routines: 0,
            evening_routines: 0
        };
    }

    async init() {
        // Prevent multiple simultaneous initializations
        if (this.isInitialized) {
            console.log('⏭️ CloudCounters: Already initialized, skipping');
            return true;
        }
        
        if (this.isInitializing) {
            console.log('⏳ CloudCounters: Already initializing, waiting...');
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.isInitialized;
        }

        if (!supabase?.isAuthenticated()) {
            console.error('❌ CloudCounters: Not authenticated, cannot initialize');
            return false;
        }

        this.isInitializing = true;
        console.log('☁️ CloudCounters: Initializing pure cloud counter system...');
        
        try {
            // Single batched query for better performance
            await this.loadAllCounters();
            
            this.updateDisplay();
            this.isInitialized = true;
            this.isInitializing = false;
            
            console.log('✅ CloudCounters: Initialization complete');
            return true;
        } catch (error) {
            console.error('❌ CloudCounters: Initialization failed:', error);
            this.isInitializing = false;
            return false;
        }
    }

    async loadTodoCounter() {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const endOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;
        
        const user = supabase.getCurrentUser();
        const completedTodos = await supabase.query(
            `todos?user_id=eq.${user.id}&completed=eq.true&created_at=gte.${startOfMonth}&created_at=lt.${endOfMonth}&select=*`
        );
        
        this.counters.todos = completedTodos ? completedTodos.length : 0;
        console.log(`☁️ CloudCounters: Loaded ${this.counters.todos} completed todos from cloud`);
    }

    async loadRoutineCounters() {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const user = supabase.getCurrentUser();
        
        // Query simple_routines table for current month
        const routineData = await supabase.query(
            `simple_routines?user_id=eq.${user.id}&select=*`
        );
        
        let morningCount = 0;
        let eveningCount = 0;
        
        if (routineData && routineData.length > 0) {
            routineData.forEach(entry => {
                const entryDate = new Date(entry.date);
                
                // Only count entries from current month
                if (entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear) {
                    try {
                        const data = JSON.parse(entry.routine_data);
                        const dateKey = entry.date;
                        
                        if (data[dateKey]) {
                            // Check if all morning tasks completed
                            const morningTasks = data[dateKey].morning;
                            if (morningTasks && Object.values(morningTasks).every(Boolean)) {
                                morningCount++;
                            }
                            
                            // Check if all evening tasks completed
                            const eveningTasks = data[dateKey].evening;
                            if (eveningTasks && Object.values(eveningTasks).every(Boolean)) {
                                eveningCount++;
                            }
                        }
                    } catch (error) {
                        console.warn('⚠️ CloudCounters: Error parsing routine data:', error);
                    }
                }
            });
        }
        
        this.counters.morning_routines = morningCount;
        this.counters.evening_routines = eveningCount;
        
        console.log(`☁️ CloudCounters: Loaded routine counters - Morning: ${morningCount}, Evening: ${eveningCount}`);
    }

    async loadAllCounters() {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const endOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;
        
        const user = supabase.getCurrentUser();
        
        // Batch all queries for better performance
        const [completedTodos, routineData] = await Promise.all([
            supabase.query(`todos?user_id=eq.${user.id}&completed=eq.true&created_at=gte.${startOfMonth}&created_at=lt.${endOfMonth}&select=*`),
            supabase.query(`simple_routines?user_id=eq.${user.id}&select=*`)
        ]);
        
        // Process todos counter
        this.counters.todos = completedTodos ? completedTodos.length : 0;
        
        // Process routine counters
        let morningCount = 0;
        let eveningCount = 0;
        
        if (routineData && routineData.length > 0) {
            routineData.forEach(entry => {
                const entryDate = new Date(entry.date);
                
                // Only count entries from current month
                if (entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear) {
                    try {
                        const data = JSON.parse(entry.routine_data);
                        const dateKey = entry.date;
                        
                        if (data[dateKey]) {
                            // Check if all morning tasks completed
                            const morningTasks = data[dateKey].morning;
                            if (morningTasks && Object.values(morningTasks).every(Boolean)) {
                                morningCount++;
                            }
                            
                            // Check if all evening tasks completed
                            const eveningTasks = data[dateKey].evening;
                            if (eveningTasks && Object.values(eveningTasks).every(Boolean)) {
                                eveningCount++;
                            }
                        }
                    } catch (error) {
                        console.warn('CloudCounters: Error parsing routine data for', entry.date, error);
                    }
                }
            });
        }
        
        this.counters.morning_routines = morningCount;
        this.counters.evening_routines = eveningCount;
        
        console.log(`☁️ CloudCounters: Batched load complete - Todos: ${this.counters.todos}, Morning: ${morningCount}, Evening: ${eveningCount}`);
    }

    updateDisplay() {
        const streakTiles = document.querySelectorAll('.streak-tile');
        const now = new Date();
        const monthName = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                          'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][now.getMonth()];
        const currentYear = now.getFullYear();

        // Update morning routine counter (first tile)
        if (streakTiles[0]) {
            const numberElement = streakTiles[0].querySelector('.streak-number');
            const dateElement = streakTiles[0].querySelector('.streak-date');
            if (numberElement) numberElement.textContent = this.counters.morning_routines;
            if (dateElement) dateElement.textContent = `${monthName} ${currentYear}`;
            console.log(`☁️ CloudCounters: Set morning counter to ${this.counters.morning_routines}`);
        }

        // Update evening routine counter (second tile)
        if (streakTiles[1]) {
            const numberElement = streakTiles[1].querySelector('.streak-number');
            const dateElement = streakTiles[1].querySelector('.streak-date');
            if (numberElement) numberElement.textContent = this.counters.evening_routines;
            if (dateElement) dateElement.textContent = `${monthName} ${currentYear}`;
            console.log(`☁️ CloudCounters: Set evening counter to ${this.counters.evening_routines}`);
        }

        // Update todo counter (third tile)
        if (streakTiles[2]) {
            const numberElement = streakTiles[2].querySelector('.streak-number');
            const dateElement = streakTiles[2].querySelector('.streak-date');
            if (numberElement) numberElement.textContent = this.counters.todos;
            if (dateElement) dateElement.textContent = `${monthName} ${currentYear}`;
            console.log(`☁️ CloudCounters: Set todo counter to ${this.counters.todos}`);
        }
    }

    async refreshTodoCounter() {
        if (!supabase?.isAuthenticated()) return;
        
        console.log('🔄 CloudCounters: Refreshing todo counter...');
        await this.loadAllCounters(); // Use optimized method that loads everything
        this.updateDisplay();
    }

    async refreshRoutineCounters() {
        if (!supabase?.isAuthenticated()) return;
        
        console.log('🔄 CloudCounters: Refreshing routine counters...');
        await this.loadAllCounters(); // Use optimized method that loads everything
        this.updateDisplay();
    }

    async refreshAll() {
        if (!supabase?.isAuthenticated()) return;
        
        console.log('🔄 CloudCounters: Refreshing all counters...');
        await this.init();
    }

    // Method to call when todos are completed
    async onTodoCompleted() {
        // Small delay to ensure database is updated
        setTimeout(() => {
            this.refreshTodoCounter();
        }, 200);
    }

    // Method to call when routines are completed
    async onRoutineCompleted() {
        // Small delay to ensure database is updated
        console.log('🔄 CloudCounters: onRoutineCompleted triggered, refreshing in 200ms...');
        setTimeout(() => {
            this.refreshRoutineCounters();
        }, 200);
    }
}

// Create global instance
window.CloudCounters = new CloudCounters();

// Auto-initialize when authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Wait for authentication to be established
    setTimeout(async () => {
        if (supabase?.isAuthenticated()) {
            await window.CloudCounters.init();
        }
    }, 1500);
});