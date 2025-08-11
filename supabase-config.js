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
        this.user = null;
        this.session = null;
        this.headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
        };
        
        // Load stored session
        this.loadSession();
    }
    
    // === AUTHENTICATION METHODS ===
    
    async signUp(email, password) {
        try {
            const response = await fetch(`${this.url}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': this.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            
            const data = await response.json();
            
            if (data.user && data.session) {
                this.setSession(data.session);
                return { user: data.user, session: data.session, error: null };
            }
            
            return { user: null, session: null, error: data.error || 'Signup failed' };
        } catch (error) {
            return { user: null, session: null, error: error.message };
        }
    }
    
    async signIn(email, password) {
        try {
            const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': this.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            
            const data = await response.json();
            
            if (data.access_token) {
                const session = {
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    user: data.user
                };
                this.setSession(session);
                return { user: data.user, session, error: null };
            }
            
            return { user: null, session: null, error: data.error_description || 'Login failed' };
        } catch (error) {
            return { user: null, session: null, error: error.message };
        }
    }
    
    async signOut() {
        try {
            if (this.session?.access_token) {
                await fetch(`${this.url}/auth/v1/logout`, {
                    method: 'POST',
                    headers: {
                        'apikey': this.key,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.session.access_token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.clearSession();
        return { error: null };
    }
    
    setSession(session) {
        this.session = session;
        this.user = session.user;
        
        // Update headers for authenticated requests
        this.headers.Authorization = `Bearer ${session.access_token}`;
        
        // Store in localStorage
        localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        
        console.log('✅ User authenticated:', this.user.email);
    }
    
    clearSession() {
        this.session = null;
        this.user = null;
        this.headers.Authorization = `Bearer ${this.key}`;
        localStorage.removeItem('supabase.auth.token');
        console.log('🚪 User signed out');
    }
    
    loadSession() {
        try {
            const stored = localStorage.getItem('supabase.auth.token');
            if (stored) {
                const session = JSON.parse(stored);
                // Check if session is still valid (basic check)
                if (session.access_token && session.user) {
                    this.setSession(session);
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
            localStorage.removeItem('supabase.auth.token');
        }
    }
    
    getCurrentUser() {
        return this.user;
    }
    
    isAuthenticated() {
        return !!(this.user && this.session);
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