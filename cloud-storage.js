// Cloud Storage System - Supabase Integration
// Replaces localStorage with cloud sync

class CloudStorage {
    constructor() {
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Back online - direct cloud operations available');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📡 Offline - direct cloud operations unavailable');
        });
        
        console.log('☁️ Cloud Storage initialized - DIRECT CLOUD MODE (no localStorage cache)');
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
            console.log('⚠️ Direct cloud mode: No local cache for routine completions');
            return [];
        };
        
        this.saveLocalRoutineCompletion = function(completion) {
            console.log('⚠️ Direct cloud mode: Skipping local completion save, using cloud only');
        };
        
        this.saveRoutineCompletion = async function(templateId, date, completed) {
            const completion = {
                id: `${templateId}_${date}`,
                template_id: templateId,
                date: date,
                completed: completed,
                user_id: window.supabase?.getCurrentUser()?.id || 'local'
            };
            
            console.log('☁️ Direct cloud save for routine completion:', templateId, completed);
        };
    }

    // === TODOS CLOUD STORAGE ===
    
    async getTodos() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                console.warn('☁️ Direct cloud mode: Cannot fetch todos - not authenticated or offline');
                return [];
            }
            
            const data = await supabase.select('todos', '*');
            if (data) {
                return data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching todos:', error);
            return [];
        }
    }
    
    async saveTodo(todo) {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                throw new Error('Direct cloud mode: Cannot save todo - not authenticated or offline');
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
                }
            }
            
            console.log('✅ Todo synced to cloud:', todo.title);
        } catch (error) {
            console.error('Error saving todo:', error);
            throw error;
        }
    }
    
    async deleteTodo(todoId) {
        try {
            if (!supabase || !this.isOnline) {
                throw new Error('Direct cloud mode: Cannot delete todo - not authenticated or offline');
            }
            
            await supabase.delete('todos', todoId);
            console.log('✅ Todo deleted from cloud:', todoId);
        } catch (error) {
            console.error('Error deleting todo:', error);
            throw error;
        }
    }

    // === DEADLINES CLOUD STORAGE ===
    
    async getDeadlines() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                console.warn('☁️ Direct cloud mode: Cannot fetch deadlines - not authenticated or offline');
                return [];
            }
            
            const data = await supabase.select('deadlines', '*');
            if (data) {
                return data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching deadlines:', error);
            return [];
        }
    }
    
    async saveDeadline(deadline) {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                throw new Error('Direct cloud mode: Cannot save deadline - not authenticated or offline');
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
                }
            }
            
            console.log('✅ Deadline synced to cloud:', deadline.title);
        } catch (error) {
            console.error('Error saving deadline:', error);
            throw error;
        }
    }
    
    async deleteDeadline(deadlineId) {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                throw new Error('Direct cloud mode: Cannot delete deadline - not authenticated or offline');
            }
            
            await supabase.delete('deadlines', deadlineId);
            console.log('✅ Deadline deleted from cloud:', deadlineId);
        } catch (error) {
            console.error('Error deleting deadline:', error);
            throw error;
        }
    }

    // === LINKS CLOUD STORAGE ===
    
    async getLinks() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                console.warn('☁️ Direct cloud mode: Cannot fetch links - not authenticated or offline');
                return [];
            }
            
            const data = await supabase.select('links', '*');
            if (data) {
                return data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching links:', error);
            return [];
        }
    }
    
    async saveLink(link) {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                throw new Error('Direct cloud mode: Cannot save link - not authenticated or offline');
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
                }
            }
            
            console.log('✅ Link synced to cloud:', link.title);
        } catch (error) {
            console.error('Error saving link:', error);
            throw error;
        }
    }

    // === ROUTINES CLOUD STORAGE ===
    
    async getRoutineTemplates() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                console.warn('☁️ Direct cloud mode: Cannot fetch routine templates - not authenticated or offline');
                return this.getDefaultRoutineTemplates();
            }
            
            // Get user's routine templates (both system and personal)
            const data = await supabase.query('routine_templates?order=order_index.asc');
            if (data) {
                return data;
            }
            return this.getDefaultRoutineTemplates();
        } catch (error) {
            console.error('Error fetching routine templates:', error);
            return this.getDefaultRoutineTemplates();
        }
    }
    
    async getRoutineCompletions(date = null) {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                console.warn('☁️ Direct cloud mode: Cannot fetch routine completions - not authenticated or offline');
                return [];
            }
            
            const dateFilter = date ? `&date=eq.${date}` : '';
            const data = await supabase.query(`routine_completions?select=*${dateFilter}`);
            if (data) {
                return data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching routine completions:', error);
            return [];
        }
    }
    
    // Direct cloud mode - no legacy format conversion needed
    updateLegacyRoutineFormat(cloudData) {
        console.log('☁️ Direct cloud mode: Skipping legacy format conversion');
    }
    
    async saveRoutineCompletion(templateId, date, completed) {
        try {
            const completion = {
                // Remove id - let database auto-generate BIGSERIAL id
                template_id: templateId,
                date: date,
                completed: completed,
                user_id: supabase.getCurrentUser()?.id
            };
            
            // Pure cloud mode - no local saving needed
            console.log('☁️ CloudStorage: Pure cloud save mode for routine completion');
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                console.error('❌ CloudStorage: Cannot save routine completion - not authenticated or offline');
                throw new Error('Pure cloud mode requires authentication and online connection');
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
            // Pure cloud mode - don't queue for sync, just throw error
            throw error;
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
                console.warn('☁️ Direct cloud mode: Cannot fetch notes - not authenticated or offline');
                return '';
            }
            
            const data = await supabase.query(`notes?category=eq.${category}`);
            if (data && data[0]) {
                return data[0].content || '';
            }
            return '';
        } catch (error) {
            console.error('Error fetching notes:', error);
            return '';
        }
    }
    
    async saveNotes(category, content) {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                throw new Error('Direct cloud mode: Cannot save notes - not authenticated or offline');
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
            throw error;
        }
    }

    // === DIRECT CLOUD MODE - NO LOCAL STORAGE FALLBACKS ===
    
    getLocalTodos() {
        console.warn('☁️ Direct cloud mode: getLocalTodos() should not be used');
        return [];
    }
    
    saveLocalTodo(todo) {
        console.warn('☁️ Direct cloud mode: saveLocalTodo() should not be used');
    }
    
    deleteLocalTodo(todoId) {
        console.warn('☁️ Direct cloud mode: deleteLocalTodo() should not be used');
    }
    
    getLocalDeadlines() {
        console.warn('☁️ Direct cloud mode: getLocalDeadlines() should not be used');
        return [];
    }
    
    saveLocalDeadline(deadline) {
        console.warn('☁️ Direct cloud mode: saveLocalDeadline() should not be used');
    }
    
    deleteLocalDeadline(deadlineId) {
        console.warn('☁️ Direct cloud mode: deleteLocalDeadline() should not be used');
    }
    
    getLocalLinks() {
        console.warn('☁️ Direct cloud mode: getLocalLinks() should not be used');
        return [];
    }
    
    saveLocalLink(link) {
        console.warn('☁️ Direct cloud mode: saveLocalLink() should not be used');
    }
    
    getLocalNotes(category) {
        console.warn('☁️ Direct cloud mode: getLocalNotes() should not be used');
        return '';
    }
    
    saveLocalNotes(category, content) {
        console.warn('☁️ Direct cloud mode: saveLocalNotes() should not be used');
    }

    // === RESOURCES CLOUD STORAGE ===
    
    async getResources() {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('❌ CloudStorage: Not authenticated - pure cloud mode requires authentication');
            return [];
        }
        
        try {
            console.log('☁️ CloudStorage: Fetching resources from cloud...');
            const user = supabase.getCurrentUser();
            if (!user) {
                throw new Error('No current user found');
            }
            
            const data = await supabase.query(`resources?user_id=eq.${user.id}&select=*`);
            
            if (data && Array.isArray(data)) {
                console.log(`☁️ CloudStorage: Loaded ${data.length} resources from cloud`);
                return data;
            } else {
                console.log('☁️ CloudStorage: No resources found in cloud');
                return [];
            }
        } catch (error) {
            console.error('❌ CloudStorage: Error fetching resources:', error);
            throw error; // Don't hide errors in pure cloud mode
        }
    }
    
    async saveResource(resource) {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('❌ CloudStorage: Not authenticated - cannot save resource in pure cloud mode');
            throw new Error('Not authenticated - pure cloud mode requires authentication');
        }
        
        try {
            console.log('☁️ CloudStorage: Saving resource to cloud:', resource.title);
            
            // Add user_id to resource before saving
            const user = supabase.getCurrentUser();
            if (user) {
                resource.user_id = user.id;
            } else {
                throw new Error('No current user found');
            }
            
            // Check if this is a real database ID (should be a number from BIGSERIAL)
            const isRealDbId = resource.id && 
                              typeof resource.id === 'number' && 
                              Number.isInteger(resource.id) && 
                              resource.id > 0;
            
            if (isRealDbId) {
                console.log('☁️ CloudStorage: Updating existing resource in cloud with ID:', resource.id);
                await supabase.update('resources', resource, resource.id);
                console.log('☁️ CloudStorage: Resource updated in cloud');
            } else {
                console.log('☁️ CloudStorage: Inserting new resource to cloud...');
                
                // Remove any ID that's not a proper database BIGSERIAL ID
                if (resource.id) {
                    console.log('☁️ CloudStorage: Removing non-database ID:', resource.id);
                    delete resource.id;
                }
                
                const result = await supabase.insert('resources', [resource]);
                
                if (result && result.length > 0 && result[0]) {
                    const newId = result[0].id;
                    console.log('☁️ CloudStorage: New resource inserted with database ID:', newId);
                    resource.id = newId; // Update the passed resource object
                } else {
                    throw new Error('Failed to insert resource - unexpected response format');
                }
            }
            
            console.log('☁️ CloudStorage: Resource synced to cloud:', resource.title);
        } catch (error) {
            console.error('❌ CloudStorage: Error saving resource to cloud:', error);
            throw error; // Don't hide errors in pure cloud mode
        }
    }
    
    async deleteResource(resourceId) {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('❌ CloudStorage: Not authenticated - cannot delete resource in pure cloud mode');
            throw new Error('Not authenticated - pure cloud mode requires authentication');
        }
        
        try {
            console.log('☁️ CloudStorage: Deleting resource from cloud:', resourceId);
            await supabase.delete('resources', resourceId);
            console.log('☁️ CloudStorage: Resource deleted from cloud:', resourceId);
        } catch (error) {
            console.error('❌ CloudStorage: Error deleting resource:', error);
            throw error; // Don't hide errors in pure cloud mode
        }
    }
    
    getLocalResources() {
        // Pure cloud mode - no localStorage fallbacks
        console.warn('⚠️ CloudStorage: getLocalResources() called in pure cloud mode - should not be used');
        return [];
    }
    
    saveLocalResource(resource) {
        // Pure cloud mode - no localStorage saving
        console.warn('⚠️ CloudStorage: saveLocalResource() called in pure cloud mode - should not be used');
    }
    
    deleteLocalResource(resourceId) {
        // Pure cloud mode - no localStorage operations
        console.warn('⚠️ CloudStorage: deleteLocalResource() called in pure cloud mode - should not be used');
    }
    
    getLocalRoutineData() {
        console.warn('☁️ Direct cloud mode: Using minimal localStorage for backward compatibility only');
        return {
            routineCompletionData: localStorage.getItem('routineCompletionData'),
            routineResetTime: localStorage.getItem('routineResetTime') || '06:00',
            lastRoutineResetDate: localStorage.getItem('lastRoutineResetDate')
        };
    }
    
    getDefaultRoutineTemplates() {
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
        // Pure cloud mode - no localStorage cache, return empty array
        console.log('☁️ Pure cloud mode: No local routine completions cache');
        return [];
    }
    
    saveLocalRoutineCompletion(completion) {
        // Pure cloud mode - no local saving, just log the attempt
        console.log(`☁️ Pure cloud mode: Skipping local save for routine completion:`, completion);
        console.log(`☁️ Data will be saved directly to cloud database only`);
    }
    
    saveLocalRoutineData(key, value) {
        console.warn('☁️ Direct cloud mode: saveLocalRoutineData() for backward compatibility only');
        // Only save to individual keys for minimal backward compatibility
        localStorage.setItem(key, value);
    }

    // === DIRECT CLOUD MODE - NO SYNC QUEUE ===
    
    queueSync(table, action, data) {
        console.warn('☁️ Direct cloud mode: Sync queue disabled - operations must succeed immediately');
    }
    
    async processSyncQueue() {
        console.warn('☁️ Direct cloud mode: processSyncQueue() disabled - no sync queue in direct mode');
    }
    
    // === DIRECT CLOUD MODE - NO PERIODIC SYNC ===
    
    startPeriodicSync(intervalMs = 30000) {
        console.log('☁️ Direct cloud mode: Periodic sync disabled - operations are immediate');
    }
    
    // === LEGACY ROUTINE COMPLETION METHODS ===
    // Minimal localStorage support for backward compatibility only
    
    async getRoutineCompletionData() {
        console.warn('☁️ Direct cloud mode: Using legacy localStorage for backward compatibility');
        const data = localStorage.getItem('routineCompletionData');
        return data ? JSON.parse(data) : {};
    }
    
    async saveRoutineCompletionData(data) {
        console.warn('☁️ Direct cloud mode: Using legacy localStorage for backward compatibility');
        localStorage.setItem('routineCompletionData', JSON.stringify(data));
        console.log('💾 Saved routine completion data to localStorage (compatibility mode)');
    }
}

// Global cloud storage instance
window.cloudStorage = new CloudStorage();

// Direct cloud mode - no periodic sync needed
cloudStorage.startPeriodicSync();

// Add global debug functions for resources
window.debugResources = function() {
    console.log('🔍 === RESOURCE DEBUG (DIRECT CLOUD MODE) ===');
    console.log('☁️ Direct cloud mode: No sync queue (immediate operations)');
    console.log('🔍 Auth status:', cloudStorage.isSupabaseAuthenticated());
    console.log('🌐 Online status:', cloudStorage.isOnline);
    console.log('🔌 Supabase available:', !!window.supabase);
    if (window.supabase) {
        try {
            const user = window.supabase.getCurrentUser();
            console.log('👤 Current user:', !!user, user ? `(ID: ${user.id})` : '(null)');
        } catch (e) {
            console.log('👤 User check error:', e.message);
        }
    }
    
    console.log('☁️ Direct cloud mode - no local resource storage');
    
    if (window.ResourceManager) {
        console.log('🏠 ResourceManager resources:', window.ResourceManager.resources.length);
    }
};

window.forceSyncResources = async function() {
    console.log('☁️ Direct cloud mode: No sync queue to process - operations are immediate');
};

window.testResourceSave = async function() {
    console.log('🧪 Testing resource save (without manual ID)...');
    const testResource = {
        // No manual ID - let database auto-generate
        title: 'Test Resource ' + Date.now(),
        category: 'Privat',
        url: 'https://example.com',
        description: 'Debug test resource - no manual ID',
        icon: '🧪',
        created_at: new Date().toISOString()
    };
    
    try {
        await cloudStorage.saveResource(testResource);
        console.log('✅ Test resource save completed');
        console.log('🔍 Final resource object:', testResource);
        
        // Reload ResourceManager to see updated list
        if (window.ResourceManager && window.ResourceManager.loadResources) {
            console.log('🔄 Reloading ResourceManager...');
            await window.ResourceManager.loadResources();
        }
    } catch (error) {
        console.error('❌ Test resource save failed:', error);
    }
};

window.checkResourceState = function() {
    console.log('🔍 === RESOURCE STATE CHECK (DIRECT CLOUD MODE) ===');
    console.log('☁️ Direct cloud mode: No sync queue (immediate operations)');
    console.log('📱 ResourceManager resources:', window.ResourceManager?.resources?.length || 0);
    console.log('☁️ Direct cloud mode - no localStorage cache for resources');
    
    if (window.ResourceManager && window.ResourceManager.resources.length > 0) {
        console.log('📋 Sample ResourceManager resource IDs:', 
            window.ResourceManager.resources.slice(0, 3).map(r => `${r.id} (${typeof r.id})`));
    }
    
    console.log('☁️ Direct cloud mode - no cached resources');
    console.log('================================');
};

console.log('☁️ Cloud Storage System loaded - DIRECT CLOUD MODE (no localStorage cache)');
console.log('🔍 Debug functions available: debugResources(), forceSyncResources(), testResourceSave(), checkResourceState()');