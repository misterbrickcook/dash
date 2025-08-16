// SIMPLE COUNTER SYSTEM - No conflicts, just works
// Replaces all the complex counter logic with something reliable

class SimpleCounters {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        if (!window.supabase?.isAuthenticated()) {
            console.error('❌ SimpleCounters: Not authenticated');
            return;
        }

        console.log('🔄 SimpleCounters: Initializing...');
        await this.updateAllCounters();
        this.isInitialized = true;
        console.log('✅ SimpleCounters: Ready');
    }

    async updateAllCounters() {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const monthEnd = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
        
        const user = window.supabase.getCurrentUser();
        
        try {
            // Get all data in one batch
            const [todoData, routineData] = await Promise.all([
                window.supabase.query(`todos?user_id=eq.${user.id}&completed=eq.true&created_at=gte.${monthStart}&created_at=lt.${monthEnd}&select=id`),
                window.supabase.query(`simple_routines?user_id=eq.${user.id}&select=date,routine_data`)
            ]);

            // Count todos
            const todoCount = todoData ? todoData.length : 0;

            // Count routine completions
            let morningCount = 0;
            let eveningCount = 0;

            if (routineData) {
                routineData.forEach(entry => {
                    const entryDate = new Date(entry.date);
                    if (entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear) {
                        try {
                            const data = JSON.parse(entry.routine_data);
                            const dayData = data[entry.date];
                            
                            if (dayData) {
                                // Check morning completion
                                if (dayData.morning && Object.values(dayData.morning).every(Boolean)) {
                                    morningCount++;
                                }
                                // Check evening completion
                                if (dayData.evening && Object.values(dayData.evening).every(Boolean)) {
                                    eveningCount++;
                                }
                            }
                        } catch (e) {
                            // Skip invalid data
                        }
                    }
                });
            }

            // Update display immediately
            this.setCounterDisplay(0, morningCount); // Morning
            this.setCounterDisplay(1, eveningCount); // Evening  
            this.setCounterDisplay(2, todoCount);    // Todos

            console.log(`📊 SimpleCounters: M:${morningCount} E:${eveningCount} T:${todoCount}`);

        } catch (error) {
            console.error('❌ SimpleCounters: Update failed:', error);
        }
    }

    setCounterDisplay(index, value) {
        const tiles = document.querySelectorAll('.streak-tile');
        if (tiles[index]) {
            const numberEl = tiles[index].querySelector('.streak-number');
            if (numberEl) {
                numberEl.textContent = value;
            }
        }
    }

    // Simple trigger methods
    async onRoutineChanged() {
        setTimeout(() => this.updateAllCounters(), 300);
    }

    async onTodoChanged() {
        setTimeout(() => this.updateAllCounters(), 300);
    }
}

// Global instance
window.SimpleCounters = new SimpleCounters();

console.log('✅ SimpleCounters loaded');