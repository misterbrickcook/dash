// Dynamic Backup System
// Auto-detects all user tables and creates comprehensive backups

class BackupManager {
    constructor() {
        this.userTables = [
            'todos',
            'deadlines', 
            'links',
            'notes',
            'resources',
            'trading_rules',
            'journal_entries',
            'journal_tags',
            'routine_templates',
            'routine_completions',
            'simple_routines',
            'sport_tracking'
        ];
    }

    async exportAllData() {
        if (!supabase || !supabase.isAuthenticated()) {
            throw new Error('Authentication required for backup export');
        }

        try {
            const user = supabase.getCurrentUser();
            const backup = {
                metadata: {
                    version: '1.0',
                    exportDate: new Date().toISOString(),
                    userId: user.id,
                    userEmail: user.email,
                    appVersion: 'Dash v4.1'
                },
                data: {}
            };

            console.log('🔄 Starting backup export...');
            let totalRecords = 0;

            // Export data from each table
            for (const table of this.userTables) {
                try {
                    console.log(`📊 Exporting ${table}...`);
                    const data = await supabase.query(`${table}?user_id=eq.${user.id}&select=*`);
                    
                    if (data && data.length > 0) {
                        backup.data[table] = data;
                        totalRecords += data.length;
                        console.log(`✅ Exported ${data.length} records from ${table}`);
                    } else {
                        console.log(`ℹ️ No data found in ${table}`);
                        backup.data[table] = [];
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not export ${table}:`, error.message);
                    backup.data[table] = null; // Mark as failed
                }
            }

            console.log(`✅ Backup export complete! Total records: ${totalRecords}`);
            return backup;

        } catch (error) {
            console.error('❌ Backup export failed:', error);
            throw error;
        }
    }

    async downloadBackup() {
        try {
            const backup = await this.exportAllData();
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `dashfin-backup-${timestamp}.json`;
            
            // Create and download file
            const blob = new Blob([JSON.stringify(backup, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success message
            this.showNotification(`✅ Backup saved as ${filename}`, 'success');
            return true;

        } catch (error) {
            console.error('Download backup failed:', error);
            this.showNotification(`❌ Backup failed: ${error.message}`, 'error');
            return false;
        }
    }

    async importFromBackup(file) {
        if (!supabase || !supabase.isAuthenticated()) {
            throw new Error('Authentication required for backup import');
        }

        try {
            const text = await file.text();
            const backup = JSON.parse(text);

            // Validate backup structure
            if (!backup.metadata || !backup.data) {
                throw new Error('Invalid backup file format');
            }

            console.log('🔄 Starting backup import...');
            console.log(`📅 Backup from: ${backup.metadata.exportDate}`);
            
            const user = supabase.getCurrentUser();
            let totalImported = 0;
            const results = {};

            // Import data to each table
            for (const [tableName, tableData] of Object.entries(backup.data)) {
                if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
                    console.log(`ℹ️ Skipping ${tableName} - no data`);
                    results[tableName] = { imported: 0, skipped: 0, errors: 0 };
                    continue;
                }

                try {
                    console.log(`📊 Importing ${tableName}...`);
                    let imported = 0;
                    let skipped = 0;
                    let errors = 0;

                    for (const record of tableData) {
                        try {
                            // Update user_id to current user
                            const importRecord = { ...record };
                            importRecord.user_id = user.id;
                            
                            // Remove id for new insertion
                            delete importRecord.id;

                            await supabase.insert(tableName, [importRecord]);
                            imported++;
                            totalImported++;
                        } catch (error) {
                            if (error.message.includes('duplicate')) {
                                skipped++;
                            } else {
                                errors++;
                                console.warn(`⚠️ Error importing record to ${tableName}:`, error);
                            }
                        }
                    }

                    results[tableName] = { imported, skipped, errors };
                    console.log(`✅ ${tableName}: ${imported} imported, ${skipped} skipped, ${errors} errors`);

                } catch (error) {
                    console.error(`❌ Failed to import ${tableName}:`, error);
                    results[tableName] = { imported: 0, skipped: 0, errors: tableData.length };
                }
            }

            console.log(`✅ Import complete! Total records imported: ${totalImported}`);
            this.showNotification(`✅ Import complete! ${totalImported} records imported`, 'success');
            
            return results;

        } catch (error) {
            console.error('❌ Import failed:', error);
            this.showNotification(`❌ Import failed: ${error.message}`, 'error');
            throw error;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `backup-notification backup-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            backgroundColor: type === 'success' ? '#10B981' : 
                           type === 'error' ? '#EF4444' : '#3B82F6'
        });

        // Add to page and auto-remove
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Get backup statistics
    async getBackupStats() {
        if (!supabase || !supabase.isAuthenticated()) {
            return null;
        }

        try {
            const user = supabase.getCurrentUser();
            const stats = {
                totalRecords: 0,
                tableStats: {}
            };

            for (const table of this.userTables) {
                try {
                    const data = await supabase.query(`${table}?user_id=eq.${user.id}&select=id`);
                    const count = data ? data.length : 0;
                    stats.tableStats[table] = count;
                    stats.totalRecords += count;
                } catch (error) {
                    stats.tableStats[table] = 0;
                }
            }

            return stats;
        } catch (error) {
            console.error('Failed to get backup stats:', error);
            return null;
        }
    }
}

// Global instance
window.backupManager = new BackupManager();