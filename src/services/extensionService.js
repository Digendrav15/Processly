import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_EXTENSIONS } from './mockData';

const LOCAL_EXTENSIONS_KEY = 'corporate_system_extensions';
const LOCAL_TASKS_KEY = 'corporate_system_tasks';
const LOCAL_HISTORY_KEY = 'corporate_system_history';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(val) {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

function getStoredExtensions() {
  const stored = localStorage.getItem(LOCAL_EXTENSIONS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_EXTENSIONS_KEY, JSON.stringify(INITIAL_EXTENSIONS));
    return INITIAL_EXTENSIONS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_EXTENSIONS;
  }
}

function saveStoredExtensions(extensions) {
  localStorage.setItem(LOCAL_EXTENSIONS_KEY, JSON.stringify(extensions));
}

export const extensionService = {
  async getExtensions() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('task_extension_requests')
          .select('*, tasks(task_code, title)')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const formatted = data.map((item) => ({
            ...item,
            task_code: item.tasks?.task_code || 'TSK-00',
            task_title: item.tasks?.title || 'Task Extension Request',
          }));
          saveStoredExtensions(formatted);
          return formatted;
        } else if (error) {
          console.warn('[extensionService] Supabase getExtensions warning:', error.message);
        }
      } catch (err) {
        console.warn('[extensionService] Supabase getExtensions failed, using local store:', err);
      }
    }

    return getStoredExtensions();
  },

  async requestExtension(requestData, currentUser) {
    const extensions = getStoredExtensions();

    const isTaskUUID = isValidUUID(requestData.task_id);
    const isUserUUID = isValidUUID(currentUser?.id);

    const baseRequest = {
      task_id: requestData.task_id,
      task_code: requestData.task_code || 'TSK-00',
      task_title: requestData.task_title || 'Task Extension Request',
      requested_by: currentUser?.id || 'usr-emp-1',
      requested_by_name: currentUser?.full_name || 'Team Member',
      current_due_date: new Date(requestData.current_due_date).toISOString(),
      requested_due_date: new Date(requestData.requested_due_date).toISOString(),
      reason: requestData.reason,
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    let inserted = null;

    if (isSupabaseConfigured && isTaskUUID && isUserUUID) {
      try {
        const { data, error } = await supabase
          .from('task_extension_requests')
          .insert([
            {
              task_id: requestData.task_id,
              requested_by: currentUser.id,
              current_due_date: baseRequest.current_due_date,
              requested_due_date: baseRequest.requested_due_date,
              reason: requestData.reason,
              status: 'Pending',
            },
          ])
          .select()
          .single();

        if (!error && data) {
          inserted = {
            ...baseRequest,
            id: data.id,
          };

          // Log in Supabase task_history
          await supabase.from('task_history').insert([
            {
              task_id: requestData.task_id,
              performed_by: currentUser.id,
              performed_by_name: currentUser.full_name,
              action: 'Extension Requested',
              details: `Requested new due date ${new Date(requestData.requested_due_date).toLocaleDateString()}. Reason: ${requestData.reason}`,
            },
          ]);
        }
      } catch (err) {
        console.warn('[extensionService] Supabase requestExtension error:', err);
      }
    }

    if (!inserted) {
      inserted = {
        id: `ext-${Date.now()}`,
        ...baseRequest,
      };

      // Save local history
      const history = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
      history.unshift({
        id: `hist-${Date.now()}`,
        task_id: requestData.task_id,
        performed_by_name: currentUser?.full_name || 'Team Member',
        action: 'Extension Requested',
        details: `Requested new due date ${new Date(requestData.requested_due_date).toLocaleDateString()}. Reason: ${requestData.reason}`,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
    }

    extensions.unshift(inserted);
    saveStoredExtensions(extensions);

    return inserted;
  },

  async reviewExtension(extensionId, status, reviewRemarks, managerUser) {
    const extensions = getStoredExtensions();
    const index = extensions.findIndex((e) => e.id === extensionId);
    const ext = index !== -1 ? extensions[index] : null;

    if (isSupabaseConfigured && isValidUUID(extensionId)) {
      try {
        const updatePayload = {
          status,
          reviewed_by: isValidUUID(managerUser?.id) ? managerUser.id : null,
          reviewed_at: new Date().toISOString(),
          review_remarks: reviewRemarks || '',
        };

        await supabase
          .from('task_extension_requests')
          .update(updatePayload)
          .eq('id', extensionId);

        if (status === 'Approved' && ext && isValidUUID(ext.task_id)) {
          await supabase
            .from('tasks')
            .update({
              due_date: ext.requested_due_date,
              updated_at: new Date().toISOString(),
            })
            .eq('id', ext.task_id);
        }

        if (ext && isValidUUID(ext.task_id)) {
          await supabase.from('task_history').insert([
            {
              task_id: ext.task_id,
              performed_by: isValidUUID(managerUser?.id) ? managerUser.id : null,
              performed_by_name: managerUser?.full_name || 'Manager',
              action: `Extension ${status}`,
              details: `${status} by ${managerUser?.full_name || 'Manager'}. ${reviewRemarks ? `Remarks: ${reviewRemarks}` : ''}`,
            },
          ]);
        }
      } catch (err) {
        console.warn('[extensionService] Supabase reviewExtension error:', err);
      }
    }

    if (ext) {
      ext.status = status;
      ext.reviewed_by = managerUser?.id;
      ext.reviewed_by_name = managerUser?.full_name;
      ext.reviewed_at = new Date().toISOString();
      ext.review_remarks = reviewRemarks || '';

      extensions[index] = ext;
      saveStoredExtensions(extensions);

      // If approved, update current due date on task
      if (status === 'Approved') {
        const tasks = JSON.parse(localStorage.getItem(LOCAL_TASKS_KEY) || '[]');
        const taskIndex = tasks.findIndex((t) => t.id === ext.task_id);
        if (taskIndex !== -1) {
          tasks[taskIndex].due_date = ext.requested_due_date;
          if (tasks[taskIndex].status === 'Overdue') {
            tasks[taskIndex].status = 'In Progress';
          }
          localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
        }
      }

      // Save local history
      const history = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
      history.unshift({
        id: `hist-${Date.now()}`,
        task_id: ext.task_id,
        performed_by_name: managerUser?.full_name || 'Manager',
        action: `Extension ${status}`,
        details: `${status} by ${managerUser?.full_name || 'Manager'}. ${reviewRemarks ? `Remarks: ${reviewRemarks}` : ''}`,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));

      return ext;
    }

    throw new Error('Extension request not found');
  },
};
