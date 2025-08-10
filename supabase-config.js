// Supabase Configuration
// This file will be populated after Supabase setup

// Environment variables (will be set in Vercel)  
const SUPABASE_URL = 'https://aotuakgnudtiigbbzkkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdHVha2dudWR0aWlnYmJ6a2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Mzk1MTYsImV4cCI6MjA3MDMxNTUxNn0.xC6i5Kphk-H3pGUwFj0ko7_YZTguast3hK5fprsJfZI';

// Simple Supabase client setup
class SupabaseClient {
    constructor() {
        this.url = SUPABASE_URL;
        this.key = SUPABASE_ANON_KEY;
        this.headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
        };
    }

    async query(table, method = 'GET', data = null) {
        const url = `${this.url}/rest/v1/${table}`;
        const options = {
            method,
            headers: this.headers
        };
        
        if (data && (method === 'POST' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Supabase ${response.status} Error:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            // Handle empty responses (common with PATCH/DELETE)
            const text = await response.text();
            if (!text) return {}; // Return empty object for empty responses
            
            return JSON.parse(text);
        } catch (error) {
            console.error('Supabase query error:', error);
            return null;
        }
    }

    // Convenience methods
    async select(table, columns = '*') {
        return this.query(`${table}?select=${columns}`);
    }

    async insert(table, data) {
        return this.query(table, 'POST', data);
    }

    async update(table, data, id) {
        return this.query(`${table}?id=eq.${id}`, 'PATCH', data);
    }

    async delete(table, id) {
        return this.query(`${table}?id=eq.${id}`, 'DELETE');
    }
}

// Global instance (will be initialized after setup)
let supabase = null;

// Initialize function (called after configuration)
function initializeSupabase() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && 
        SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
        supabase = new SupabaseClient();
        window.supabase = supabase; // Set window.supabase AFTER creation
        console.log('✅ Supabase connected');
        return true;
    }
    console.log('📱 Using localStorage (Supabase not configured)');
    return false;
}

// Export for global use
window.supabase = null; // Start as null, will be set during initialization
window.initializeSupabase = initializeSupabase;