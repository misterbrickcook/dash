// Debug script to check routine data consistency

async function debugRoutineData() {
    if (!window.supabase?.isAuthenticated()) {
        console.log('❌ Not authenticated');
        return;
    }

    const user = window.supabase.getCurrentUser();
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🔍 === ROUTINE DATA DEBUG ===');
    console.log('👤 User ID:', user.id);
    console.log('📅 Today:', today);
    
    // Check simple_routines table
    console.log('\n📊 SIMPLE_ROUTINES TABLE:');
    const allRoutines = await window.supabase.query(`simple_routines?user_id=eq.${user.id}&select=*`);
    console.log('All routines:', allRoutines);
    
    if (allRoutines && allRoutines.length > 0) {
        allRoutines.forEach((routine, i) => {
            console.log(`Entry ${i+1}:`, {
                date: routine.date,
                data: JSON.parse(routine.routine_data)
            });
        });
    }
    
    // Check today specifically
    console.log('\n📅 TODAY SPECIFIC:');
    const todayRoutines = await window.supabase.query(`simple_routines?user_id=eq.${user.id}&date=eq.${today}&select=*`);
    console.log('Today routines:', todayRoutines);
    
    // Check what SimpleCounters sees
    console.log('\n🔢 WHAT SIMPLECOUNTERS SHOULD SEE:');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let morningCount = 0;
    let eveningCount = 0;
    
    if (allRoutines) {
        allRoutines.forEach(entry => {
            const entryDate = new Date(entry.date);
            if (entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear) {
                try {
                    const data = JSON.parse(entry.routine_data);
                    const dayData = data[entry.date];
                    
                    if (dayData) {
                        console.log(`${entry.date}:`, dayData);
                        
                        // Check morning completion
                        if (dayData.morning && Object.values(dayData.morning).every(Boolean)) {
                            morningCount++;
                            console.log(`  ✅ Morning complete`);
                        }
                        // Check evening completion
                        if (dayData.evening && Object.values(dayData.evening).every(Boolean)) {
                            eveningCount++;
                            console.log(`  ✅ Evening complete`);
                        }
                    }
                } catch (e) {
                    console.log(`  ❌ Error parsing ${entry.date}:`, e);
                }
            }
        });
    }
    
    console.log(`\n📊 CALCULATED COUNTS: Morning: ${morningCount}, Evening: ${eveningCount}`);
    console.log('=== END DEBUG ===');
}

// Make it globally available
window.debugRoutineData = debugRoutineData;
console.log('🔧 Debug function available: debugRoutineData()');