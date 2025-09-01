// ========================================
// CLOUD STORAGE INTERFACE
// ========================================
// Central cloud storage interface that wraps Supabase
// Implements all the cloudStorage methods expected by the app

class CloudStorage {
    constructor() {
        this.initialized = false;
        this.user = null;
    }

    /**
     * Initialize cloud storage - must be called after authentication
     */
    async initialize() {
        if (!window.supabase?.isAuthenticated()) {
            console.warn('CloudStorage: Supabase not authenticated');
            return false;
        }
        
        this.user = window.supabase.getCurrentUser();
        this.initialized = true;
        console.log('✅ CloudStorage initialized for user:', this.user?.email);
        return true;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return window.supabase?.isAuthenticated() && this.initialized;
    }

    /**
     * Ensure authentication before operations
     */
    requireAuth(operation) {
        if (!this.isAuthenticated()) {
            // Try to initialize if not already done
            if (!this.initialized && window.supabase?.isAuthenticated()) {
                this.user = window.supabase.getCurrentUser();
                this.initialized = true;
            }
            
            if (!this.isAuthenticated()) {
                throw new Error(`Authentication required for ${operation}`);
            }
        }
        return this.user;
    }

    // ========================================
    // RESOURCES METHODS
    // ========================================

    async getResources() {
        try {
            const user = this.requireAuth('getResources');
            const result = await window.supabase.query(`resources?user_id=eq.${user.id}&select=*`);
            return result || [];
        } catch (error) {
            console.error('CloudStorage.getResources error:', error);
            return [];
        }
    }

    async saveResource(resource) {
        try {
            const user = this.requireAuth('saveResource');
            resource.user_id = user.id;
            resource.updated_at = new Date().toISOString();
            
            if (resource.id) {
                // Update existing
                const result = await window.supabase.update('resources', resource, resource.id);
                return result;
            } else {
                // Insert new
                resource.created_at = new Date().toISOString();
                const result = await window.supabase.insert('resources', [resource]);
                return result && result.length > 0 ? result[0] : null;
            }
        } catch (error) {
            console.error('CloudStorage.saveResource error:', error);
            throw error;
        }
    }

    async deleteResource(resourceId) {
        try {
            this.requireAuth('deleteResource');
            await window.supabase.delete('resources', resourceId);
        } catch (error) {
            console.error('CloudStorage.deleteResource error:', error);
            throw error;
        }
    }

    // ========================================
    // TRADING RULES METHODS
    // ========================================

    async getTradingRules() {
        try {
            const user = this.requireAuth('getTradingRules');
            const result = await window.supabase.query(`trading_rules?user_id=eq.${user.id}&select=*`);
            return result || [];
        } catch (error) {
            console.error('CloudStorage.getTradingRules error:', error);
            return [];
        }
    }

    async saveTradingRule(rule) {
        try {
            const user = this.requireAuth('saveTradingRule');
            rule.user_id = user.id;
            rule.updated_at = new Date().toISOString();
            
            if (rule.id) {
                // Update existing
                const result = await window.supabase.update('trading_rules', rule, rule.id);
                return result;
            } else {
                // Insert new
                rule.created_at = new Date().toISOString();
                const result = await window.supabase.insert('trading_rules', [rule]);
                return result && result.length > 0 ? result[0] : null;
            }
        } catch (error) {
            console.error('CloudStorage.saveTradingRule error:', error);
            throw error;
        }
    }

    async deleteTradingRule(ruleId) {
        try {
            this.requireAuth('deleteTradingRule');
            await window.supabase.delete('trading_rules', ruleId);
        } catch (error) {
            console.error('CloudStorage.deleteTradingRule error:', error);
            throw error;
        }
    }

    // ========================================
    // NOTES METHODS
    // ========================================

    async getNotes(type = 'quicknotes') {
        try {
            const user = this.requireAuth('getNotes');
            const result = await window.supabase.query(`notes?user_id=eq.${user.id}&type=eq.${type}&select=*`);
            
            if (result && result.length > 0) {
                return result[0].content || '';
            }
            return '';
        } catch (error) {
            console.error('CloudStorage.getNotes error:', error);
            return '';
        }
    }

    async saveNotes(type, content) {
        try {
            const user = this.requireAuth('saveNotes');
            const existingNotes = await window.supabase.query(`notes?user_id=eq.${user.id}&type=eq.${type}&select=*`);
            
            const noteData = {
                user_id: user.id,
                type: type,
                content: content,
                updated_at: new Date().toISOString()
            };
            
            if (existingNotes && existingNotes.length > 0) {
                // Update existing
                await window.supabase.update('notes', noteData, existingNotes[0].id);
            } else {
                // Insert new
                noteData.created_at = new Date().toISOString();
                await window.supabase.insert('notes', [noteData]);
            }
        } catch (error) {
            console.error('CloudStorage.saveNotes error:', error);
            throw error;
        }
    }

    // ========================================
    // TODO METHODS
    // ========================================

    async saveTodo(todo) {
        try {
            const user = this.requireAuth('saveTodo');
            todo.user_id = user.id;
            todo.updated_at = new Date().toISOString();
            
            if (todo.id) {
                // Update existing
                const result = await window.supabase.update('todos', todo, todo.id);
                return result;
            } else {
                // Insert new
                todo.created_at = new Date().toISOString();
                const result = await window.supabase.insert('todos', [todo]);
                return result && result.length > 0 ? result[0] : null;
            }
        } catch (error) {
            console.error('CloudStorage.saveTodo error:', error);
            throw error;
        }
    }

    // ========================================
    // ROUTINE METHODS
    // ========================================

    async saveRoutineCompletion(routineType, date, completionStatus) {
        try {
            const user = this.requireAuth('saveRoutineCompletion');
            
            const routineData = {
                user_id: user.id,
                routine_type: routineType,
                date: date,
                completion_status: completionStatus,
                updated_at: new Date().toISOString()
            };
            
            // Check if entry exists for this date and routine type
            const existing = await window.supabase.query(
                `routine_completions?user_id=eq.${user.id}&routine_type=eq.${routineType}&date=eq.${date}&select=*`
            );
            
            if (existing && existing.length > 0) {
                // Update existing
                await window.supabase.update('routine_completions', routineData, existing[0].id);
            } else {
                // Insert new
                routineData.created_at = new Date().toISOString();
                await window.supabase.insert('routine_completions', [routineData]);
            }
        } catch (error) {
            console.error('CloudStorage.saveRoutineCompletion error:', error);
            throw error;
        }
    }

    // ========================================
    // JOURNAL METHODS
    // ========================================

    async saveJournalTags(entryId, date, content, category) {
        try {
            const user = this.requireAuth('saveJournalTags');
            
            // Simple tag extraction - split by common delimiters
            const words = content.toLowerCase()
                .replace(/[^\w\säöü]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 3);
            
            // Create frequency map
            const tagFrequency = {};
            words.forEach(word => {
                tagFrequency[word] = (tagFrequency[word] || 0) + 1;
            });
            
            // Get top tags (frequency >= 2)
            const tags = Object.keys(tagFrequency)
                .filter(tag => tagFrequency[tag] >= 2)
                .slice(0, 10); // Limit to top 10
            
            // Save tags to database
            for (const tag of tags) {
                const tagData = {
                    user_id: user.id,
                    journal_entry_id: entryId,
                    date: date,
                    tag: tag,
                    category: category,
                    created_at: new Date().toISOString()
                };
                
                await window.supabase.insert('journal_tags', [tagData]);
            }
        } catch (error) {
            console.error('CloudStorage.saveJournalTags error:', error);
            // Don't throw - this is not critical
        }
    }

    async getAvailableJournalCategories() {
        try {
            const user = this.requireAuth('getAvailableJournalCategories');
            const result = await window.supabase.query(
                `journal_entries?user_id=eq.${user.id}&select=category`
            );
            
            if (result) {
                const categories = [...new Set(result.map(entry => entry.category))];
                return categories.filter(cat => cat && cat.length > 0);
            }
            return [];
        } catch (error) {
            console.error('CloudStorage.getAvailableJournalCategories error:', error);
            return [];
        }
    }

    async getJournalTagAnalytics(dateRange, category) {
        try {
            const user = this.requireAuth('getJournalTagAnalytics');
            let query = `journal_tags?user_id=eq.${user.id}`;
            
            if (category && category !== 'all') {
                query += `&category=eq.${category}`;
            }
            
            if (dateRange && dateRange.start && dateRange.end) {
                query += `&date=gte.${dateRange.start}&date=lte.${dateRange.end}`;
            }
            
            query += '&select=*';
            
            const result = await window.supabase.query(query);
            
            // Process analytics
            const analytics = {
                totalTags: 0,
                uniqueTags: new Set(),
                tagFrequency: {},
                categoryBreakdown: {},
                timeDistribution: {}
            };
            
            if (result) {
                result.forEach(tag => {
                    if (!tag.tag || !tag.date) return; // Skip invalid entries
                    
                    analytics.totalTags++;
                    analytics.uniqueTags.add(tag.tag);
                    analytics.tagFrequency[tag.tag] = (analytics.tagFrequency[tag.tag] || 0) + 1;
                    analytics.categoryBreakdown[tag.category] = (analytics.categoryBreakdown[tag.category] || 0) + 1;
                    
                    const month = tag.date.substring(0, 7); // YYYY-MM
                    analytics.timeDistribution[month] = (analytics.timeDistribution[month] || 0) + 1;
                });
            }
            
            analytics.uniqueTagCount = analytics.uniqueTags.size;
            analytics.uniqueTags = Array.from(analytics.uniqueTags);
            
            return analytics;
        } catch (error) {
            console.error('CloudStorage.getJournalTagAnalytics error:', error);
            return {
                totalTags: 0,
                uniqueTagCount: 0,
                uniqueTags: [],
                tagFrequency: {},
                categoryBreakdown: {},
                timeDistribution: {}
            };
        }
    }

    async fixCorruptedJournalCategories() {
        try {
            const user = this.requireAuth('fixCorruptedJournalCategories');
            
            // Find entries with null or empty categories
            const corruptedEntries = await window.supabase.query(
                `journal_entries?user_id=eq.${user.id}&or=(category.is.null,category.eq.)&select=*`
            );
            
            if (corruptedEntries && corruptedEntries.length > 0) {
                console.log(`Fixing ${corruptedEntries.length} corrupted journal categories`);
                
                for (const entry of corruptedEntries) {
                    await window.supabase.update('journal_entries', {
                        category: 'general',
                        updated_at: new Date().toISOString()
                    }, entry.id);
                }
            }
        } catch (error) {
            console.error('CloudStorage.fixCorruptedJournalCategories error:', error);
        }
    }

    async processExistingJournalEntries() {
        try {
            const user = this.requireAuth('processExistingJournalEntries');
            
            // Get entries without processed tags
            const entries = await window.supabase.query(
                `journal_entries?user_id=eq.${user.id}&select=*`
            );
            
            if (entries && entries.length > 0) {
                console.log(`Processing tags for ${entries.length} journal entries`);
                
                for (const entry of entries) {
                    // Check if tags already exist for this entry
                    const existingTags = await window.supabase.query(
                        `journal_tags?journal_entry_id=eq.${entry.id}&select=*`
                    );
                    
                    if (!existingTags || existingTags.length === 0) {
                        const fullContent = `${entry.title || ''} ${entry.content || ''}`;
                        await this.saveJournalTags(
                            entry.id,
                            entry.date,
                            fullContent,
                            entry.category || 'general'
                        );
                    }
                }
            }
        } catch (error) {
            console.error('CloudStorage.processExistingJournalEntries error:', error);
        }
    }
}

// Create global instance
const cloudStorage = new CloudStorage();

// Make it available globally
window.cloudStorage = cloudStorage;

// Auto-initialize when Supabase is ready
document.addEventListener('DOMContentLoaded', () => {
    // Try immediate initialization
    if (window.supabase?.isAuthenticated()) {
        cloudStorage.initialize();
    } else {
        // Wait for Supabase to be initialized
        const checkSupabase = setInterval(() => {
            if (window.supabase?.isAuthenticated()) {
                cloudStorage.initialize();
                clearInterval(checkSupabase);
            }
        }, 100); // Check every 100ms for faster response
        
        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkSupabase), 30000);
    }
});

// Also try to initialize immediately if called after DOM load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (window.supabase?.isAuthenticated()) {
        cloudStorage.initialize();
    }
}

console.log('✅ CloudStorage module loaded');