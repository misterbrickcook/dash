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
        this.sessionExpired = false; // Flag to prevent multiple logout attempts
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
            // Use the newer Supabase auth endpoint
            const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': this.key,
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.key}`
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    gotrue_meta_security: {}
                })
            });
            
            const data = await response.json();
            console.log('🔍 Authentication response received');
            
            if (!response.ok) {
                console.error('❌ HTTP Error:', response.status, response.statusText);
                return { user: null, session: null, error: data.error_description || data.msg || `HTTP ${response.status}` };
            }
            
            if (data.access_token && data.user) {
                const session = {
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    user: data.user
                };
                this.setSession(session);
                return { user: data.user, session, error: null };
            }
            
            return { user: null, session: null, error: data.error_description || data.error || 'Login failed' };
        } catch (error) {
            console.error('❌ Network error during authentication:', error.message || 'Connection failed');
            return { user: null, session: null, error: error.message || 'Network error' };
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
        this.sessionExpired = false; // Reset expiration flag
        
        // Update headers for authenticated requests
        this.headers.Authorization = `Bearer ${session.access_token}`;
        
        // Add timestamp for expiration check
        session.created_at = Date.now();
        
        // Store in localStorage
        localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        
    }
    
    clearSession() {
        this.session = null;
        this.user = null;
        this.headers.Authorization = `Bearer ${this.key}`;
        localStorage.removeItem('supabase.auth.token');
    }
    
    loadSession() {
        try {
            const stored = localStorage.getItem('supabase.auth.token');
            if (stored) {
                const session = JSON.parse(stored);
                
                // Check if session expired (24 hours)
                const sessionAge = Date.now() - (session.created_at || 0);
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                
                if (sessionAge > maxAge) {
                    localStorage.removeItem('supabase.auth.token');
                    return;
                }
                
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
        // If session already expired, don't make any more requests
        if (this.sessionExpired) {
            throw new Error('Session expired - page will reload');
        }
        
        
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
            
            // Check if token expired
            if (response.status === 401) {
                
                // Set flag to prevent further requests
                this.sessionExpired = true;
                this.clearSession();
                
                // Force immediate logout and reload (only once)
                setTimeout(() => {
                    // Clear only auth-related localStorage in pure cloud mode
                    localStorage.removeItem('supabase.auth.token');
                    
                    window.location.reload(); // Force page reload to show auth
                }, 100);
                
                throw new Error('Session expired - please login again');
            }
            
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
        // Use Prefer: return=representation header to get the inserted data back
        const url = `${this.url}/rest/v1/${table}?select=*`;
        const options = {
            method: 'POST',
            headers: {
                ...this.headers,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        };

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Supabase ${response.status} Error:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const text = await response.text();
            const result = text ? JSON.parse(text) : [];
            return result;
        } catch (error) {
            console.error('Insert error:', error);
            return null;
        }
    }

    async update(table, data, id) {
        return this.query(`${table}?id=eq.${id}`, 'PATCH', data);
    }

    async upsert(table, data, conflictColumns = ['id']) {
        // Use Prefer: resolution=merge-duplicates header for upsert behavior
        const url = `${this.url}/rest/v1/${table}?select=*`;
        const options = {
            method: 'POST',
            headers: {
                ...this.headers,
                'Prefer': 'return=representation,resolution=merge-duplicates'
            },
            body: JSON.stringify(data)
        };

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Supabase ${response.status} Error:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const text = await response.text();
            const result = text ? JSON.parse(text) : [];
            return result;
        } catch (error) {
            console.error('Upsert error:', error);
            return null;
        }
    }

    async delete(table, condition) {
        // Handle both ID and condition formats
        if (typeof condition === 'string' && condition.includes('=eq.')) {
            return this.query(`${table}?${condition}`, 'DELETE');
        } else {
            return this.query(`${table}?id=eq.${condition}`, 'DELETE');
        }
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
        return true;
    }
    return false;
}

// Export for global use
window.supabase = null; // Start as null, will be set during initialization
window.initializeSupabase = initializeSupabase;