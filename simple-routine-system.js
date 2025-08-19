// Simple Routine System - Reliable Cloud Sync
// This replaces the complex routine system with a simple, working one

class SimpleRoutineManager {
    constructor() {
        this.routineData = {};
        this.today = new Date().toISOString().split('T')[0];
        // DOM Cache for performance optimization
        this.domCache = {
            allCheckboxes: null,
            morningCheckboxes: null,
            eveningCheckboxes: null,
            morningProgressFill: null,
            eveningProgressFill: null,
            streakTiles: null
        };
        this.init();
    }

    async init() {
        
        // Cache DOM elements for performance
        this.cacheDOMElements();
        
        // First clear any existing visual styles
        this.clearVisualStyles();
        
        await this.loadTodaysData();
        this.setupEventListeners();
        this.updateUI();
    }

    cacheDOMElements() {
        // Cache all frequently used DOM elements
        this.domCache.allCheckboxes = document.querySelectorAll('#morning-routine input[type="checkbox"], #evening-routine input[type="checkbox"]');
        this.domCache.morningCheckboxes = document.querySelectorAll('#morning-routine input[type="checkbox"]');
        this.domCache.eveningCheckboxes = document.querySelectorAll('#evening-routine input[type="checkbox"]');
        this.domCache.morningProgressFill = document.querySelector('#morning-routine .progress-fill');
        this.domCache.eveningProgressFill = document.querySelector('#evening-routine .progress-fill');
        this.domCache.streakTiles = document.querySelectorAll('.streak-tile');
    }

    clearVisualStyles() {
        // Reset all checkboxes and labels to clean state using cached elements
        this.domCache.allCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            const label = checkbox.nextElementSibling;
            if (label) {
                label.style.textDecoration = 'none';
                label.style.color = 'inherit';
            }
        });
    }

    async loadTodaysData() {
        try {
            // Pure cloud mode - authentication required
            if (!window.supabase || !window.supabase.isAuthenticated()) {
                console.warn('⚠️ SimpleRoutineManager: Not authenticated yet - will reload after login');
                this.routineData = this.getEmptyData();
                return;
            }

            // Load from cloud only
            const cloudData = await this.loadFromCloud();
            if (cloudData) {
                this.routineData = cloudData;
                return;
            }

            // Try migration from old system only if no cloud data exists
            const migratedData = await this.migrateFromOldSystem();
            if (migratedData) {
                this.routineData = migratedData;
                return;
            }

            // No data found - start fresh
            this.routineData = this.getEmptyData();
        } catch (error) {
            console.error('❌ Error loading routine data:', error);
            this.routineData = this.getEmptyData();
        }
    }

    async migrateFromOldSystem() {
        try {
            console.log('🔄 Attempting to migrate from old system...');
            
            // Check old localStorage data first
            const oldLocalData = localStorage.getItem('routineCompletionData');
            if (!oldLocalData) {
                console.log('⚠️ No old system data found');
                return null;
            }
            
            const parsed = JSON.parse(oldLocalData);
            const todayOldData = parsed[this.today];
            
            if (!todayOldData) {
                console.log('⚠️ No old system data for today');
                return null;
            }
            
            console.log('🔄 Found old system data for today:', todayOldData);
            
            const newData = this.getEmptyData();
            const todayData = newData[this.today];
            
            let foundData = false;
            
            // Convert old format: if morning/evening was true, set all tasks to true
            if (todayOldData.morning === true) {
                Object.keys(todayData.morning).forEach(key => {
                    todayData.morning[key] = true;
                    console.log(`🔄 Migrated morning: ${key} = true`);
                });
                foundData = true;
            }
            
            if (todayOldData.evening === true) {
                Object.keys(todayData.evening).forEach(key => {
                    todayData.evening[key] = true;
                    console.log(`🔄 Migrated evening: ${key} = true`);
                });
                foundData = true;
            }
            
            // Also check for partial completion from individual task arrays
            if (todayOldData.morning && Array.isArray(todayOldData.morning)) {
                todayOldData.morning.forEach((completed, index) => {
                    const keys = Object.keys(todayData.morning);
                    if (keys[index] && completed) {
                        todayData.morning[keys[index]] = true;
                        console.log(`🔄 Migrated morning task ${index}: ${keys[index]} = true`);
                        foundData = true;
                    }
                });
            }
            
            if (todayOldData.evening && Array.isArray(todayOldData.evening)) {
                todayOldData.evening.forEach((completed, index) => {
                    const keys = Object.keys(todayData.evening);
                    if (keys[index] && completed) {
                        todayData.evening[keys[index]] = true;
                        console.log(`🔄 Migrated evening task ${index}: ${keys[index]} = true`);
                        foundData = true;
                    }
                });
            }
            
            if (foundData) {
                // Save migrated data to cloud only and clean up old localStorage
                this.routineData = newData;
                await this.saveToCloud();
                
                // Clean up old localStorage data after successful migration
                localStorage.removeItem('routineCompletionData');
                console.log('🧹 Cleaned up old localStorage data after migration');
                
                console.log('✅ Successfully migrated old system data');
                return newData;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error migrating from old system:', error);
            return null;
        }
    }

    async loadFromCloud() {
        try {
            const user = window.supabase.getCurrentUser();
            // Fix the query syntax - the select parameter was wrong
            const result = await window.supabase.query(`simple_routines?user_id=eq.${user.id}&date=eq.${this.today}&select=*`);
            
            if (result && result.length > 0) {
                return JSON.parse(result[0].routine_data);
            }
            return null;
        } catch (error) {
            console.error('❌ Error loading from cloud:', error);
            return null;
        }
    }

    async saveToCloud() {
        try {
            if (!window.supabase || !window.supabase.isAuthenticated()) {
                return false;
            }

            const user = window.supabase.getCurrentUser();
            // Fix the query syntax - use the query method instead of select
            const existing = await window.supabase.query(`simple_routines?user_id=eq.${user.id}&date=eq.${this.today}&select=*`);

            const dataToSave = {
                user_id: user.id,
                date: this.today,
                routine_data: JSON.stringify(this.routineData),
                updated_at: new Date().toISOString()
            };

            if (existing && existing.length > 0) {
                await window.supabase.update('simple_routines', dataToSave, existing[0].id);
            } else {
                await window.supabase.insert('simple_routines', [dataToSave]);
            }

            console.log('☁️ Saved routine data to cloud');
            return true;
        } catch (error) {
            console.error('❌ Error saving to cloud:', error);
            return false;
        }
    }

    getEmptyData() {
        return {
            [this.today]: {
                morning: {
                    'wasser-kreatin': false,
                    'bbue-sport': false,
                    'tag-planen': false,
                    'todos-checken': false
                },
                evening: {
                    'journal-reflexion': false,
                    'lesen-lessons': false,
                    'trades-evaluieren': false,
                    'naechsten-tag-planen': false
                }
            }
        };
    }

    setupEventListeners() {
        // Morning routine checkboxes using cached elements
        this.domCache.morningCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleCheckboxChange(checkbox, 'morning'));
        });

        // Evening routine checkboxes using cached elements
        this.domCache.eveningCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleCheckboxChange(checkbox, 'evening'));
        });

    }

    async handleCheckboxChange(checkbox, routineType) {
        const checkboxId = checkbox.id;
        const isChecked = checkbox.checked;


        // Ensure today exists in data
        if (!this.routineData[this.today]) {
            this.routineData[this.today] = this.getEmptyData()[this.today];
        }

        // Update data
        this.routineData[this.today][routineType][checkboxId] = isChecked;

        // Update visual styling
        const label = checkbox.nextElementSibling;
        if (label) {
            if (isChecked) {
                label.style.textDecoration = 'line-through';
                label.style.color = '#999';
            } else {
                label.style.textDecoration = 'none';
                label.style.color = 'inherit';
            }
        }

        // Save to cloud (pure cloud mode - no localStorage)
        await this.saveToCloud();

        // Update UI
        this.updateUI();

        // Always update counters (for correct count), but animate only on completion
        if (window.SimpleCounters) {
            if (isChecked) {
                // Completion: Update + Animate
                if (routineType === 'morning') {
                    window.SimpleCounters.onMorningRoutineChanged();
                } else if (routineType === 'evening') {
                    window.SimpleCounters.onEveningRoutineChanged();
                } else {
                    window.SimpleCounters.onRoutineChanged();
                }
            } else {
                // Uncheck: Update only, no animation
                window.SimpleCounters.updateAllCounters();
            }
        }

    }

    updateUI() {
        // Update progress bars
        this.updateProgressBars();
        // Update counters (only as fallback)
        this.updateCounters();
    }
    
    updateProgressBarsOnly() {
        // Only update progress bars, not counters
        this.updateProgressBars();
    }

    updateProgressBars() {
        const todayData = this.routineData[this.today];
        if (!todayData) return;

        // Morning progress
        const morningChecked = Object.values(todayData.morning).filter(Boolean).length;
        const morningTotal = Object.keys(todayData.morning).length;
        const morningProgress = (morningChecked / morningTotal) * 100;

        // Use cached progress fill element
        if (this.domCache.morningProgressFill) {
            this.domCache.morningProgressFill.style.width = `${morningProgress}%`;
        }

        // Evening progress
        const eveningChecked = Object.values(todayData.evening).filter(Boolean).length;
        const eveningTotal = Object.keys(todayData.evening).length;
        const eveningProgress = (eveningChecked / eveningTotal) * 100;

        // Use cached progress fill element
        if (this.domCache.eveningProgressFill) {
            this.domCache.eveningProgressFill.style.width = `${eveningProgress}%`;
        }
    }

    updateCounters() {
        // DISABLED: Let the main counter system handle this to avoid conflicts
        // The main system has access to cloud data and historical records
        
        // Only update if the main counter system hasn't set values yet
        if (this.domCache.streakTiles.length >= 2) {
            const morningTile = this.domCache.streakTiles[0];
            const eveningTile = this.domCache.streakTiles[1];

            const morningNumber = morningTile?.querySelector('.streak-number');
            const eveningNumber = eveningTile?.querySelector('.streak-number');

            // Only set if they are currently "0" or empty (not set by main system)
            if (morningNumber && (morningNumber.textContent === '0' || morningNumber.textContent === '')) {
                // Count completed days in current month as fallback
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                let morningCount = 0;
                
                Object.keys(this.routineData).forEach(dateKey => {
                    const date = new Date(dateKey);
                    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                        const dayData = this.routineData[dateKey];
                        const morningCompleted = Object.values(dayData.morning).every(Boolean);
                        if (morningCompleted) morningCount++;
                    }
                });
                
                morningNumber.textContent = morningCount.toString();
            }
            
            if (eveningNumber && (eveningNumber.textContent === '0' || eveningNumber.textContent === '')) {
                // Count completed days in current month as fallback
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                let eveningCount = 0;
                
                Object.keys(this.routineData).forEach(dateKey => {
                    const date = new Date(dateKey);
                    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                        const dayData = this.routineData[dateKey];
                        const eveningCompleted = Object.values(dayData.evening).every(Boolean);
                        if (eveningCompleted) eveningCount++;
                    }
                });
                
                eveningNumber.textContent = eveningCount.toString();
            }
        }
    }

    restoreCheckboxes() {
        const todayData = this.routineData[this.today];
        if (!todayData) {
                return;
        }


        // Restore morning checkboxes
        Object.keys(todayData.morning).forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                const isChecked = todayData.morning[checkboxId];
                checkbox.checked = isChecked;
                
                const label = checkbox.nextElementSibling;
                if (label) {
                    if (isChecked) {
                        label.style.textDecoration = 'line-through';
                        label.style.color = '#999';
                    } else {
                        label.style.textDecoration = 'none';
                        label.style.color = 'inherit';
                    }
                }
                
            }
        });

        // Restore evening checkboxes
        Object.keys(todayData.evening).forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                const isChecked = todayData.evening[checkboxId];
                checkbox.checked = isChecked;
                
                const label = checkbox.nextElementSibling;
                if (label) {
                    if (isChecked) {
                        label.style.textDecoration = 'line-through';
                        label.style.color = '#999';
                    } else {
                        label.style.textDecoration = 'none';
                        label.style.color = 'inherit';
                    }
                }
                
            }
        });

    }

    async reset() {
        this.routineData = this.getEmptyData();
        // Pure cloud mode - save to cloud only
        await this.saveToCloud();
        
        // Reset UI using cached elements
        this.domCache.allCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            const label = checkbox.nextElementSibling;
            if (label) {
                label.style.textDecoration = 'none';
                label.style.color = 'inherit';
            }
        });

        this.updateUI();
    }
}

// Initialize when DOM is ready - simplified version for cloud-only mode
document.addEventListener('DOMContentLoaded', function() {
    // Disable old routine system functions
    if (window.initializeRoutineProgress) {
        window.initializeRoutineProgress = function() {
        };
    }
    
    // Initialize routine manager without complex delays
    // The login system will handle re-initialization with proper data loading
    if (!window.simpleRoutineManager) {
        window.simpleRoutineManager = new SimpleRoutineManager();
    }
});