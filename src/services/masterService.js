import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEPARTMENTS, DESIGNATIONS, FREQUENCIES, TASK_PRIORITY, TASK_STATUS } from '../config/constants';

const LOCAL_MASTERS_KEY = 'corporate_system_masters';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(val) {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

function getStoredMasters() {
  const stored = localStorage.getItem(LOCAL_MASTERS_KEY);
  if (!stored) {
    const initial = {
      departments: DEPARTMENTS,
      designations: DESIGNATIONS,
      frequencies: FREQUENCIES,
      priorities: Object.values(TASK_PRIORITY),
      statuses: Object.values(TASK_STATUS),
    };
    localStorage.setItem(LOCAL_MASTERS_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return {
      departments: DEPARTMENTS,
      designations: DESIGNATIONS,
      frequencies: FREQUENCIES,
      priorities: Object.values(TASK_PRIORITY),
      statuses: Object.values(TASK_STATUS),
    };
  }
}

function saveMasters(data) {
  localStorage.setItem(LOCAL_MASTERS_KEY, JSON.stringify(data));
}

export const masterService = {
  async getMasters() {
    const masters = getStoredMasters();

    if (isSupabaseConfigured) {
      try {
        const { data: dbDepts, error } = await supabase
          .from('departments')
          .select('*')
          .order('name', { ascending: true });

        if (!error && Array.isArray(dbDepts) && dbDepts.length > 0) {
          masters.departments = dbDepts;
          saveMasters(masters);
        }
      } catch (err) {
        console.warn('[masterService] Supabase getDepartments error:', err);
      }
    }

    return masters;
  },

  async addDepartment(name, code) {
    const masters = getStoredMasters();
    let newDept = null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('departments')
          .insert([
            {
              code: code.toUpperCase(),
              name,
              status: 'Active',
            },
          ])
          .select()
          .single();

        if (!error && data) {
          newDept = data;
        }
      } catch (err) {
        console.warn('[masterService] Supabase addDepartment error:', err);
      }
    }

    if (!newDept) {
      newDept = {
        id: `dept-${Date.now()}`,
        code: code.toUpperCase(),
        name,
        status: 'Active',
      };
    }

    masters.departments.push(newDept);
    saveMasters(masters);
    return newDept;
  },

  async updateDepartment(id, name, code) {
    const masters = getStoredMasters();

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase
          .from('departments')
          .update({
            name,
            code: code.toUpperCase(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('[masterService] Supabase updateDepartment error:', err);
      }
    }

    const index = masters.departments.findIndex((d) => d.id === id);
    if (index !== -1) {
      masters.departments[index] = {
        ...masters.departments[index],
        name,
        code: code.toUpperCase(),
      };
      saveMasters(masters);
      return masters.departments[index];
    }

    return { id, name, code: code.toUpperCase() };
  },

  async deleteDepartment(id) {
    const masters = getStoredMasters();

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase
          .from('departments')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('[masterService] Supabase deleteDepartment error:', err);
      }
    }

    masters.departments = masters.departments.filter((d) => d.id !== id);
    saveMasters(masters);
  },

  async addDesignation(title, deptId) {
    const masters = getStoredMasters();
    const newDesig = {
      id: `desig-${Date.now()}`,
      title,
      deptId,
      status: 'Active',
    };
    masters.designations.push(newDesig);
    saveMasters(masters);
    return newDesig;
  },

  async updateDesignation(id, title, deptId) {
    const masters = getStoredMasters();
    const index = masters.designations.findIndex((des) => des.id === id);
    if (index === -1) throw new Error('Designation not found');

    masters.designations[index] = {
      ...masters.designations[index],
      title,
      deptId,
    };
    saveMasters(masters);
    return masters.designations[index];
  },

  async deleteDesignation(id) {
    const masters = getStoredMasters();
    masters.designations = masters.designations.filter((des) => des.id !== id);
    saveMasters(masters);
  },
};
