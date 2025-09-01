// ========================================
// BACKUP SYSTEM
// ========================================
// Cloud-based backup system for the dashboard
// Follows CLOUD_POLICY.js guidelines

class BackupSystem {
    constructor() {
        this.initialized = false;
        this.user = null;
    }

    /**
     * Initialize backup system
     */
    async initialize() {
        if (!window.supabase?.isAuthenticated()) {
            console.warn('BackupSystem: Supabase not authenticated');
            return false;
        }
        
        this.user = window.supabase.getCurrentUser();
        this.initialized = true;
        console.log('✅ BackupSystem initialized for user:', this.user?.email);
        return true;
    }

    /**
     * Create a full backup of user data
     */
    async createBackup() {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            if (!this.user) {
                throw new Error('Authentication required for backup');
            }

            console.log('📦 Creating backup...');

            const backup = {
                user_id: this.user.id,
                created_at: new Date().toISOString(),
                version: '1.0.0',
                data: {}
            };

            // Collect data from all tables
            const tables = [
                'journal_entries',
                'journal_tags', 
                'todos',
                'goals',
                'appointments',
                'resources',
                'trading_rules',
                'routine_completions',
                'notes'
            ];

            for (const table of tables) {
                try {
                    const data = await window.supabase.query(`${table}?user_id=eq.${this.user.id}&select=*`);
                    backup.data[table] = data || [];
                    console.log(`📋 Backed up ${backup.data[table].length} ${table} records`);
                } catch (error) {
                    console.warn(`⚠️  Could not backup ${table}:`, error.message);
                    backup.data[table] = [];
                }
            }

            // Save backup to database
            const backupRecord = await window.supabase.insert('backups', [backup]);
            
            if (backupRecord && backupRecord.length > 0) {
                console.log('✅ Backup created successfully:', backupRecord[0].id);
                return backupRecord[0];
            } else {
                throw new Error('Failed to save backup record');
            }

        } catch (error) {
            console.error('❌ Backup failed:', error);
            throw error;
        }
    }

    /**
     * Get list of available backups
     */
    async getBackups() {
        try {
            if (!this.user) {
                await this.initialize();
            }

            const backups = await window.supabase.query(
                `backups?user_id=eq.${this.user.id}&select=id,created_at,version&order=created_at.desc`
            );

            return backups || [];
        } catch (error) {
            console.error('❌ Error fetching backups:', error);
            return [];
        }
    }

    /**
     * Restore from backup
     */
    async restoreFromBackup(backupId) {
        try {
            if (!this.user) {
                await this.initialize();
            }

            console.log('📥 Restoring from backup:', backupId);

            // Get backup data
            const backup = await window.supabase.query(
                `backups?id=eq.${backupId}&user_id=eq.${this.user.id}&select=*`
            );

            if (!backup || backup.length === 0) {
                throw new Error('Backup not found or access denied');
            }

            const backupData = backup[0].data;
            console.log('📋 Backup data loaded');

            // Restore each table
            for (const [table, records] of Object.entries(backupData)) {
                if (!Array.isArray(records) || records.length === 0) {
                    console.log(`⏭️  Skipping empty ${table}`);
                    continue;
                }

                try {
                    console.log(`📥 Restoring ${records.length} ${table} records...`);
                    
                    // Clear existing data for this user (optional - could be made selective)
                    await window.supabase.delete(table, `user_id=eq.${this.user.id}`);
                    
                    // Insert backup data
                    const result = await window.supabase.insert(table, records);
                    console.log(`✅ Restored ${table}:`, result?.length || 0, 'records');
                    
                } catch (error) {
                    console.warn(`⚠️  Could not restore ${table}:`, error.message);
                }
            }

            console.log('✅ Restore completed successfully');
            
            // Reload the page to refresh all data
            setTimeout(() => {
                window.location.reload();
            }, 2000);

            return true;

        } catch (error) {
            console.error('❌ Restore failed:', error);
            throw error;
        }
    }

    /**
     * Delete a backup
     */
    async deleteBackup(backupId) {
        try {
            if (!this.user) {
                await this.initialize();
            }

            await window.supabase.delete('backups', backupId);
            console.log('✅ Backup deleted:', backupId);
            
        } catch (error) {
            console.error('❌ Error deleting backup:', error);
            throw error;
        }
    }

    /**
     * Auto-backup (called periodically)
     */
    async autoBackup() {
        try {
            // Only create auto-backup if user has been active
            const lastBackup = await window.supabase.query(
                `backups?user_id=eq.${this.user.id}&select=created_at&order=created_at.desc&limit=1`
            );

            if (lastBackup && lastBackup.length > 0) {
                const lastBackupTime = new Date(lastBackup[0].created_at);
                const daysSinceLastBackup = (Date.now() - lastBackupTime.getTime()) / (1000 * 60 * 60 * 24);
                
                if (daysSinceLastBackup < 7) {
                    console.log('📦 Auto-backup skipped: Recent backup exists');
                    return;
                }
            }

            console.log('📦 Creating auto-backup...');
            await this.createBackup();
            
        } catch (error) {
            console.error('❌ Auto-backup failed:', error);
        }
    }
}

// Create global instance
const backupSystem = new BackupSystem();

// Make it available globally
window.backupSystem = backupSystem;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for authentication
    const checkAuth = setInterval(() => {
        if (window.supabase?.isAuthenticated()) {
            backupSystem.initialize();
            
            // Schedule auto-backup (once per day)
            setTimeout(() => {
                backupSystem.autoBackup();
            }, 60000); // 1 minute after initialization
            
            clearInterval(checkAuth);
        }
    }, 1000);
    
    // Stop checking after 30 seconds
    setTimeout(() => clearInterval(checkAuth), 30000);
});

console.log('✅ BackupSystem module loaded');