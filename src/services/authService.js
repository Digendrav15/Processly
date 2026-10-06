import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
          }
          return parsed;
        }
      } catch (e) {
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
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      const updated = {
        ...data,
        name: data.full_name,
        allowedModules: data.allowed_systems || []
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem('otd_current_user', JSON.stringify(updated));
      return updated;
    }

    const current = await this.getCurrentUser();
    const updated = { ...current, ...updateData };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
};
