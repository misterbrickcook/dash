// Cloud Storage System - Supabase Integration
// Replaces localStorage with cloud sync

class CloudStorage {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.lastSyncTime = {};
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        console.log('📡 Cloud Storage initialized');
    }
    
    // Helper method to safely check if Supabase is authenticated
    isSupabaseAuthenticated() {
        try {
            return supabase && 
                   typeof supabase.isAuthenticated === 'function' && 
                   supabase.isAuthenticated();
        } catch (error) {
            console.warn('Error checking Supabase authentication:', error);
            return false;
        }
    }
    
    setupRoutineMethods() {
        // Ensure routine methods are available immediately
        if (typeof this.getLocalRoutineCompletions !== 'function') {
            console.log('⚠️ Adding routine methods to CloudStorage instance');
            this.setupRoutineMethods();
        }
    }
    
    setupRoutineMethods() {
        this.getLocalRoutineCompletions = function(date = null) {
            const cached = localStorage.getItem('routine_completions_cache');
            if (cached) {
                const completions = JSON.parse(cached);
                return date ? completions.filter(c => c.date === date) : completions;
            }
            return [];
        };
        
        this.saveLocalRoutineCompletion = function(completion) {
            const completions = this.getLocalRoutineCompletions();
            console.log(`💾 Saving routine completion:`, completion);
            console.log(`📊 Current completions count: ${completions.length}`);
            
            const existingIndex = completions.findIndex(c => 
                c.template_id === completion.template_id && c.date === completion.date
            );
            
            if (existingIndex >= 0) {
                console.log(`✏️ Updating existing completion at index ${existingIndex}`);
                completions[existingIndex] = completion;
            } else {
                console.log(`➕ Adding new completion to cache`);
                completions.push(completion);
            }
            
            localStorage.setItem('routine_completions_cache', JSON.stringify(completions));
            console.log(`✅ Saved to localStorage, new total: ${completions.length}`);
        };
        
        this.saveRoutineCompletion = async function(templateId, date, completed) {
            const completion = {
                id: `${templateId}_${date}`,
                template_id: templateId,
                date: date,
                completed: completed,
                user_id: window.supabase?.getCurrentUser()?.id || 'local'
            };
            
            this.saveLocalRoutineCompletion(completion);
            console.log('✅ Routine completion saved:', templateId, completed);
        };
    }

    // === TODOS CLOUD STORAGE ===
    
    async getTodos() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                return this.getLocalTodos();
            }
            
            const data = await supabase.select('todos', '*');
            if (data) {
                // Cache locally for offline use
                localStorage.setItem('todos_cache', JSON.stringify(data));
                return data;
            }
            return this.getLocalTodos();
        } catch (error) {
            console.error('Error fetching todos:', error);
            return this.getLocalTodos();
        }
    }
    
    async saveTodo(todo) {
        try {
            // Always save locally first (immediate UI update)
            this.saveLocalTodo(todo);
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                this.queueSync('todos', 'save', todo);
                return;
            }
            
            // Add user_id to todo before saving
            const user = supabase.getCurrentUser();
            if (user) {
                todo.user_id = user.id;
            }
            
            // Save to cloud
            if (todo.id) {
                await supabase.update('todos', todo, todo.id);
            } else {
                const result = await supabase.insert('todos', [todo]);
                if (result && result[0]) {
                    todo.id = result[0].id;
                    this.saveLocalTodo(todo); // Update local with new ID
                }
            }
            
            console.log('✅ Todo synced to cloud:', todo.title);
        } catch (error) {
            console.error('Error saving todo:', error);
            this.queueSync('todos', 'save', todo);
        }
    }
    
    async deleteTodo(todoId) {
        try {
            // Delete locally first
            this.deleteLocalTodo(todoId);
            
            if (!supabase || !this.isOnline) {
                this.queueSync('todos', 'delete', { id: todoId });
                return;
            }
            
            await supabase.delete('todos', todoId);
            console.log('✅ Todo deleted from cloud:', todoId);
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.queueSync('todos', 'delete', { id: todoId });
        }
    }

    // === DEADLINES CLOUD STORAGE ===
    
    async getDeadlines() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                return this.getLocalDeadlines();
            }
            
            const data = await supabase.select('deadlines', '*');
            if (data) {
                localStorage.setItem('deadlines_cache', JSON.stringify(data));
                return data;
            }
            return this.getLocalDeadlines();
        } catch (error) {
            console.error('Error fetching deadlines:', error);
            return this.getLocalDeadlines();
        }
    }
    
    async saveDeadline(deadline) {
        try {
            this.saveLocalDeadline(deadline);
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                this.queueSync('deadlines', 'save', deadline);
                return;
            }
            
            // Add user_id to deadline before saving
            const user = supabase.getCurrentUser();
            if (user) {
                deadline.user_id = user.id;
            }
            
            if (deadline.id) {
                await supabase.update('deadlines', deadline, deadline.id);
            } else {
                const result = await supabase.insert('deadlines', [deadline]);
                if (result && result[0]) {
                    deadline.id = result[0].id;
                    this.saveLocalDeadline(deadline);
                }
            }
            
            console.log('✅ Deadline synced to cloud:', deadline.title);
        } catch (error) {
            console.error('Error saving deadline:', error);
            this.queueSync('deadlines', 'save', deadline);
        }
    }
    
    async deleteDeadline(deadlineId) {
        try {
            this.deleteLocalDeadline(deadlineId);
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                this.queueSync('deadlines', 'delete', { id: deadlineId });
                return;
            }
            
            await supabase.delete('deadlines', deadlineId);
            console.log('✅ Deadline deleted from cloud:', deadlineId);
        } catch (error) {
            console.error('Error deleting deadline:', error);
            this.queueSync('deadlines', 'delete', { id: deadlineId });
        }
    }

    // === LINKS CLOUD STORAGE ===
    
    async getLinks() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                return this.getLocalLinks();
            }
            
            const data = await supabase.select('links', '*');
            if (data) {
                localStorage.setItem('links_cache', JSON.stringify(data));
                return data;
            }
            return this.getLocalLinks();
        } catch (error) {
            console.error('Error fetching links:', error);
            return this.getLocalLinks();
        }
    }
    
    async saveLink(link) {
        try {
            this.saveLocalLink(link);
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                this.queueSync('links', 'save', link);
                return;
            }
            
            // Add user_id to link before saving
            const user = supabase.getCurrentUser();
            if (user) {
                link.user_id = user.id;
            }
            
            if (link.id) {
                await supabase.update('links', link, link.id);
            } else {
                const result = await supabase.insert('links', [link]);
                if (result && result[0]) {
                    link.id = result[0].id;
                    this.saveLocalLink(link);
                }
            }
            
            console.log('✅ Link synced to cloud:', link.title);
        } catch (error) {
            console.error('Error saving link:', error);
            this.queueSync('links', 'save', link);
        }
    }

    // === ROUTINES CLOUD STORAGE ===
    
    async getRoutineTemplates() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                return this.getLocalRoutineTemplates();
            }
            
            // Get user's routine templates (both system and personal)
            const data = await supabase.query('routine_templates?order=order_index.asc');
            if (data) {
                localStorage.setItem('routine_templates_cache', JSON.stringify(data));
                return data;
            }
            return this.getLocalRoutineTemplates();
        } catch (error) {
            console.error('Error fetching routine templates:', error);
            return this.getLocalRoutineTemplates();
        }
    }
    
    async getRoutineCompletions(date = null) {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                return this.getLocalRoutineCompletions(date);
            }
            
            const dateFilter = date ? `&date=eq.${date}` : '';
            const data = await supabase.query(`routine_completions?select=*${dateFilter}`);
            if (data) {
                localStorage.setItem('routine_completions_cache', JSON.stringify(data));
                return data;
            }
            return this.getLocalRoutineCompletions(date);
        } catch (error) {
            console.error('Error fetching routine completions:', error);
            return this.getLocalRoutineCompletions(date);
        }
    }
    
    async saveRoutineCompletion(templateId, date, completed) {
        try {
            const completion = {
                id: `${templateId}_${date}`,
                template_id: templateId,
                date: date,
                completed: completed,
                user_id: supabase.getCurrentUser()?.id
            };
            
            // Save locally first
            this.saveLocalRoutineCompletion(completion);
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                this.queueSync('routine_completions', 'save', completion);
                return;
            }
            
            // Save to cloud
            const existing = await supabase.query(`routine_completions?template_id=eq.${templateId}&date=eq.${date}`);
            
            if (existing && existing.length > 0) {
                await supabase.update('routine_completions', { completed }, existing[0].id);
            } else {
                await supabase.insert('routine_completions', [completion]);
            }
            
            console.log('✅ Routine completion synced:', templateId, completed);
        } catch (error) {
            console.error('Error saving routine completion:', error);
            this.queueSync('routine_completions', 'save', completion);
        }
    }
    
    async getRoutineData() {
        // Legacy method - redirect to new system
        console.log('⚠️ Using legacy getRoutineData - redirecting to localStorage');
        return this.getLocalRoutineData();
    }
    
    async saveRoutineData(key, value) {
        try {
            // Save locally only - legacy cloud sync disabled
            this.saveLocalRoutineData(key, value);
            console.log('✅ Routine data saved locally:', key);
        } catch (error) {
            console.error('Error saving routine data:', error);
        }
    }
    
    async getRoutineCompletionData() {
        const data = await this.getRoutineData();
        const completionData = data.routineCompletionData;
        return completionData ? JSON.parse(completionData) : {};
    }
    
    async saveRoutineCompletionData(completionData) {
        await this.saveRoutineData('routineCompletionData', JSON.stringify(completionData));
    }
    
    async getRoutineResetTime() {
        const data = await this.getRoutineData();
        return data.routineResetTime || '06:00';
    }
    
    async saveRoutineResetTime(time) {
        await this.saveRoutineData('routineResetTime', time);
    }
    
    async getLastRoutineResetDate() {
        const data = await this.getRoutineData();
        return data.lastRoutineResetDate;
    }
    
    async saveLastRoutineResetDate(date) {
        await this.saveRoutineData('lastRoutineResetDate', date);
    }

    // === NOTES CLOUD STORAGE ===
    
    async getNotes(category) {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                return this.getLocalNotes(category);
            }
            
            const data = await supabase.query(`notes?category=eq.${category}`);
            if (data && data[0]) {
                localStorage.setItem(`notes_${category}_cache`, JSON.stringify(data[0]));
                return data[0].content || '';
            }
            return this.getLocalNotes(category);
        } catch (error) {
            console.error('Error fetching notes:', error);
            return this.getLocalNotes(category);
        }
    }
    
    async saveNotes(category, content) {
        try {
            this.saveLocalNotes(category, content);
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                this.queueSync('notes', 'save', { category, content });
                return;
            }
            
            // Add user_id for notes
            const user = supabase.getCurrentUser();
            const userId = user ? user.id : 'anonymous';
            
            // Check if notes exist for this category
            const existing = await supabase.query(`notes?category=eq.${category}&user_id=eq.${userId}`);
            
            if (existing && existing.length > 0) {
                await supabase.update('notes', { content, updated_at: new Date().toISOString() }, existing[0].id);
            } else {
                await supabase.insert('notes', [{ category, content, user_id: userId }]);
            }
            
            console.log('✅ Notes synced to cloud:', category);
        } catch (error) {
            console.error('Error saving notes:', error);
            this.queueSync('notes', 'save', { category, content });
        }
    }

    // === LOCAL STORAGE FALLBACKS ===
    
    getLocalTodos() {
        const cached = localStorage.getItem('todos_cache');
        return cached ? JSON.parse(cached) : [];
    }
    
    saveLocalTodo(todo) {
        const todos = this.getLocalTodos();
        const existingIndex = todos.findIndex(t => t.id === todo.id);
        
        if (existingIndex >= 0) {
            todos[existingIndex] = todo;
        } else {
            todos.push(todo);
        }
        
        localStorage.setItem('todos_cache', JSON.stringify(todos));
    }
    
    deleteLocalTodo(todoId) {
        const todos = this.getLocalTodos().filter(t => t.id !== todoId);
        localStorage.setItem('todos_cache', JSON.stringify(todos));
    }
    
    getLocalDeadlines() {
        const cached = localStorage.getItem('deadlines_cache');
        return cached ? JSON.parse(cached) : [];
    }
    
    saveLocalDeadline(deadline) {
        const deadlines = this.getLocalDeadlines();
        const existingIndex = deadlines.findIndex(d => d.id === deadline.id);
        
        if (existingIndex >= 0) {
            deadlines[existingIndex] = deadline;
        } else {
            deadlines.push(deadline);
        }
        
        localStorage.setItem('deadlines_cache', JSON.stringify(deadlines));
    }
    
    deleteLocalDeadline(deadlineId) {
        const deadlines = this.getLocalDeadlines().filter(d => d.id !== deadlineId);
        localStorage.setItem('deadlines_cache', JSON.stringify(deadlines));
    }
    
    getLocalLinks() {
        const cached = localStorage.getItem('links_cache');
        return cached ? JSON.parse(cached) : [];
    }
    
    saveLocalLink(link) {
        const links = this.getLocalLinks();
        const existingIndex = links.findIndex(l => l.id === link.id);
        
        if (existingIndex >= 0) {
            links[existingIndex] = link;
        } else {
            links.push(link);
        }
        
        localStorage.setItem('links_cache', JSON.stringify(links));
    }
    
    getLocalNotes(category) {
        const cached = localStorage.getItem(`notes_${category}_cache`);
        if (cached) {
            const data = JSON.parse(cached);
            return data.content || '';
        }
        return localStorage.getItem(`notes_${category}`) || '';
    }
    
    saveLocalNotes(category, content) {
        localStorage.setItem(`notes_${category}`, content);
        localStorage.setItem(`notes_${category}_cache`, JSON.stringify({ category, content }));
    }

    // === RESOURCES CLOUD STORAGE ===
    
    async getResources() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                return this.getLocalResources();
            }
            
            const data = await supabase.select('resources', '*');
            if (data) {
                localStorage.setItem('resources_cache', JSON.stringify(data));
                return data;
            }
            return this.getLocalResources();
        } catch (error) {
            console.error('Error fetching resources:', error);
            return this.getLocalResources();
        }
    }
    
    async saveResource(resource) {
        try {
            this.saveLocalResource(resource);
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                this.queueSync('resources', 'save', resource);
                return;
            }
            
            // Add user_id to resource before saving
            const user = supabase.getCurrentUser();
            if (user) {
                resource.user_id = user.id;
            }
            
            if (resource.id) {
                await supabase.update('resources', resource, resource.id);
            } else {
                const result = await supabase.insert('resources', [resource]);
                if (result && result[0]) {
                    resource.id = result[0].id;
                    this.saveLocalResource(resource);
                }
            }
            
            console.log('✅ Resource synced to cloud:', resource.title);
        } catch (error) {
            console.error('Error saving resource:', error);
            this.queueSync('resources', 'save', resource);
        }
    }
    
    async deleteResource(resourceId) {
        try {
            this.deleteLocalResource(resourceId);
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                this.queueSync('resources', 'delete', { id: resourceId });
                return;
            }
            
            await supabase.delete('resources', resourceId);
            console.log('✅ Resource deleted from cloud:', resourceId);
        } catch (error) {
            console.error('Error deleting resource:', error);
            this.queueSync('resources', 'delete', { id: resourceId });
        }
    }
    
    getLocalResources() {
        const cached = localStorage.getItem('resources_cache');
        if (cached) {
            return JSON.parse(cached);
        }
        return JSON.parse(localStorage.getItem('resources') || '[]');
    }
    
    saveLocalResource(resource) {
        const resources = this.getLocalResources();
        const existingIndex = resources.findIndex(r => r.id === resource.id);
        
        if (existingIndex >= 0) {
            resources[existingIndex] = resource;
        } else {
            resources.push(resource);
        }
        
        localStorage.setItem('resources_cache', JSON.stringify(resources));
        localStorage.setItem('resources', JSON.stringify(resources));
    }
    
    deleteLocalResource(resourceId) {
        const resources = this.getLocalResources().filter(r => r.id !== resourceId);
        localStorage.setItem('resources_cache', JSON.stringify(resources));
        localStorage.setItem('resources', JSON.stringify(resources));
    }
    
    getLocalRoutineData() {
        const cached = localStorage.getItem('routines_cache');
        if (cached) {
            return JSON.parse(cached);
        }
        
        // Fallback to individual localStorage keys
        return {
            routineCompletionData: localStorage.getItem('routineCompletionData'),
            routineResetTime: localStorage.getItem('routineResetTime') || '06:00',
            lastRoutineResetDate: localStorage.getItem('lastRoutineResetDate')
        };
    }
    
    getLocalRoutineTemplates() {
        const cached = localStorage.getItem('routine_templates_cache');
        if (cached) {
            return JSON.parse(cached);
        }
        
        // Default templates if none cached  
        return [
            {id: 'morning_1', text: '💧 Wasser und Kreatin', routine_type: 'morning', order_index: 1},
            {id: 'morning_2', text: '💪 BBÜ und Sport', routine_type: 'morning', order_index: 2},
            {id: 'morning_3', text: '📅 Tag planen', routine_type: 'morning', order_index: 3},
            {id: 'morning_4', text: '✅ Todos checken', routine_type: 'morning', order_index: 4},
            {id: 'evening_1', text: '📝 Tag reflektieren per Journal', routine_type: 'evening', order_index: 1},
            {id: 'evening_2', text: '📚 Lesen und Lessons nachhalten', routine_type: 'evening', order_index: 2},
            {id: 'evening_3', text: '📊 Trades evaluieren und Lessons nachhalten', routine_type: 'evening', order_index: 3},
            {id: 'evening_4', text: '📅 Nächsten Tag planen', routine_type: 'evening', order_index: 4}
        ];
    }
    
    getLocalRoutineCompletions(date = null) {
        const cached = localStorage.getItem('routine_completions_cache');
        if (cached) {
            const completions = JSON.parse(cached);
            return date ? completions.filter(c => c.date === date) : completions;
        }
        return [];
    }
    
    saveLocalRoutineCompletion(completion) {
        const completions = this.getLocalRoutineCompletions();
        console.log(`💾 Saving routine completion:`, completion);
        console.log(`📊 Current completions count: ${completions.length}`);
        
        const existingIndex = completions.findIndex(c => 
            c.template_id === completion.template_id && c.date === completion.date
        );
        
        if (existingIndex >= 0) {
            console.log(`✏️ Updating existing completion at index ${existingIndex}`);
            completions[existingIndex] = completion;
        } else {
            console.log(`➕ Adding new completion to cache`);
            completions.push(completion);
        }
        
        localStorage.setItem('routine_completions_cache', JSON.stringify(completions));
        console.log(`✅ Saved to localStorage, new total: ${completions.length}`);
    }
    
    saveLocalRoutineData(key, value) {
        const routineData = this.getLocalRoutineData();
        routineData[key] = value;
        localStorage.setItem('routines_cache', JSON.stringify(routineData));
        
        // Also save to individual keys for backward compatibility
        localStorage.setItem(key, value);
    }

    // === SYNC QUEUE SYSTEM ===
    
    queueSync(table, action, data) {
        this.syncQueue.push({ table, action, data, timestamp: Date.now() });
        console.log('📦 Queued for sync:', table, action);
    }
    
    async processSyncQueue() {
        if (!supabase || !this.isOnline || this.syncQueue.length === 0) {
            return;
        }
        
        console.log('🔄 Processing sync queue:', this.syncQueue.length, 'items');
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const item of queue) {
            try {
                switch (item.action) {
                    case 'save':
                        if (item.data.id) {
                            await supabase.update(item.table, item.data, item.data.id);
                        } else {
                            await supabase.insert(item.table, [item.data]);
                        }
                        break;
                    case 'delete':
                        await supabase.delete(item.table, item.data.id);
                        break;
                    case 'notes':
                        if (item.action === 'save') {
                            const existing = await supabase.query(`notes?category=eq.${item.data.category}`);
                            if (existing && existing.length > 0) {
                                await supabase.update('notes', { content: item.data.content, updated_at: new Date().toISOString() }, existing[0].id);
                            } else {
                                await supabase.insert('notes', [{ category: item.data.category, content: item.data.content }]);
                            }
                        }
                        break;
                    case 'routines':
                        // Legacy routines sync disabled
                        console.log('⚠️ Skipping legacy routines sync');
                        break;
                }
                console.log('✅ Synced:', item.table, item.action);
            } catch (error) {
                console.error('❌ Sync failed:', item, error);
                this.syncQueue.push(item); // Re-queue failed items
            }
        }
    }
    
    // === PERIODIC SYNC ===
    
    startPeriodicSync(intervalMs = 30000) { // 30 seconds
        setInterval(() => {
            if (this.isOnline) {
                this.processSyncQueue();
            }
        }, intervalMs);
        
        console.log('🔄 Periodic sync started');
    }
    
    // === LEGACY ROUTINE COMPLETION METHODS ===
    // These are needed by script.js for backward compatibility
    
    async getRoutineCompletionData() {
        // Return data from localStorage in the expected format
        const data = localStorage.getItem('routineCompletionData');
        return data ? JSON.parse(data) : {};
    }
    
    async saveRoutineCompletionData(data) {
        // Save to localStorage in the expected format
        localStorage.setItem('routineCompletionData', JSON.stringify(data));
        console.log('💾 Saved routine completion data to localStorage');
        
        // Also queue for cloud sync if authenticated
        if (this.isSupabaseAuthenticated()) {
            this.queueSync('routine_completions', 'save', {
                user_id: supabase.getCurrentUser()?.id,
                completion_data: data,
                updated_at: new Date().toISOString()
            });
        }
    }
}

// Global cloud storage instance
window.cloudStorage = new CloudStorage();

// Auto-start periodic sync
cloudStorage.startPeriodicSync();

console.log('☁️ Cloud Storage System loaded');