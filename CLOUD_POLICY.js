// ========================================
// CLOUD-FIRST POLICY - ZENTRALE REGEL
// ========================================
// Diese Datei definiert die verbindliche Cloud-First Architektur
// für das gesamte Dashboard-System.
//
// GRUNDSATZ: 100% Cloud-only, keine localStorage Fallbacks!

/**
 * CLOUD-FIRST POLICY
 * 
 * Alle neuen Features und Änderungen MÜSSEN diese Regeln befolgen:
 * 
 * 1. ✅ NUR CLOUD: Alle Daten werden ausschließlich in Supabase gespeichert
 * 2. ❌ KEIN localStorage: Keine lokalen Fallbacks oder Caches
 * 3. ✅ AUTH REQUIRED: Authentifizierung ist für alle Operationen erforderlich
 * 4. ❌ KEINE OFFLINE: System funktioniert nur mit Internetverbindung
 * 5. ✅ FAIL FAST: Bei Authentifizierungs- oder Netzwerkfehlern sofort abbrechen
 * 6. ✅ CLEAR ERRORS: Verständliche Fehlermeldungen für den User
 * 
 * VERBOTEN:
 * - localStorage.setItem() / localStorage.getItem()
 * - Offline-Fallbacks
 * - Duale Speichersysteme (lokal + cloud)
 * - Race Conditions zwischen verschiedenen Datenquellen
 * 
 * ERLAUBT:
 * - Nur Supabase als Datenquelle
 * - In-Memory State für UI (React-style)
 * - Direkte Fehlermeldungen ohne Fallbacks
 */

class CloudPolicy {
    constructor() {
        this.policyVersion = "1.0.0";
        this.enforcementMode = "STRICT";
        
        // Überwache localStorage Zugriffe
        this.monitorLocalStorageAccess();
        
        console.log("🛡️ Cloud-First Policy activated - Version", this.policyVersion);
        console.log("📋 All data operations must be cloud-only");
        console.log("❌ localStorage fallbacks are prohibited");
    }
    
    /**
     * Zentrale Authentifizierungs-Prüfung
     * MUSS vor jeder Datenoperation aufgerufen werden
     */
    enforceAuthentication(operationName = "operation") {
        if (!window.supabase?.isAuthenticated()) {
            const error = `❌ CLOUD POLICY VIOLATION: ${operationName} requires authentication`;
            console.error(error);
            
            // Zeige User-freundliche Fehlermeldung
            const message = this.getAuthErrorMessage(operationName);
            if (typeof window !== 'undefined' && window.alert) {
                alert(message);
            }
            
            throw new Error(`Authentication required for ${operationName}`);
        }
        
        return window.supabase.getCurrentUser();
    }
    
    /**
     * Zentrale Cloud-Operation Wrapper
     * Garantiert Cloud-first Verhalten
     */
    async executeCloudOperation(operationName, cloudFunction) {
        try {
            // Authentifizierung erzwingen
            const user = this.enforceAuthentication(operationName);
            
            console.log(`☁️ CLOUD POLICY: Executing ${operationName} for user ${user.id}`);
            
            // Cloud-Operation ausführen
            const result = await cloudFunction(user);
            
            console.log(`✅ CLOUD POLICY: ${operationName} completed successfully`);
            return result;
            
        } catch (error) {
            console.error(`❌ CLOUD POLICY: ${operationName} failed:`, error);
            
            // Keine Fallbacks - Fehler direkt weiterwerfen
            throw error;
        }
    }
    
    /**
     * localStorage Zugriff überwachen und blockieren
     */
    monitorLocalStorageAccess() {
        if (typeof window === 'undefined') return;
        
        // Nur in Entwicklungsmodus überwachen
        if (this.enforcementMode === "STRICT") {
            this.wrapLocalStorageAccess();
        }
    }
    
    wrapLocalStorageAccess() {
        const originalSetItem = Storage.prototype.setItem;
        const originalGetItem = Storage.prototype.getItem;
        
        // Erlaubte localStorage Keys (für System-interne Dinge)
        const allowedKeys = [
            'supabase.auth.token',  // Supabase Auth
            'debug_mode',           // Debug-Einstellungen
            'ui_preferences'        // Nur UI-Einstellungen, keine Daten
        ];
        
        Storage.prototype.setItem = function(key, value) {
            if (allowedKeys.some(allowed => key.includes(allowed))) {
                return originalSetItem.call(this, key, value);
            }
            
            console.warn(`🛡️ CLOUD POLICY: Blocked localStorage.setItem("${key}")`);
            console.warn("📋 Use cloud storage only - no local data allowed");
            
            // In development: Warnung zeigen, in production: blockieren
            if (window.location.hostname === 'localhost') {
                console.warn("⚠️ Development mode: localStorage access allowed but discouraged");
                return originalSetItem.call(this, key, value);
            } else {
                throw new Error(`Cloud Policy Violation: localStorage access blocked for key "${key}"`);
            }
        };
        
        Storage.prototype.getItem = function(key) {
            if (allowedKeys.some(allowed => key.includes(allowed))) {
                return originalGetItem.call(this, key);
            }
            
            console.warn(`🛡️ CLOUD POLICY: Blocked localStorage.getItem("${key}")`);
            
            // In development: Warnung zeigen, in production: blockieren
            if (window.location.hostname === 'localhost') {
                console.warn("⚠️ Development mode: localStorage access allowed but discouraged");
                return originalGetItem.call(this, key);
            } else {
                return null; // Kein Fehler, aber auch keine Daten
            }
        };
    }
    
    /**
     * User-freundliche Fehlermeldungen
     */
    getAuthErrorMessage(operation) {
        const messages = {
            'save': 'Fehler: Nicht angemeldet. Daten können nicht gespeichert werden.',
            'load': 'Fehler: Nicht angemeldet. Daten können nicht geladen werden.',
            'delete': 'Fehler: Nicht angemeldet. Daten können nicht gelöscht werden.',
            'update': 'Fehler: Nicht angemeldet. Daten können nicht aktualisiert werden.'
        };
        
        // Erkenne Operation aus dem Namen
        for (const [key, message] of Object.entries(messages)) {
            if (operation.toLowerCase().includes(key)) {
                return message;
            }
        }
        
        return 'Fehler: Nicht angemeldet. Diese Aktion erfordert eine Authentifizierung.';
    }
    
    /**
     * Validiere Manager-Implementierung
     * Kann verwendet werden um zu prüfen ob ein Manager cloud-konform ist
     */
    validateManager(managerName, managerObject) {
        console.log(`🔍 CLOUD POLICY: Validating ${managerName}...`);
        
        const violations = [];
        
        // Prüfe auf verbotene localStorage Verwendung
        const managerString = managerObject.toString();
        if (managerString.includes('localStorage')) {
            violations.push('Uses localStorage');
        }
        
        // Prüfe auf Required-Methoden
        const requiredMethods = ['loadFromCloud', 'saveToCloud'];
        for (const method of requiredMethods) {
            if (typeof managerObject[method] !== 'function') {
                violations.push(`Missing required method: ${method}`);
            }
        }
        
        if (violations.length > 0) {
            console.error(`❌ CLOUD POLICY: ${managerName} violations:`, violations);
            return false;
        }
        
        console.log(`✅ CLOUD POLICY: ${managerName} is compliant`);
        return true;
    }
    
    /**
     * Template für neue Manager
     */
    getManagerTemplate(name) {
        return `
// ${name} - Cloud-First Implementation
// Follows CLOUD_POLICY.js guidelines

const ${name} = {
    data: [],
    
    async load() {
        return cloudPolicy.executeCloudOperation('${name}.load', async (user) => {
            const data = await supabase.query(\`table?user_id=eq.\${user.id}&select=*\`);
            this.data = data || [];
            return this.data;
        });
    },
    
    async save(item) {
        return cloudPolicy.executeCloudOperation('${name}.save', async (user) => {
            item.user_id = user.id;
            const result = await supabase.insert('table', [item]);
            if (result && result.length > 0) {
                this.data.push(result[0]);
                return result[0];
            }
            throw new Error('Save failed');
        });
    },
    
    async delete(id) {
        return cloudPolicy.executeCloudOperation('${name}.delete', async (user) => {
            await supabase.delete('table', id);
            this.data = this.data.filter(item => item.id !== id);
        });
    }
};

// Policy-Validierung
cloudPolicy.validateManager('${name}', ${name});
`;
    }
}

// Globale Instanz erstellen
window.cloudPolicy = new CloudPolicy();

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudPolicy;
}

console.log("🛡️ Cloud-First Policy loaded and enforced");
console.log("📖 Use cloudPolicy.getManagerTemplate('NewManager') for new implementations");