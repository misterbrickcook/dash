// Cloud Storage System - Supabase Integration
// Replaces localStorage with cloud sync

class CloudStorage {
    constructor() {
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
    }
    
    // Helper method to safely check if Supabase is authenticated
    isSupabaseAuthenticated() {
        try {
            return supabase && 
                   typeof supabase.isAuthenticated === 'function' && 
                   supabase.isAuthenticated();
        } catch (error) {
            return false;
        }
    }
    
    setupRoutineMethods() {
        // Ensure routine methods are available immediately
        if (typeof this.getLocalRoutineCompletions !== 'function') {
            this.setupRoutineMethods();
        }
    }
    
    setupRoutineMethods() {
        this.getLocalRoutineCompletions = function(date = null) {
            return [];
        };
        
        this.saveLocalRoutineCompletion = function(completion) {
        };
        
        this.saveRoutineCompletion = async function(templateId, date, completed) {
            const completion = {
                id: `${templateId}_${date}`,
                template_id: templateId,
                date: date,
                completed: completed,
                user_id: window.supabase?.getCurrentUser()?.id || 'local'
            };
            
        };
    }

    // === TODOS CLOUD STORAGE ===
    
    async getTodos() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
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
        } catch (error) {
            console.error('Error deleting todo:', error);
            throw error;
        }
    }

    // === DEADLINES CLOUD STORAGE ===
    
    async getDeadlines() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
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
        } catch (error) {
            console.error('Error deleting deadline:', error);
            throw error;
        }
    }

    // === LINKS CLOUD STORAGE ===
    
    async getLinks() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
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
            
        } catch (error) {
            console.error('Error saving link:', error);
            throw error;
        }
    }

    // === ROUTINES CLOUD STORAGE ===
    
    async getRoutineTemplates() {
        try {
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
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
            
            if (!supabase || !this.isOnline || !this.isSupabaseAuthenticated()) {
                console.error('CloudStorage: Cannot save routine completion - not authenticated or offline');
                throw new Error('Pure cloud mode requires authentication and online connection');
            }
            
            // Save to cloud
            const existing = await supabase.query(`routine_completions?template_id=eq.${templateId}&date=eq.${date}`);
            
            if (existing && existing.length > 0) {
                await supabase.update('routine_completions', { completed }, existing[0].id);
            } else {
                await supabase.insert('routine_completions', [completion]);
            }
            
        } catch (error) {
            console.error('Error saving routine completion:', error);
            // Pure cloud mode - don't queue for sync, just throw error
            throw error;
        }
    }
    
    async getRoutineData() {
        // Legacy method - redirect to new system
        return this.getLocalRoutineData();
    }
    
    async saveRoutineData(key, value) {
        try {
            // Save locally only - legacy cloud sync disabled
            this.saveLocalRoutineData(key, value);
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
            
        } catch (error) {
            console.error('Error saving notes:', error);
            throw error;
        }
    }

    // === JOURNAL TAGS CLOUD STORAGE ===
    
    async extractTagsFromText(text) {
        // Extract hashtags from text
        console.log('🔍 Extracting tags from text:', text.substring(0, 100) + '...');
        const tagMatches = text.match(/#[\w-]+/g) || [];
        console.log('🔍 Found hashtag matches:', tagMatches);
        const tags = tagMatches.map(tag => tag.substring(1).toLowerCase()); // Remove # and lowercase
        console.log('🔍 Extracted tags:', tags);
        return tags;
    }
    
    async saveJournalTags(journalEntryId, journalDate, content, category = 'general') {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.log('Journal tags: Not authenticated, skipping tag extraction');
            return;
        }
        
        try {
            const user = supabase.getCurrentUser();
            if (!user) return;
            
            // Extract tags from content
            const tags = await this.extractTagsFromText(content);
            if (tags.length === 0) return;
            
            // Delete existing tags for this entry
            if (journalEntryId) {
                await supabase.delete('journal_tags', `journal_entry_id=eq.${journalEntryId}`);
            }
            
            // Insert new tags
            const tagRecords = tags.map(tag => ({
                user_id: user.id,
                tag: tag,
                journal_entry_id: journalEntryId,
                journal_date: journalDate,
                category: category
            }));
            
            if (tagRecords.length > 0) {
                await supabase.insert('journal_tags', tagRecords);
                console.log(`💾 Saved ${tagRecords.length} journal tags:`, tags);
            }
        } catch (error) {
            console.error('Error saving journal tags:', error);
        }
    }
    
    async processExistingJournalEntries() {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.log('Journal tags: Not authenticated, skipping existing entries');
            return;
        }
        
        try {
            const user = supabase.getCurrentUser();
            if (!user) return;
            
            console.log('🔄 Processing existing journal entries for tags...');
            
            // Get all journal entries
            const entries = await supabase.query('journal_entries?select=id,title,content,entry_date');
            if (!entries || entries.length === 0) {
                console.log('📝 No existing journal entries found');
                return;
            }
            
            console.log(`📝 Found ${entries.length} journal entries to process`);
            
            // Process each entry
            for (const entry of entries) {
                const fullContent = `${entry.title || ''} ${entry.content || ''}`;
                await this.saveJournalTags(
                    entry.id,
                    entry.entry_date || new Date().toISOString().split('T')[0],
                    fullContent,
                    'trading'
                );
            }
            
            console.log(`✅ Processed ${entries.length} existing journal entries for tags`);
        } catch (error) {
            console.error('Error processing existing journal entries:', error);
        }
    }
    
    async getJournalTagAnalytics(dateRange = 30, categoryFilter = 'all') {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            return { tagFrequency: {}, tagTimeline: {}, tagCorrelations: [] };
        }
        
        try {
            const user = supabase.getCurrentUser();
            if (!user) return { tagFrequency: {}, tagTimeline: {}, tagCorrelations: [] };
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - dateRange);
            const dateStr = cutoffDate.toISOString().split('T')[0];
            
            // Build query with optional category filter
            let query = `journal_tags?user_id=eq.${user.id}&journal_date=gte.${dateStr}&select=tag,journal_date,journal_entry_id,category`;
            if (categoryFilter !== 'all') {
                query += `&category=eq.${categoryFilter}`;
            }
            
            // Get all tags within date range and category
            const tags = await supabase.query(query);
            
            if (!tags) return { tagFrequency: {}, tagTimeline: {}, tagCorrelations: [] };
            
            // Calculate frequency
            const tagFrequency = {};
            tags.forEach(entry => {
                tagFrequency[entry.tag] = (tagFrequency[entry.tag] || 0) + 1;
            });
            
            // Calculate timeline (tags per day)
            const tagTimeline = {};
            tags.forEach(entry => {
                const date = entry.journal_date;
                if (!tagTimeline[date]) tagTimeline[date] = {};
                tagTimeline[date][entry.tag] = (tagTimeline[date][entry.tag] || 0) + 1;
            });
            
            // Calculate correlations (tags that appear together)
            const tagCorrelations = [];
            const entriesByDate = {};
            tags.forEach(entry => {
                if (!entriesByDate[entry.journal_entry_id]) {
                    entriesByDate[entry.journal_entry_id] = [];
                }
                entriesByDate[entry.journal_entry_id].push(entry.tag);
            });
            
            // Find tag pairs that occur together
            const correlations = {};
            Object.values(entriesByDate).forEach(entryTags => {
                if (entryTags.length > 1) {
                    for (let i = 0; i < entryTags.length; i++) {
                        for (let j = i + 1; j < entryTags.length; j++) {
                            const pair = [entryTags[i], entryTags[j]].sort().join('|');
                            correlations[pair] = (correlations[pair] || 0) + 1;
                        }
                    }
                }
            });
            
            // Convert to array and sort by frequency
            Object.entries(correlations).forEach(([pair, count]) => {
                const [tag1, tag2] = pair.split('|');
                tagCorrelations.push({ tag1, tag2, count });
            });
            tagCorrelations.sort((a, b) => b.count - a.count);
            
            return { tagFrequency, tagTimeline, tagCorrelations };
        } catch (error) {
            console.error('Error getting journal tag analytics:', error);
            return { tagFrequency: {}, tagTimeline: {}, tagCorrelations: [] };
        }
    }

    // === DIRECT CLOUD MODE - NO LOCAL STORAGE FALLBACKS ===
    
    getLocalTodos() {
        return [];
    }
    
    saveLocalTodo(todo) {
    }
    
    deleteLocalTodo(todoId) {
    }
    
    getLocalDeadlines() {
        return [];
    }
    
    saveLocalDeadline(deadline) {
    }
    
    deleteLocalDeadline(deadlineId) {
    }
    
    getLocalLinks() {
        return [];
    }
    
    saveLocalLink(link) {
    }
    
    getLocalNotes(category) {
        return '';
    }
    
    saveLocalNotes(category, content) {
    }

    // === RESOURCES CLOUD STORAGE ===
    
    async getResources() {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('CloudStorage: Not authenticated');
            return [];
        }
        
        try {
            const user = supabase.getCurrentUser();
            if (!user) {
                throw new Error('No current user found');
            }
            
            const data = await supabase.query(`resources?user_id=eq.${user.id}&select=*`);
            
            if (data && Array.isArray(data)) {
                return data;
            } else {
                return [];
            }
        } catch (error) {
            console.error('CloudStorage: Error fetching resources:', error);
            throw error; // Don't hide errors in pure cloud mode
        }
    }
    
    async saveResource(resource) {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('CloudStorage: Not authenticated - cannot save resource');
            throw new Error('Not authenticated - pure cloud mode requires authentication');
        }
        
        try {
            
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
                await supabase.update('resources', resource, resource.id);
            } else {
                // Remove any ID that's not a proper database BIGSERIAL ID
                if (resource.id) {
                    delete resource.id;
                }
                
                const result = await supabase.insert('resources', [resource]);
                
                if (result && result.length > 0 && result[0]) {
                    const newId = result[0].id;
                    resource.id = newId; // Update the passed resource object
                } else {
                    throw new Error('Failed to insert resource - unexpected response format');
                }
            }
        } catch (error) {
            console.error('CloudStorage: Error saving resource:', error);
            throw error; // Don't hide errors in pure cloud mode
        }
    }
    
    async deleteResource(resourceId) {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('CloudStorage: Not authenticated - cannot delete resource');
            throw new Error('Not authenticated - pure cloud mode requires authentication');
        }
        
        try {
            await supabase.delete('resources', resourceId);
        } catch (error) {
            console.error('CloudStorage: Error deleting resource:', error);
            throw error; // Don't hide errors in pure cloud mode
        }
    }
    
    getLocalResources() {
        // Pure cloud mode - no localStorage fallbacks
        return [];
    }
    
    saveLocalResource(resource) {
        // Pure cloud mode - no localStorage saving
    }
    
    deleteLocalResource(resourceId) {
        // Pure cloud mode - no localStorage operations
    }

    // === TRADING RULES CLOUD STORAGE ===
    
    async ensureTradingRulesTable() {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('CloudStorage: Not authenticated - cannot create table');
            return false;
        }
        
        try {
            console.log('🔧 CloudStorage: Ensuring trading_rules table exists...');
            
            // Try to create the table using direct SQL
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS public.trading_rules (
                    id BIGSERIAL PRIMARY KEY,
                    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    description TEXT,
                    category TEXT NOT NULL DEFAULT 'General',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
                );
                
                ALTER TABLE public.trading_rules ENABLE ROW LEVEL SECURITY;
                
                CREATE POLICY IF NOT EXISTS "Users can view own trading_rules" ON public.trading_rules
                    FOR SELECT USING (auth.uid() = user_id);
                
                CREATE POLICY IF NOT EXISTS "Users can insert own trading_rules" ON public.trading_rules
                    FOR INSERT WITH CHECK (auth.uid() = user_id);
                
                CREATE POLICY IF NOT EXISTS "Users can update own trading_rules" ON public.trading_rules
                    FOR UPDATE USING (auth.uid() = user_id);
                
                CREATE POLICY IF NOT EXISTS "Users can delete own trading_rules" ON public.trading_rules
                    FOR DELETE USING (auth.uid() = user_id);
            `;
            
            // We can't create tables via REST API, just test if table exists
            const user = supabase.getCurrentUser();
            const testResult = await supabase.query(`trading_rules?user_id=eq.${user.id}&select=id&limit=1`);
            console.log('✅ CloudStorage: Table exists and is accessible');
            return true;
        } catch (error) {
            console.error('❌ CloudStorage: Error ensuring table exists:', error);
            return false;
        }
    }
    
    async getTradingRules() {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('CloudStorage: Not authenticated');
            return [];
        }
        
        try {
            const user = supabase.getCurrentUser();
            if (!user) {
                throw new Error('No current user found');
            }
            
            // First try to ensure the table exists
            await this.ensureTradingRulesTable();
            
            const data = await supabase.query(`trading_rules?user_id=eq.${user.id}&select=*`);
            
            if (data && Array.isArray(data)) {
                return data;
            } else {
                return [];
            }
        } catch (error) {
            console.error('CloudStorage: Error fetching trading rules:', error);
            // If table doesn't exist, try to create it first
            if (error.message?.includes('relation "trading_rules" does not exist')) {
                console.log('🔧 CloudStorage: Table does not exist, attempting to create...');
                try {
                    await this.ensureTradingRulesTable();
                    // Try the query again
                    const data = await supabase.query(`trading_rules?user_id=eq.${user.id}&select=*`);
                    return data && Array.isArray(data) ? data : [];
                } catch (retryError) {
                    console.error('❌ CloudStorage: Failed to create table and retry query:', retryError);
                    return [];
                }
            }
            throw error;
        }
    }
    
    async saveTradingRule(rule) {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('CloudStorage: Not authenticated - cannot save trading rule');
            throw new Error('Not authenticated - pure cloud mode requires authentication');
        }
        
        try {
            // Add user_id to rule before saving
            const user = supabase.getCurrentUser();
            if (user) {
                rule.user_id = user.id;
            } else {
                throw new Error('No current user found');
            }
            
            console.log('💾 CloudStorage: Saving trading rule:', rule);
            
            // Check if this is a real database ID (should be a number from BIGSERIAL)
            const isRealDbId = rule.id && 
                              typeof rule.id === 'number' && 
                              Number.isInteger(rule.id) && 
                              rule.id > 0;
            
            if (isRealDbId) {
                console.log('🔄 CloudStorage: Updating existing rule with ID:', rule.id);
                await supabase.update('trading_rules', rule, rule.id);
            } else {
                // Remove any ID that's not a proper database BIGSERIAL ID
                if (rule.id) {
                    console.log('🗑️ CloudStorage: Removing invalid ID:', rule.id);
                    delete rule.id;
                }
                
                console.log('➕ CloudStorage: Inserting new rule:', rule);
                const result = await supabase.insert('trading_rules', [rule]);
                console.log('✅ CloudStorage: Insert result:', result);
                
                if (result && result.length > 0 && result[0]) {
                    const newId = result[0].id;
                    rule.id = newId; // Update the passed rule object
                    console.log('🆔 CloudStorage: New rule ID assigned:', newId);
                } else {
                    console.error('❌ CloudStorage: Unexpected insert response format:', result);
                    throw new Error('Failed to insert trading rule - unexpected response format');
                }
            }
            console.log('✅ CloudStorage: Trading rule saved successfully');
        } catch (error) {
            console.error('CloudStorage: Error saving trading rule:', error);
            throw error;
        }
    }
    
    async deleteTradingRule(ruleId) {
        if (!supabase || !this.isSupabaseAuthenticated()) {
            console.error('CloudStorage: Not authenticated - cannot delete trading rule');
            throw new Error('Not authenticated - pure cloud mode requires authentication');
        }
        
        try {
            await supabase.delete('trading_rules', ruleId);
        } catch (error) {
            console.error('CloudStorage: Error deleting trading rule:', error);
            throw error;
        }
    }
    
    getLocalRoutineData() {
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
        return [];
    }
    
    saveLocalRoutineCompletion(completion) {
        // Pure cloud mode - no local saving, just log the attempt
    }
    
    saveLocalRoutineData(key, value) {
        // Only save to individual keys for minimal backward compatibility
        localStorage.setItem(key, value);
    }

    // === DIRECT CLOUD MODE - NO SYNC QUEUE ===
    
    queueSync(table, action, data) {
    }
    
    async processSyncQueue() {
    }
    
    // === DIRECT CLOUD MODE - NO PERIODIC SYNC ===
    
    startPeriodicSync(intervalMs = 30000) {
    }
    
    // === LEGACY ROUTINE COMPLETION METHODS ===
    // Minimal localStorage support for backward compatibility only
    
    async getRoutineCompletionData() {
        const data = localStorage.getItem('routineCompletionData');
        return data ? JSON.parse(data) : {};
    }
    
    async saveRoutineCompletionData(data) {
        localStorage.setItem('routineCompletionData', JSON.stringify(data));
    }
}

// Global cloud storage instance
window.cloudStorage = new CloudStorage();

// Direct cloud mode - no periodic sync needed
cloudStorage.startPeriodicSync();

// Add global debug functions for resources
window.debugResources = function() {
    console.log('Auth:', cloudStorage.isSupabaseAuthenticated() ? 'OK' : 'NO');
    console.log('Resources:', window.ResourceManager?.resources?.length || 0);
};

window.forceSyncResources = async function() {
    // Direct cloud mode - no sync needed
};

window.testResourceSave = async function() {
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
        
        // Reload ResourceManager to see updated list
        if (window.ResourceManager && window.ResourceManager.loadResources) {
            await window.ResourceManager.loadResources();
        }
    } catch (error) {
        console.error('Test resource save failed:', error);
    }
};

window.checkResourceState = function() {
    console.log('Resources:', window.ResourceManager?.resources?.length || 0);
    
    if (window.ResourceManager && window.ResourceManager.resources.length > 0) {
        console.log('Sample IDs:', 
            window.ResourceManager.resources.slice(0, 3).map(r => r.id));
    }
};

// Debug functions: debugResources(), forceSyncResources(), testResourceSave(), checkResourceState()