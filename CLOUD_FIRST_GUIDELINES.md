# 🛡️ Cloud-First Development Guidelines

## Grundsätze

Das gesamte Dashboard-System folgt einer **strikten Cloud-First Architektur**. Diese Richtlinien sind **verbindlich** für alle zukünftigen Entwicklungen.

## ✅ ERLAUBT

### Daten-Operationen
```javascript
// ✅ Cloud-only Operationen
const data = await supabase.query('table?user_id=eq.123');
await supabase.insert('table', [newItem]);
await supabase.update('table', updatedItem, id);
await supabase.delete('table', id);

// ✅ In-Memory State (wie React)
this.items = loadedFromCloud;
this.filteredItems = this.items.filter(item => item.category === 'active');

// ✅ Authentifizierungs-Checks
if (!supabase?.isAuthenticated()) {
    throw new Error('Authentication required');
}
```

### Fehlerbehandlung
```javascript
// ✅ Direkte Fehlerbehandlung ohne Fallbacks
try {
    const result = await supabase.insert('todos', [todo]);
    if (!result) throw new Error('Insert failed');
} catch (error) {
    console.error('Save failed:', error);
    alert('Fehler beim Speichern: ' + error.message);
    throw error; // Keine Fallbacks!
}
```

## ❌ VERBOTEN

### localStorage Operationen
```javascript
// ❌ NIEMALS localStorage für Anwendungsdaten
localStorage.setItem('todos', JSON.stringify(todos));
localStorage.getItem('goals');

// ❌ NIEMALS Hybrid-Systeme
if (supabase.isAuthenticated()) {
    await saveToCloud();
} else {
    saveToLocalStorage(); // VERBOTEN!
}

// ❌ NIEMALS Offline-Fallbacks
try {
    await cloudOperation();
} catch (error) {
    return useLocalData(); // VERBOTEN!
}
```

### Duale Speichersysteme
```javascript
// ❌ NIEMALS parallele Speicherung
await supabase.insert('todos', [todo]);
localStorage.setItem('todos_cache', JSON.stringify(todos)); // VERBOTEN!
```

## 📋 Implementierungs-Template

### Neuer Manager
```javascript
const NewManager = {
    items: [],
    
    async loadItems() {
        // Authentifizierung erzwingen
        return cloudPolicy.executeCloudOperation('NewManager.load', async (user) => {
            const data = await supabase.query(`table?user_id=eq.${user.id}&select=*`);
            this.items = data || [];
            return this.items;
        });
    },
    
    async addItem(itemData) {
        return cloudPolicy.executeCloudOperation('NewManager.add', async (user) => {
            const item = {
                ...itemData,
                user_id: user.id,
                created_at: new Date().toISOString()
            };
            
            const result = await supabase.insert('table', [item]);
            if (result && result.length > 0) {
                this.items.push(result[0]);
                return result[0];
            }
            throw new Error('Insert failed');
        });
    },
    
    async deleteItem(id) {
        return cloudPolicy.executeCloudOperation('NewManager.delete', async (user) => {
            await supabase.delete('table', id);
            this.items = this.items.filter(item => item.id !== id);
        });
    }
};

// Policy-Validierung
cloudPolicy.validateManager('NewManager', NewManager);
```

## 🔧 Hilfs-Funktionen

### CloudPolicy nutzen
```javascript
// Für neue Manager-Vorlagen
console.log(cloudPolicy.getManagerTemplate('MyNewManager'));

// Authentifizierung erzwingen
const user = cloudPolicy.enforceAuthentication('my-operation');

// Cloud-Operation wrapper
await cloudPolicy.executeCloudOperation('save-todo', async (user) => {
    return await supabase.insert('todos', [todo]);
});
```

### Debugging
```javascript
// Manager-Compliance prüfen
cloudPolicy.validateManager('TodoManager', TodoManager);

// Policy-Status prüfen
console.log('Policy Version:', cloudPolicy.policyVersion);
console.log('Enforcement Mode:', cloudPolicy.enforcementMode);
```

## 🚫 localStorage Überwachung

Das System überwacht automatisch localStorage-Zugriffe:

- **Development**: Warnung in Console
- **Production**: Blockierung von nicht-erlaubten Keys

### Erlaubte localStorage Keys:
- `supabase.auth.token` - Authentifizierung
- `debug_mode` - Debug-Einstellungen  
- `ui_preferences` - Nur UI-Einstellungen (keine Daten!)

## ⚠️ Systemanforderungen

- **Internet erforderlich**: Alle Features benötigen Netzwerkverbindung
- **Authentifizierung erforderlich**: Alle Datenoperationen benötigen gültigen Supabase-User
- **Supabase verfügbar**: System funktioniert nur mit funktionierender Supabase-Verbindung

## 🎯 Ziele dieser Architektur

1. **Keine Race Conditions** zwischen lokal und cloud
2. **Konsistente Daten** auf allen Geräten
3. **Einfache Wartung** ohne komplexe Hybrid-Logik
4. **Klare Fehlerbehandlung** ohne versteckte Fallbacks
5. **Zukunftssicher** für neue Features

## 📞 Bei Fragen

Diese Richtlinien sind **verbindlich**. Bei Unsicherheiten:

1. Prüfe `CLOUD_POLICY.js` für verfügbare Funktionen
2. Nutze `cloudPolicy.getManagerTemplate()` für neue Manager
3. Teste mit `cloudPolicy.validateManager()` die Compliance

**Erinnerung**: Wir haben diese Architektur gewählt um die Endlosschleifen und Konflikte zwischen lokalen und Cloud-Daten zu eliminieren. Jede Abweichung bringt diese Probleme zurück!