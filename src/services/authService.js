import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_USERS } from './mockData';

// Local storage key for persistent mock user session
const MOCK_AUTH_KEY = 'corporate_system_mock_user';

export const authService = {
  async getCurrentUser() {
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          return profile || session.user;
        }
      } catch (err) {
        console.warn('Supabase session fetch error, using local fallback:', err);
      }
    }

    // Local Mock Fallback
    const stored = localStorage.getItem(MOCK_AUTH_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed) {
          const isAdmin = parsed.role === 'ADMIN' || parsed.userGroup === 'Admin';
          let modified = false;
          if (isAdmin && Array.isArray(parsed.allowedModules)) {
            if (!parsed.allowedModules.includes('petty-expenses')) {
              parsed.allowedModules.push('petty-expenses');
              modified = true;
            }
            if (!parsed.allowedModules.includes('doc-subscription')) {
              parsed.allowedModules.push('doc-subscription');
              modified = true;
            }
            if (!parsed.allowedModules.includes('whatsapp')) {
              parsed.allowedModules.push('whatsapp');
              modified = true;
            }
          }
          if (modified) {
            localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch (e) {
        // invalid JSON
      }
    }

    // Default demo user: Admin
    const defaultUser = INITIAL_USERS[0];
    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  },

  async login(email, password) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      return profile;
    }

    // Local Mock Fallback
    const user = INITIAL_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new Error('Invalid email or password. Try admin@corporate.com, manager@corporate.com, or employee@corporate.com');
    }

    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(user));
    return user;
  },

  async signup(userData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role || 'EMPLOYEE',
          },
        },
      });
      if (error) throw error;
      return data;
    }

    // Local Mock Signup
    const newUser = {
      id: `usr-${Date.now()}`,
      employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role || 'EMPLOYEE',
      department_name: userData.department_name || 'Operations',
      designation: userData.designation || 'Associate',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async logout() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(MOCK_AUTH_KEY);
  },

  async switchDemoRole(role) {
    const targetUser = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(targetUser));
    return targetUser;
  },

  async updateProfile(userId, updateData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const current = await this.getCurrentUser();
    const updated = { ...current, ...updateData };
    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(updated));
    return updated;
  }
};
