# Database Migration: Remove Category Column

## Was zu tun ist:

1. **In Supabase Dashboard einloggen**
2. **SQL Editor öffnen**
3. **Folgendes SQL ausführen:**

```sql
-- Remove category column from crypto_wiki_entries table
ALTER TABLE crypto_wiki_entries DROP CONSTRAINT IF EXISTS crypto_wiki_entries_category_check;
ALTER TABLE crypto_wiki_entries DROP COLUMN IF EXISTS category;
```

## Grund für die Migration:

- **Saubere Architektur**: Nur noch tag-basierte Filterung
- **Keine Workarounds**: Entfernt die category-Constraint-Probleme
- **Vereinfacht Code**: Keine category-Logic mehr nötig

## Nach der Migration:

✅ Wiki-Einträge speichern ohne category-Feld  
✅ Nur noch Tags für Filterung und Organisation  
✅ Sauberer, einfacher Code ohne category-Workarounds  

## Code-Änderungen bereits angewendet:

- ✅ category aus Entry-Objekt entfernt
- ✅ categoryLabels-Objekt entfernt  
- ✅ Category-Display-Code entfernt
- ✅ Category-CSS entfernt
- ✅ Nur noch tag-basierte Filterung aktiv