import { INITIAL_USERS } from './mockData';
<<<<<<< HEAD
=======
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { storageService } from './storageService';
>>>>>>> daf8de7 ( .gitignore update)

const LOCAL_USERS_KEY = 'corporate_system_users';

function getStoredUsers() {
  const stored = localStorage.getItem(LOCAL_USERS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_USERS;
  }
}

function saveStoredUsers(users) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export const userService = {
<<<<<<< HEAD
  async getUsers() {
    return getStoredUsers();
  },

  async createUser(userData) {
    const users = getStoredUsers();
    const newUser = {
      id: `usr-${Date.now()}`,
      employee_id: userData.employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: userData.full_name,
      email: userData.email,
      mobile: userData.mobile || '',
      role: userData.role || 'EMPLOYEE',
      department_id: userData.department_id || 'dept-ops',
      department_name: userData.department_name || 'Operations',
      designation: userData.designation || 'Associate',
      self_assign_enabled: userData.self_assign_enabled !== undefined ? userData.self_assign_enabled : true,
      is_active: true,
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      created_at: new Date().toISOString(),
    };

    users.unshift(newUser);
    saveStoredUsers(users);
    return newUser;
  },

  async updateUser(userId, updateData) {
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('User not found');

    users[index] = { ...users[index], ...updateData };
    saveStoredUsers(users);
    return users[index];
  },

  async deleteUser(userId) {
=======
  /**
   * Fetch all users from Supabase public.users (or fallback to local cache)
   */
  async getUsers() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('full_name', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          // Normalize fields for frontend components
          const normalized = data.map((u) => ({
            id: u.id,
            employee_id: u.employee_id,
            full_name: u.full_name,
            email: u.email,
            mobile: u.phone || u.mobile || '',
            role: u.role || 'EMPLOYEE',
            department_name: u.department || 'Operations',
            department_id: `dept-${(u.department || 'ops').toLowerCase().slice(0, 3)}`,
            designation: u.designation || 'Associate',
            is_active: u.is_active !== false,
            self_assign_enabled: u.permissions?.self_assign_enabled !== false,
            avatar_url: u.avatar_url || '',
            created_at: u.created_at,
          }));

          saveStoredUsers(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('Failed to fetch users from Supabase, using local cache:', err);
      }
    }

    return getStoredUsers();
  },

  /**
   * Create a new employee/user in Supabase and local cache
   */
  async createUser(userData) {
    let created = null;

    if (isSupabaseConfigured) {
      try {
        const empId =
          userData.employee_id || `EMP-${Math.floor(100 + Math.random() * 900)}`;

        const insertPayload = {
          employee_id: empId,
          full_name: userData.full_name,
          email: userData.email,
          phone: userData.mobile || userData.phone || '',
          role: userData.role || 'EMPLOYEE',
          department: userData.department_name || userData.department || 'Operations',
          designation: userData.designation || 'Associate',
          password: userData.password || 'User@123',
          avatar_url: userData.avatar_url || null,
          is_active: true,
          is_verified: true,
          allowed_systems: userData.allowed_systems || ['tasks', 'checklist'],
          permissions: {
            self_assign_enabled:
              userData.self_assign_enabled !== undefined ? userData.self_assign_enabled : true,
          },
        };

        const { data, error } = await supabase
          .from('users')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          console.warn('Supabase createUser error, will save locally:', error);
        } else if (data) {
          created = {
            id: data.id,
            employee_id: data.employee_id,
            full_name: data.full_name,
            email: data.email,
            mobile: data.phone,
            role: data.role,
            department_name: data.department,
            department_id: userData.department_id || 'dept-ops',
            designation: data.designation,
            self_assign_enabled: data.permissions?.self_assign_enabled !== false,
            is_active: data.is_active,
            avatar_url: data.avatar_url || '',
            created_at: data.created_at,
          };
        }
      } catch (e) {
        console.error('Failed to create user in Supabase:', e);
      }
    }

    if (!created) {
      created = {
        id: `usr-${Date.now()}`,
        employee_id: userData.employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        full_name: userData.full_name,
        email: userData.email,
        mobile: userData.mobile || '',
        role: userData.role || 'EMPLOYEE',
        department_id: userData.department_id || 'dept-ops',
        department_name: userData.department_name || 'Operations',
        designation: userData.designation || 'Associate',
        self_assign_enabled:
          userData.self_assign_enabled !== undefined ? userData.self_assign_enabled : true,
        is_active: true,
        avatar_url: userData.avatar_url || '',
        created_at: new Date().toISOString(),
      };
    }

    const users = getStoredUsers();
    users.unshift(created);
    saveStoredUsers(users);
    return created;
  },

  /**
   * Update user details in Supabase public.users and local cache
   */
  async updateUser(userId, updateData) {
    if (isSupabaseConfigured && userId) {
      try {
        const dbUpdates = {};
        if (updateData.full_name !== undefined) dbUpdates.full_name = updateData.full_name;
        if (updateData.email !== undefined) dbUpdates.email = updateData.email;
        if (updateData.mobile !== undefined) dbUpdates.phone = updateData.mobile;
        if (updateData.phone !== undefined) dbUpdates.phone = updateData.phone;
        if (updateData.role !== undefined) dbUpdates.role = updateData.role;
        if (updateData.department_name !== undefined) dbUpdates.department = updateData.department_name;
        if (updateData.department !== undefined) dbUpdates.department = updateData.department;
        if (updateData.designation !== undefined) dbUpdates.designation = updateData.designation;
        if (updateData.avatar_url !== undefined) dbUpdates.avatar_url = updateData.avatar_url;
        if (updateData.is_active !== undefined) dbUpdates.is_active = updateData.is_active;

        if (Object.keys(dbUpdates).length > 0) {
          dbUpdates.updated_at = new Date().toISOString();
          const { error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', userId);

          if (error) {
            console.warn('Supabase updateUser error:', error);
          }
        }
      } catch (err) {
        console.error('Failed to update user in Supabase:', err);
      }
    }

    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updateData };
      saveStoredUsers(users);
      return users[index];
    }
    return { id: userId, ...updateData };
  },

  /**
   * Upload profile image to 'Profile_Images' bucket and save avatar_url for user
   */
  async uploadUserAvatar(userId, file, isCurrentUser = false) {
    return storageService.updateUserAvatar(userId, file, isCurrentUser);
  },

  async deleteUser(userId) {
    if (isSupabaseConfigured && userId) {
      try {
        await supabase.from('users').delete().eq('id', userId);
      } catch (e) {
        console.warn('Supabase deleteUser error:', e);
      }
    }
>>>>>>> daf8de7 ( .gitignore update)
    const users = getStoredUsers();
    const filtered = users.filter((u) => u.id !== userId);
    saveStoredUsers(filtered);
  },

  async toggleSelfAssign(userId) {
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('User not found');

<<<<<<< HEAD
    users[index].self_assign_enabled = !users[index].self_assign_enabled;
    saveStoredUsers(users);
=======
    const nextVal = !users[index].self_assign_enabled;
    users[index].self_assign_enabled = nextVal;
    saveStoredUsers(users);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('users')
          .update({
            permissions: { self_assign_enabled: nextVal },
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } catch (e) {
        console.warn('Failed to update permissions in DB:', e);
      }
    }

>>>>>>> daf8de7 ( .gitignore update)
    return users[index];
  },

  async toggleUserStatus(userId) {
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === userId);
<<<<<<< HEAD
    if (index === -1) throw new Error('User not found');

    users[index].is_active = !users[index].is_active;
    saveStoredUsers(users);
=======
    let nextStatus = false;
    if (index !== -1) {
      nextStatus = !users[index].is_active;
      users[index].is_active = nextStatus;
      saveStoredUsers(users);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('users')
          .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (e) {
        console.warn('Failed to toggle status in DB:', e);
      }
    }

>>>>>>> daf8de7 ( .gitignore update)
    return users[index];
  },
};
