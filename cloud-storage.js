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

    // === TODOS CLOUD STORAGE ===
    
    async getTodos() {
        try {
            if (!supabase || !this.isOnline) {
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
            
            if (!supabase || !this.isOnline) {
                this.queueSync('todos', 'save', todo);
                return;
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
            if (!supabase || !this.isOnline) {
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
            
            if (!supabase || !this.isOnline) {
                this.queueSync('deadlines', 'save', deadline);
                return;
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
            
            if (!supabase || !this.isOnline) {
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
            if (!supabase || !this.isOnline) {
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
            
            if (!supabase || !this.isOnline) {
                this.queueSync('links', 'save', link);
                return;
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
    
    async getRoutineData() {
        try {
            if (!supabase || !this.isOnline) {
                return this.getLocalRoutineData();
            }
            
            const data = await supabase.select('routines', '*');
            if (data && data.length > 0) {
                const routineData = {};
                data.forEach(item => {
                    routineData[item.key] = item.value;
                });
                localStorage.setItem('routines_cache', JSON.stringify(routineData));
                return routineData;
            }
            return this.getLocalRoutineData();
        } catch (error) {
            console.error('Error fetching routine data:', error);
            return this.getLocalRoutineData();
        }
    }
    
    async saveRoutineData(key, value) {
        try {
            this.saveLocalRoutineData(key, value);
            
            if (!supabase || !this.isOnline) {
                this.queueSync('routines', 'save', { key, value });
                return;
            }
            
            // Check if exists first
            const existing = await supabase.query(`routines?key=eq.${key}`);
            
            if (existing && existing.length > 0) {
                await supabase.update('routines', { value, updated_at: new Date().toISOString() }, existing[0].id);
            } else {
                await supabase.insert('routines', [{ key, value }]);
            }
            
            console.log('✅ Routine data synced:', key);
        } catch (error) {
            console.error('Error saving routine data:', error);
            this.queueSync('routines', 'save', { key, value });
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
            if (!supabase || !this.isOnline) {
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
            
            if (!supabase || !this.isOnline) {
                this.queueSync('notes', 'save', { category, content });
                return;
            }
            
            // Check if notes exist for this category
            const existing = await supabase.query(`notes?category=eq.${category}`);
            
            if (existing && existing.length > 0) {
                await supabase.update('notes', { content, updated_at: new Date().toISOString() }, existing[0].id);
            } else {
                await supabase.insert('notes', [{ category, content }]);
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
                        if (item.action === 'save') {
                            const existing = await supabase.query(`routines?key=eq.${item.data.key}`);
                            if (existing && existing.length > 0) {
                                await supabase.update('routines', { value: item.data.value, updated_at: new Date().toISOString() }, existing[0].id);
                            } else {
                                await supabase.insert('routines', [{ key: item.data.key, value: item.data.value }]);
                            }
                        }
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
}

// Global cloud storage instance
window.cloudStorage = new CloudStorage();

// Auto-start periodic sync
cloudStorage.startPeriodicSync();

console.log('☁️ Cloud Storage System loaded');