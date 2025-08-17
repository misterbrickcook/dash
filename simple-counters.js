// SIMPLE COUNTER SYSTEM - No conflicts, just works
// Replaces all the complex counter logic with something reliable

class SimpleCounters {
    constructor() {
        this.isInitialized = false;
        this.solWalletAddress = '4vChGDq5TgpceVBEiY7BAEXd2AaK7gtBJzwZzbrdrrQM';
        this.lastSolBalance = 0;
    }

    async init() {
        if (this.isInitialized) return;
        
        if (!window.supabase?.isAuthenticated()) {
            console.error('❌ SimpleCounters: Not authenticated');
            return;
        }

        console.log('🔄 SimpleCounters: Initializing...');
        await this.updateAllCounters();
        this.isInitialized = true;
        console.log('✅ SimpleCounters: Ready');
    }

    async updateAllCounters() {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const monthEnd = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
        
        const user = window.supabase.getCurrentUser();
        
        try {
            // Get all data in one batch
            const [todoData, routineData] = await Promise.all([
                window.supabase.query(`todos?user_id=eq.${user.id}&completed=eq.true&created_at=gte.${monthStart}&created_at=lt.${monthEnd}&select=id`),
                window.supabase.query(`simple_routines?user_id=eq.${user.id}&select=date,routine_data`)
            ]);

            // Count todos
            const todoCount = todoData ? todoData.length : 0;

            // Count routine completions
            let morningCount = 0;
            let eveningCount = 0;
            
            // Get SOL balance
            const solBalance = await this.getSolBalance();

            if (routineData) {
                routineData.forEach(entry => {
                    const entryDate = new Date(entry.date);
                    if (entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear) {
                        try {
                            const data = JSON.parse(entry.routine_data);
                            const dayData = data[entry.date];
                            
                            if (dayData) {
                                // Check morning completion
                                if (dayData.morning && Object.values(dayData.morning).every(Boolean)) {
                                    morningCount++;
                                }
                                // Check evening completion
                                if (dayData.evening && Object.values(dayData.evening).every(Boolean)) {
                                    eveningCount++;
                                }
                            }
                        } catch (e) {
                            // Skip invalid data
                        }
                    }
                });
            }

            // Update display immediately
            this.setCounterDisplay(0, morningCount); // Morning
            this.setCounterDisplay(1, eveningCount); // Evening  
            this.setCounterDisplay(2, todoCount);    // Todos
            this.setCounterDisplay(3, solBalance);   // SOL Balance

            console.log(`📊 SimpleCounters: M:${morningCount} E:${eveningCount} T:${todoCount} SOL:${solBalance}`);

        } catch (error) {
            console.error('❌ SimpleCounters: Update failed:', error);
        }
    }

    setCounterDisplay(index, value) {
        const tiles = document.querySelectorAll('.streak-tile');
        if (tiles[index]) {
            const numberEl = tiles[index].querySelector('.streak-number');
            if (numberEl) {
                // Format SOL balance with 2 decimals
                if (index === 3) {
                    numberEl.textContent = typeof value === 'number' ? value.toFixed(2) : '0.00';
                } else {
                    numberEl.textContent = value;
                }
            }
        }
    }

    // SOL Balance API
    async getSolBalance() {
        try {
            console.log('🟣 Fetching SOL balance for wallet:', this.solWalletAddress);
            
            // Try multiple RPC endpoints for better reliability
            const rpcEndpoints = [
                'https://solana-api.projectserum.com',
                'https://api.mainnet-beta.solana.com',
                'https://solana-mainnet.g.alchemy.com/v2/demo'
            ];
            
            for (const endpoint of rpcEndpoints) {
                try {
                    console.log(`🟣 Trying RPC endpoint: ${endpoint}`);
                    
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            id: 1,
                            method: 'getBalance',
                            params: [this.solWalletAddress]
                        })
                    });
            
                    const data = await response.json();
                    
                    if (data.result && data.result.value !== undefined) {
                        // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
                        const balanceInSol = data.result.value / 1000000000;
                        this.lastSolBalance = balanceInSol;
                        console.log(`✅ SOL Balance: ${balanceInSol.toFixed(4)} SOL (via ${endpoint})`);
                        return balanceInSol;
                    } else if (data.error) {
                        console.log(`⚠️ RPC Error from ${endpoint}:`, data.error.message);
                        continue; // Try next endpoint
                    }
                    
                } catch (endpointError) {
                    console.log(`⚠️ Failed to reach ${endpoint}:`, endpointError.message);
                    continue; // Try next endpoint
                }
            }
            
            // If all endpoints failed, try a public API as fallback
            console.log('🟣 All RPC endpoints failed, trying public API fallback...');
            return await this.getSolBalanceFallback();
            
        } catch (error) {
            console.error('❌ SOL API: Complete failure:', error);
            return this.lastSolBalance; // Return cached value on complete error
        }
    }
    
    // Fallback method using a public API
    async getSolBalanceFallback() {
        try {
            // Using SolanaBeach public API as fallback
            const response = await fetch(`https://api.solanabeach.io/v1/account/${this.solWalletAddress}`);
            const data = await response.json();
            
            if (data && data.lamports) {
                const balanceInSol = data.lamports / 1000000000;
                this.lastSolBalance = balanceInSol;
                console.log(`✅ SOL Balance: ${balanceInSol.toFixed(4)} SOL (via SolanaBeach fallback)`);
                return balanceInSol;
            }
        } catch (error) {
            console.error('❌ Fallback API also failed:', error);
        }
        
        return this.lastSolBalance; // Return cached value
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

console.log('✅ SimpleCounters loaded');