// Complete Routine Database Reset Script
// This script will completely reset all routine data and start fresh

async function resetRoutineDatabase() {
    console.log('🔄 Starting complete routine database reset...');
    
    try {
        // 1. Clear all localStorage routine data
        const keysToRemove = [
            'routineCompletionData',
            'routine_completions_cache', 
            'monthlyRoutineCompletions',
            'routineData',
            'lastRoutineResetDate',
            'routineResetTime',
            'morningRoutineStreak',
            'eveningRoutineStreak'
        ];
        
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ Removed localStorage: ${key}`);
            }
        });
        
        // 2. Clear Supabase routine_completions table if authenticated
        if (window.supabase && window.supabase.isAuthenticated()) {
            const user = window.supabase.getCurrentUser();
            console.log('🔄 Clearing cloud routine data for user:', user.email);
            
            try {
                // Delete all routine completions for current user
                const result = await window.supabase.delete('routine_completions', `user_id=eq.${user.id}`);
                console.log('✅ Cleared cloud routine completions');
            } catch (error) {
                console.warn('⚠️ Could not clear cloud data:', error);
            }
        }
        
        // 3. Reset routine checkboxes on page
        const morningCheckboxes = document.querySelectorAll('#morning-routine input[type="checkbox"]');
        const eveningCheckboxes = document.querySelectorAll('#evening-routine input[type="checkbox"]');
        
        [...morningCheckboxes, ...eveningCheckboxes].forEach(checkbox => {
            checkbox.checked = false;
            const label = checkbox.nextElementSibling;
            if (label) {
                label.style.textDecoration = 'none';
                label.style.color = 'inherit';
            }
        });
        console.log('✅ Reset all routine checkboxes');
        
        // 4. Reset routine counters to 0
        const streakTiles = document.querySelectorAll('.streak-tile');
        if (streakTiles.length >= 2) {
            const morningTile = streakTiles[0];
            const eveningTile = streakTiles[1];
            
            const morningNumber = morningTile?.querySelector('.streak-number');
            const eveningNumber = eveningTile?.querySelector('.streak-number');
            
            if (morningNumber) morningNumber.textContent = '0';
            if (eveningNumber) eveningNumber.textContent = '0';
            
            console.log('✅ Reset routine counters to 0');
        }
        
        // 5. Initialize clean routine system
        if (window.cloudStorage) {
            // Ensure routine methods are available
            window.cloudStorage.setupRoutineMethods();
            console.log('✅ Reinitialized routine methods');
        }
        
        console.log('🎉 Routine database reset complete!');
        console.log('📝 All routine data has been cleared and counters reset');
        console.log('🔄 Refresh the page to ensure clean state across devices');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error during routine reset:', error);
        return false;
    }
}

// Auto-execute if this script is loaded
if (typeof window !== 'undefined') {
    window.resetRoutineDatabase = resetRoutineDatabase;
    console.log('🔧 Routine reset function available as window.resetRoutineDatabase()');
}