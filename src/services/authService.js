import { supabase, isSupabaseConfigured } from '../lib/supabase';
<<<<<<< HEAD
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
=======

const AUTH_STORAGE_KEY = 'processly_authenticated_user';

export const authService = {
  /**
   * Authenticate user with Email or Employee ID and plain-text password from Supabase public.users
   */
  async login(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Please enter both Email/Employee ID and Password.');
    }

    const id = identifier.trim();

    if (!isSupabaseConfigured) {
      throw new Error('Supabase database connection is not configured in .env.');
    }

    // Query Supabase public.users table by email OR employee_id
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.${id},employee_id.ilike.${id}`);

    if (error) {
      console.error('Supabase users query error:', error);
      throw new Error(error.message || 'Database error occurred during login.');
    }

    if (!users || users.length === 0) {
      throw new Error('No account found with this Email or Employee ID.');
    }

    const userRecord = users[0];

    // Plain text password comparison
    if (userRecord.password !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    if (userRecord.is_active === false) {
      throw new Error('Your account has been deactivated. Please contact your system administrator.');
    }

    // Update last_login_at in Supabase
    try {
      await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          failed_login_attempts: 0
        })
        .eq('id', userRecord.id);
    } catch (err) {
      console.warn('Could not update last_login_at timestamp:', err);
    }

    // Normalize user session object for full app compatibility
    const sessionUser = {
      id: userRecord.id,
      employee_id: userRecord.employee_id,
      full_name: userRecord.full_name,
      name: userRecord.full_name,
      email: userRecord.email,
      phone: userRecord.phone,
      avatar_url: userRecord.avatar_url,
      department: userRecord.department,
      department_name: userRecord.department,
      designation: userRecord.designation,
      role: userRecord.role,
      allowed_systems: userRecord.allowed_systems || [],
      allowedModules: userRecord.allowed_systems || [],
      permissions: userRecord.permissions || {},
      is_active: userRecord.is_active,
      token_version: userRecord.token_version
    };

    // Store in localStorage for persistent session
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    localStorage.setItem('otd_current_user', JSON.stringify(sessionUser));
    localStorage.setItem('corporate_system_mock_user', JSON.stringify(sessionUser));

    return sessionUser;
  },

  /**
   * Get currently authenticated user from active session
   */
  async getCurrentUser() {
    const stored =
      localStorage.getItem(AUTH_STORAGE_KEY) ||
      localStorage.getItem('otd_current_user') ||
      localStorage.getItem('corporate_system_mock_user');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          // If Supabase is online, fetch latest profile from DB
          if (isSupabaseConfigured) {
            try {
              const { data: dbUser, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', parsed.id)
                .single();

              if (!error && dbUser && dbUser.is_active) {
                const refreshed = {
                  ...dbUser,
                  name: dbUser.full_name,
                  allowedModules: dbUser.allowed_systems || []
                };
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshed));
                localStorage.setItem('otd_current_user', JSON.stringify(refreshed));
                return refreshed;
              }
            } catch (err) {
              // Return parsed local session if offline
            }
>>>>>>> daf8de7 ( .gitignore update)
          }
          return parsed;
        }
      } catch (e) {
<<<<<<< HEAD
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
=======
        console.warn('Failed to parse user session:', e);
      }
    }

    return null;
  },

  /**
   * Sign out user and clear storage
   */
  async logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('otd_current_user');
    localStorage.removeItem('corporate_system_mock_user');
    localStorage.removeItem('taskflow_active_system');
  },

  /**
   * Update profile details in Supabase
   */
  async updateProfile(userId, updateData) {
    if (isSupabaseConfigured && userId) {
      const { data, error } = await supabase
        .from('users')
>>>>>>> daf8de7 ( .gitignore update)
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
<<<<<<< HEAD
      if (error) throw error;
      return data;
=======

      if (error) throw error;
      const updated = {
        ...data,
        name: data.full_name,
        allowedModules: data.allowed_systems || []
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem('otd_current_user', JSON.stringify(updated));
      return updated;
>>>>>>> daf8de7 ( .gitignore update)
    }

    const current = await this.getCurrentUser();
    const updated = { ...current, ...updateData };
<<<<<<< HEAD
    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(updated));
=======
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
>>>>>>> daf8de7 ( .gitignore update)
    return updated;
  }
};
