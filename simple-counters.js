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

        await this.updateAllCounters();
        this.isInitialized = true;
    }

    async updateAllCounters() {
        const now = new Date();
        const user = window.supabase.getCurrentUser();
        
        // Calculate date ranges for last 30 days vs previous 30 days
        const last30End = new Date();
        const last30Start = new Date(last30End.getTime() - 30 * 24 * 60 * 60 * 1000);
        const prev30End = new Date(last30Start.getTime() - 1); // Day before last30Start
        const prev30Start = new Date(prev30End.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const last30StartStr = last30Start.toISOString().split('T')[0];
        const last30EndStr = last30End.toISOString().split('T')[0];
        const prev30StartStr = prev30Start.toISOString().split('T')[0];
        const prev30EndStr = prev30End.toISOString().split('T')[0];
        
        try {
            // Get todos for both periods using updated_at (when completed)
            const [last30TodoData, prev30TodoData, routineData] = await Promise.all([
                window.supabase.query(`todos?user_id=eq.${user.id}&completed=eq.true&updated_at=gte.${last30StartStr}&updated_at=lte.${last30EndStr}&select=id`),
                window.supabase.query(`todos?user_id=eq.${user.id}&completed=eq.true&updated_at=gte.${prev30StartStr}&updated_at=lte.${prev30EndStr}&select=id`),
                window.supabase.query(`simple_routines?user_id=eq.${user.id}&select=date,routine_data`)
            ]);

            // Count todos
            const last30TodoCount = last30TodoData ? last30TodoData.length : 0;
            const prev30TodoCount = prev30TodoData ? prev30TodoData.length : 0;
            const todoPercentChange = this.calculatePercentChange(prev30TodoCount, last30TodoCount);

            // Count routine completions for last 30 days and previous 30 days
            let last30MorningCount = 0;
            let last30EveningCount = 0;
            let prev30MorningCount = 0;
            let prev30EveningCount = 0;

            if (routineData) {
                routineData.forEach(entry => {
                    const entryDate = new Date(entry.date);
                    const entryDateStr = entry.date;
                    
                    // Check if date falls in last 30 days or previous 30 days
                    const isInLast30 = entryDateStr >= last30StartStr && entryDateStr <= last30EndStr;
                    const isInPrev30 = entryDateStr >= prev30StartStr && entryDateStr <= prev30EndStr;
                    
                    if (isInLast30 || isInPrev30) {
                        try {
                            const data = JSON.parse(entry.routine_data);
                            const dayData = data[entry.date];
                            
                            if (dayData) {
                                const morningComplete = dayData.morning && Object.values(dayData.morning).every(Boolean);
                                const eveningComplete = dayData.evening && Object.values(dayData.evening).every(Boolean);
                                
                                if (isInLast30) {
                                    if (morningComplete) last30MorningCount++;
                                    if (eveningComplete) last30EveningCount++;
                                } else if (isInPrev30) {
                                    if (morningComplete) prev30MorningCount++;
                                    if (eveningComplete) prev30EveningCount++;
                                }
                            }
                        } catch (e) {
                            // Skip invalid data
                        }
                    }
                });
            }

            // Calculate percentage changes
            const morningPercentChange = this.calculatePercentChange(prev30MorningCount, last30MorningCount);
            const eveningPercentChange = this.calculatePercentChange(prev30EveningCount, last30EveningCount);

            // Get SOL balance
            const solBalance = await this.getSolBalance();

            // Update display with 30-day counts and percentage changes
            this.setCounterDisplayWithPercent(0, last30MorningCount, morningPercentChange); // Morning
            this.setCounterDisplayWithPercent(1, last30EveningCount, eveningPercentChange); // Evening  
            this.setCounterDisplayWithPercent(2, last30TodoCount, todoPercentChange);    // Todos
            this.setCounterDisplay(3, solBalance);   // SOL Balance (no percentage for now)


        } catch (error) {
            console.error('❌ SimpleCounters: Update failed:', error);
        }
    }

    setCounterDisplay(index, value) {
        const tiles = document.querySelectorAll('.streak-tile');
        if (tiles[index]) {
            const numberEl = tiles[index].querySelector('.streak-number');
            if (numberEl) {
                // Format SOL balance (index 3) to 2 decimal places
                if (index === 3 && typeof value === 'number') {
                    numberEl.textContent = value.toFixed(2);
                } else {
                    numberEl.textContent = value;
                }
            }
        }
    }

    setCounterDisplayWithPercent(index, value, percentChange) {
        const tiles = document.querySelectorAll('.streak-tile');
        if (tiles[index]) {
            const numberEl = tiles[index].querySelector('.streak-number');
            const labelEl = tiles[index].querySelector('.streak-label');
            
            if (numberEl) {
                numberEl.textContent = value;
            }
            
            if (labelEl) {
                // Update label to show percentage change
                const baseLabels = ['Morgen', 'Abend', 'Todos'];
                const baseLabel = baseLabels[index] || 'Count';
                const sign = percentChange > 0 ? '+' : '';
                const color = percentChange > 0 ? '#059669' : percentChange < 0 ? '#dc2626' : '#666666';
                
                labelEl.innerHTML = `${baseLabel}<br><span style="font-size: 0.7rem; color: ${color};">(${sign}${percentChange}% vs. vorherige 30T)</span>`;
            }
        }
    }

    calculatePercentChange(oldValue, newValue) {
        if (oldValue === 0) {
            return newValue > 0 ? 100 : 0;
        }
        return Math.round(((newValue - oldValue) / oldValue) * 100);
    }

    async getSolBalance() {
        try {
            // Helius RPC endpoint (free tier) - better CORS support
            const HELIUS_API_KEY = '35ffdb6a-2061-4573-a66b-ea263c5eaa34';
            const response = await fetch(`https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getBalance",
                    params: [
                        "4vChGDq5TgpceVBEiY7BAEXd2AaK7gtBJzwZzbrdrrQM" // Your wallet address
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.result && typeof data.result.value === 'number') {
                // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
                return data.result.value / 1000000000;
            }
            
            return 0;
        } catch (error) {
            console.error('SOL Balance fetch error:', error);
            return 0; // Return 0 on error
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

