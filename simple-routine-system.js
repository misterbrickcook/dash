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
        console.log('🔄 Initializing SimpleRoutineManager...');
        
        // Cache DOM elements for performance
        this.cacheDOMElements();
        
        // First clear any existing visual styles
        this.clearVisualStyles();
        
        await this.loadTodaysData();
        this.setupEventListeners();
        this.updateUI();
        console.log('✅ SimpleRoutineManager initialized');
    }

    cacheDOMElements() {
        // Cache all frequently used DOM elements
        this.domCache.allCheckboxes = document.querySelectorAll('#morning-routine input[type="checkbox"], #evening-routine input[type="checkbox"]');
        this.domCache.morningCheckboxes = document.querySelectorAll('#morning-routine input[type="checkbox"]');
        this.domCache.eveningCheckboxes = document.querySelectorAll('#evening-routine input[type="checkbox"]');
        this.domCache.morningProgressFill = document.querySelector('#morning-routine .progress-fill');
        this.domCache.eveningProgressFill = document.querySelector('#evening-routine .progress-fill');
        this.domCache.streakTiles = document.querySelectorAll('.streak-tile');
        console.log('💾 DOM elements cached for performance');
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
        console.log('🧹 Cleared existing visual styles');
    }

    async loadTodaysData() {
        try {
            // Try cloud first if authenticated
            if (window.supabase && window.supabase.isAuthenticated()) {
                const cloudData = await this.loadFromCloud();
                if (cloudData) {
                    this.routineData = cloudData;
                    console.log('☁️ Loaded routine data from cloud:', cloudData);
                    return;
                }
            }

            // Check if we can migrate from old system
            const migratedData = await this.migrateFromOldSystem();
            if (migratedData) {
                this.routineData = migratedData;
                console.log('🔄 Migrated data from old system:', migratedData);
                return;
            }

            // Fallback to localStorage
            const localData = localStorage.getItem('simple_routine_data');
            if (localData) {
                this.routineData = JSON.parse(localData);
                console.log('💾 Loaded routine data from localStorage:', this.routineData);
            } else {
                this.routineData = this.getEmptyData();
                console.log('🆕 Created new routine data');
            }
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
                // Save migrated data
                localStorage.setItem('simple_routine_data', JSON.stringify(newData));
                await this.saveToCloud();
                
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

        console.log('✅ Event listeners set up for routine checkboxes');
    }

    async handleCheckboxChange(checkbox, routineType) {
        const checkboxId = checkbox.id;
        const isChecked = checkbox.checked;

        console.log(`📝 Checkbox changed: ${checkboxId} = ${isChecked} (${routineType})`);

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

        // Save locally immediately
        localStorage.setItem('simple_routine_data', JSON.stringify(this.routineData));

        // Save to cloud
        await this.saveToCloud();

        // Update UI
        this.updateUI();

        console.log('✅ Routine data updated and saved');
    }

    updateUI() {
        // Update progress bars
        this.updateProgressBars();
        // Update counters
        this.updateCounters();
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
        // Count completed days in current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let morningCount = 0;
        let eveningCount = 0;

        Object.keys(this.routineData).forEach(dateKey => {
            const date = new Date(dateKey);
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                const dayData = this.routineData[dateKey];
                
                // Check if all morning tasks completed
                const morningCompleted = Object.values(dayData.morning).every(Boolean);
                if (morningCompleted) morningCount++;

                // Check if all evening tasks completed
                const eveningCompleted = Object.values(dayData.evening).every(Boolean);
                if (eveningCompleted) eveningCount++;
            }
        });

        // Update counter tiles using cached elements
        if (this.domCache.streakTiles.length >= 2) {
            const morningTile = this.domCache.streakTiles[0];
            const eveningTile = this.domCache.streakTiles[1];

            const morningNumber = morningTile?.querySelector('.streak-number');
            const eveningNumber = eveningTile?.querySelector('.streak-number');

            if (morningNumber) morningNumber.textContent = morningCount.toString();
            if (eveningNumber) eveningNumber.textContent = eveningCount.toString();

            console.log(`📊 Updated counters: Morning=${morningCount}, Evening=${eveningCount}`);
        }
    }

    restoreCheckboxes() {
        const todayData = this.routineData[this.today];
        if (!todayData) {
            console.log('⚠️ No data for today:', this.today);
            return;
        }

        console.log('🔄 Restoring checkboxes from data:', todayData);

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
                
                console.log(`📋 Morning: ${checkboxId} = ${isChecked}`);
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
                
                console.log(`📋 Evening: ${checkboxId} = ${isChecked}`);
            }
        });

        console.log('✅ Checkboxes restored from data');
    }

    async reset() {
        this.routineData = this.getEmptyData();
        localStorage.setItem('simple_routine_data', JSON.stringify(this.routineData));
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
        console.log('🔄 Routine system reset');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Disable old routine system functions
    if (window.initializeRoutineProgress) {
        window.initializeRoutineProgress = function() {
            console.log('🚫 Old routine system disabled - using SimpleRoutineManager instead');
        };
    }
    
    // Wait a bit for other systems to load
    setTimeout(() => {
        window.simpleRoutineManager = new SimpleRoutineManager();
        
        // Restore checkboxes after initialization and check if migration is needed
        setTimeout(async () => {
            // First try to migrate if no data exists yet
            if (Object.keys(window.simpleRoutineManager.routineData[window.simpleRoutineManager.today] || {}).length === 0) {
                console.log('🔄 No data found, attempting migration...');
                const migrated = await window.simpleRoutineManager.migrateFromOldSystem();
                if (migrated) {
                    window.simpleRoutineManager.routineData = migrated;
                }
            }
            
            window.simpleRoutineManager.restoreCheckboxes();
            window.simpleRoutineManager.updateUI();
        }, 500);
    }, 1000);
});