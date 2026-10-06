import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_TASKS, INITIAL_CHECKLISTS, INITIAL_HISTORY, INITIAL_USERS } from './mockData';
import { notificationService } from './notificationService';
import { holidayService } from './holidayService';
import { workingCalendarService } from './workingCalendarService';

const LOCAL_TASKS_KEY = 'corporate_system_tasks';
const LOCAL_CHECKLISTS_KEY = 'corporate_system_checklists';
const LOCAL_HISTORY_KEY = 'corporate_system_history';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(val) {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

function getStoredTasks() {
  const stored = localStorage.getItem(LOCAL_TASKS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(INITIAL_TASKS));
    return INITIAL_TASKS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_TASKS;
  }
}

function saveStoredTasks(tasks) {
  localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
}

function getStoredChecklists() {
  const stored = localStorage.getItem(LOCAL_CHECKLISTS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_CHECKLISTS_KEY, JSON.stringify(INITIAL_CHECKLISTS));
    return INITIAL_CHECKLISTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_CHECKLISTS;
  }
}

function saveStoredChecklists(checklists) {
  localStorage.setItem(LOCAL_CHECKLISTS_KEY, JSON.stringify(checklists));
}

function getStoredHistory() {
  const stored = localStorage.getItem(LOCAL_HISTORY_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(INITIAL_HISTORY));
    return INITIAL_HISTORY;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_HISTORY;
  }
}

function saveLocalHistory(event) {
  const history = getStoredHistory();
  const newRecord = {
    id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...event,
    created_at: new Date().toISOString(),
  };
  history.unshift(newRecord);
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
  return newRecord;
}

export const taskService = {
  // Fetch tasks with dynamic overdue check, holiday filtering & Supabase sync
  async getTasks(filters = {}) {
    let tasks = [];
    let fetchedFromDb = false;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          tasks = data;
          fetchedFromDb = true;
          // Keep local cache in sync
          saveStoredTasks(tasks);
        } else if (error) {
          console.warn('[taskService] Supabase getTasks warning:', error.message);
        }
      } catch (err) {
        console.warn('[taskService] Supabase getTasks failed, using local cache:', err);
      }
    }

    if (!fetchedFromDb) {
      tasks = getStoredTasks();
    }

    // Auto-overdue status check
    const now = new Date();
    const overdueIds = [];
    tasks = tasks.map((t) => {
      if ((t.status === 'Pending' || t.status === 'In Progress') && new Date(t.due_date) < now) {
        if (isValidUUID(t.id)) overdueIds.push(t.id);
        return { ...t, status: 'Overdue' };
      }
      return t;
    });

    // Sync overdue statuses to Supabase if any
    if (isSupabaseConfigured && overdueIds.length > 0) {
      supabase
        .from('tasks')
        .update({ status: 'Overdue' })
        .in('id', overdueIds)
        .then(() => {})
        .catch(() => {});
    }

    saveStoredTasks(tasks);

    // Suppress or flag tasks on Holidays & Week Offs
    if (filters.hideHolidays || filters.hideWeekOffs) {
      tasks = tasks.filter(
        (t) =>
          !holidayService.isHolidayDate(t.due_date) &&
          !workingCalendarService.isWeekOffDate(t.due_date)
      );
    }

    // Filter by User Scope
    if (filters.user) {
      const { role, id, department_name } = filters.user;
      if (role === 'EMPLOYEE') {
        tasks = tasks.filter((t) => t.assigned_to === id);
      } else if (role === 'MANAGER') {
        tasks = tasks.filter(
          (t) => t.department_name === department_name || t.assigned_by === id || t.assigned_to === id
        );
      }
    }

    // Filter by Search Query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(query)) ||
          (t.task_code && t.task_code.toLowerCase().includes(query)) ||
          (t.assigned_to_name && t.assigned_to_name.toLowerCase().includes(query)) ||
          (t.assigned_by_name && t.assigned_by_name.toLowerCase().includes(query))
      );
    }

    // Filter by Status
    if (filters.status && filters.status !== 'All') {
      tasks = tasks.filter((t) => t.status === filters.status);
    }

    // Filter by Priority
    if (filters.priority && filters.priority !== 'All') {
      tasks = tasks.filter((t) => t.priority === filters.priority);
    }

    // Filter by Task Type (unique vs checklist vs delegation)
    if (filters.taskType && filters.taskType !== 'All') {
      const typeLower = filters.taskType.toLowerCase();
      if (typeLower === 'unique') {
        tasks = tasks.filter(
          (t) =>
            t.type === 'unique' ||
            (t.type !== 'checklist' &&
              (t.task_code?.startsWith('UNQ-') ||
                (t.frequency === 'One Time' && t.assigned_by === t.assigned_to) ||
                (!t.type && t.frequency === 'One Time')))
        );
      } else if (typeLower === 'checklist') {
        tasks = tasks.filter(
          (t) =>
            t.type === 'checklist' ||
            t.task_code?.startsWith('TSK-') ||
            (t.frequency && t.frequency !== 'One Time')
        );
      } else if (typeLower === 'delegation') {
        tasks = tasks.filter(
          (t) =>
            t.type === 'delegation' ||
            t.task_code?.startsWith('DEL-') ||
            (t.frequency === 'One Time' && t.assigned_by !== t.assigned_to)
        );
      } else {
        tasks = tasks.filter((t) => t.type === filters.taskType);
      }
    }

    // Filter by Frequency
    if (filters.frequency && filters.frequency !== 'All') {
      tasks = tasks.filter((t) => t.frequency === filters.frequency);
    }

    // Filter by Department
    if (filters.department && filters.department !== 'All') {
      tasks = tasks.filter((t) => t.department_name === filters.department);
    }

    // Filter by Doer
    if (filters.doerId && filters.doerId !== 'All') {
      tasks = tasks.filter((t) => t.assigned_to === filters.doerId);
    }

    return tasks;
  },

  async getTaskById(id) {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .single();

        if (!taskError && task) {
          const { data: history } = await supabase
            .from('task_history')
            .select('*')
            .eq('task_id', id)
            .order('created_at', { ascending: false });

          const { data: comments } = await supabase
            .from('task_comments')
            .select('*')
            .eq('task_id', id)
            .order('created_at', { ascending: true });

          return {
            ...task,
            history: history || [],
            comments: comments || [],
          };
        }
      } catch (err) {
        console.warn('[taskService] getTaskById Supabase failed, falling back:', err);
      }
    }

    // Local fallback
    const tasks = getStoredTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');

    const history = getStoredHistory().filter((h) => h.task_id === id);
    return { ...task, history };
  },

  // Multi-Doer Task Assignment Engine
  async createTaskAssignment(formData, currentUser) {
    const isOneTime = formData.frequency === 'One Time';
    const doers = formData.doers || []; // array of { id, name }
    const createdTasks = [];
    const localTasks = getStoredTasks();

    for (const doer of doers) {
      const isSelf = currentUser && (doer.id === currentUser.id || doer.id === currentUser.employee_id);
      const taskType = formData.taskType || (isOneTime ? (isSelf ? 'unique' : 'delegation') : 'checklist');
      const taskCode = taskType === 'unique'
        ? `UNQ-2026-${Math.floor(100 + Math.random() * 900)}`
        : taskType === 'delegation'
        ? `DEL-2026-${Math.floor(100 + Math.random() * 900)}`
        : `TSK-CHK-${Math.floor(1000 + Math.random() * 9000)}`;

      const assignedByUUID = isValidUUID(currentUser?.id) ? currentUser.id : null;
      const assignedToUUID = isValidUUID(doer.id) ? doer.id : null;
      const departmentUUID = isValidUUID(formData.department_id) ? formData.department_id : null;
      const checklistUUID = isValidUUID(formData.checklist_id) ? formData.checklist_id : null;

      // Validate Planned Date with Working Day Calendar Engine
      const rawDueDate = formData.due_date ? new Date(formData.due_date).toISOString() : new Date(Date.now() + 86400000).toISOString();
      const dateValidation = workingCalendarService.validatePlannedDate(rawDueDate);

      if (dateValidation.isMissing) {
        workingCalendarService.triggerWorkingDateMissingPopup(dateValidation.info);
        throw new Error(
          `Working Date Missing: Planned date ${dateValidation.info.date} (${dateValidation.info.dayDDD}, ${dateValidation.info.weekNo}) exceeds Working Day Calendar boundary (${dateValidation.info.endDate}).`
        );
      }

      // Rollover from Week Off (e.g. Sunday) to Next Working Day (Monday)
      const finalDueDate = dateValidation.wasAdjusted
        ? new Date(dateValidation.adjustedDate).toISOString()
        : rawDueDate;

      const baseTaskData = {
        task_code: taskCode,
        type: taskType,
        checklist_id: checklistUUID,
        title: formData.title,
        description: formData.description || '',
        department_id: departmentUUID,
        department_name: formData.department_name || 'Operations',
        assigned_by: assignedByUUID || currentUser?.id || 'usr-admin-1',
        assigned_by_name: currentUser?.full_name || 'Administrator',
        assigned_to: assignedToUUID || doer.id || 'usr-emp-1',
        assigned_to_name: doer.name || 'Team Member',
        priority: formData.priority || 'Medium',
        frequency: formData.frequency || (isOneTime ? 'One Time' : 'Daily'),
        start_date: formData.start_date || new Date().toISOString().split('T')[0],
        due_date: finalDueDate,
        original_due_date: finalDueDate,
        status: 'Pending',
        required_attachment: Boolean(formData.required_attachment),
        reminder_enabled: Boolean(formData.reminder_enabled ?? true),
        completion_date: null,
        completion_remarks: '',
        proof_image_url: null,
        proof_doc_url: formData.attachment_url || null,
        items_completed: formData.items || [],
      };

      let insertedTask = null;

      // Attempt Supabase insert if credentials configured and UUIDs are valid
      if (isSupabaseConfigured && assignedByUUID && assignedToUUID) {
        try {
          const dbPayload = {
            ...baseTaskData,
            assigned_by: assignedByUUID,
            assigned_to: assignedToUUID,
          };
          const { data, error } = await supabase
            .from('tasks')
            .insert([dbPayload])
            .select()
            .single();

          if (!error && data) {
            insertedTask = data;

            // Log to Supabase task_history
            await supabase.from('task_history').insert([
              {
                task_id: data.id,
                performed_by: assignedByUUID,
                performed_by_name: currentUser.full_name,
                action: 'Task Assigned',
                details: `Task assigned to ${doer.name} (Frequency: ${formData.frequency || 'One Time'}) due on ${new Date(
                  formData.due_date || Date.now() + 86400000
                ).toLocaleDateString()}`,
              },
            ]);
          } else if (error) {
            console.warn('[taskService] Supabase tasks insert warning:', error.message);
          }
        } catch (dbErr) {
          console.warn('[taskService] Supabase insert failed, falling back:', dbErr);
        }
      }

      // Local storage fallback if Supabase not used or error occurred
      if (!insertedTask) {
        insertedTask = {
          id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ...baseTaskData,
          created_at: new Date().toISOString(),
        };

        saveLocalHistory({
          task_id: insertedTask.id,
          performed_by_name: currentUser?.full_name || 'System Admin',
          action: 'Task Assigned',
          details: `Task assigned to ${doer.name} (Frequency: ${formData.frequency || 'One Time'}) due on ${new Date(
            formData.due_date || Date.now() + 86400000
          ).toLocaleDateString()}`,
        });
      }

      localTasks.unshift(insertedTask);
      createdTasks.push(insertedTask);

      // Trigger realtime notification
      notificationService.notifyTaskAssigned({
        doerId: doer.id,
        taskTitle: insertedTask.title,
        assignedByName: currentUser?.full_name || 'Administrator',
      });
    }

    saveStoredTasks(localTasks);
    return createdTasks;
  },

  // Create single delegation helper
  async createDelegation(formData, currentUser) {
    const doer = {
      id: formData.assigned_to,
      name: formData.assigned_to_name || 'Assigned User',
    };

    const tasks = await this.createTaskAssignment(
      {
        ...formData,
        frequency: 'One Time',
        doers: [doer],
        reminder_enabled: formData.reminder_setting ?? true,
      },
      currentUser
    );

    return tasks[0];
  },

  // Checklist Masters & Recurrence Template Management
  async createChecklist(formData, currentUser) {
    const checklistCode = `CHK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const departmentUUID = isValidUUID(formData.department_id) ? formData.department_id : null;
    const assignedByUUID = isValidUUID(currentUser?.id) ? currentUser.id : null;
    const assignedToUUID = isValidUUID(formData.assigned_to) ? formData.assigned_to : null;

    const baseChecklist = {
      checklist_code: checklistCode,
      title: formData.title,
      description: formData.description || '',
      department_id: departmentUUID,
      department_name: formData.department_name || 'Operations',
      assigned_by: assignedByUUID,
      assigned_to: assignedToUUID,
      priority: formData.priority || 'Medium',
      frequency: formData.frequency || 'Daily',
      start_date: formData.start_date || new Date().toISOString().split('T')[0],
      end_date: formData.end_date || null,
      reminder_status: formData.reminder_status !== false,
      attachment_url: formData.attachment_url || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let createdChecklist = null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('checklists')
          .insert([baseChecklist])
          .select()
          .single();

        if (!error && data) {
          createdChecklist = data;

          // Insert verification checklist items if provided
          if (Array.isArray(formData.items) && formData.items.length > 0) {
            const itemsToInsert = formData.items.map((item, index) => ({
              checklist_id: data.id,
              item_title: typeof item === 'string' ? item : item.item_title || item.title || 'Task Step',
              order_index: index,
              is_required: typeof item === 'object' && item.is_required !== undefined ? item.is_required : true,
            }));

            const { data: insertedItems, error: itemsError } = await supabase
              .from('checklist_items')
              .insert(itemsToInsert)
              .select();

            if (!itemsError && insertedItems) {
              createdChecklist.items = insertedItems;
            }
          }
        } else if (error) {
          console.warn('[taskService] Supabase createChecklist warning:', error.message);
        }
      } catch (err) {
        console.warn('[taskService] Supabase createChecklist failed, using local storage:', err);
      }
    }

    if (!createdChecklist) {
      createdChecklist = {
        id: `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...baseChecklist,
        assigned_to_name: formData.assigned_to_name || 'Assigned User',
        items: (formData.items || []).map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          item_title: typeof it === 'string' ? it : it.item_title || it.title || 'Step',
          order_index: idx,
          is_required: true,
        })),
      };
    }

    // Keep local stored checklists updated
    const localChecklists = getStoredChecklists();
    localChecklists.unshift(createdChecklist);
    saveStoredChecklists(localChecklists);

    return createdChecklist;
  },

  async getChecklists() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('checklists')
          .select('*, items:checklist_items(*)')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Sort items by order_index
          const formatted = data.map((chk) => ({
            ...chk,
            items: Array.isArray(chk.items)
              ? chk.items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
              : [],
          }));
          saveStoredChecklists(formatted);
          return formatted;
        } else if (error) {
          console.warn('[taskService] Supabase getChecklists warning:', error.message);
        }
      } catch (err) {
        console.warn('[taskService] Supabase getChecklists fallback:', err);
      }
    }

    return getStoredChecklists();
  },

  async updateTask(taskId, updateData, currentUser) {
    if (updateData.due_date) {
      const rawDueDate = new Date(updateData.due_date).toISOString();
      const dateValidation = workingCalendarService.validatePlannedDate(rawDueDate);
      if (dateValidation.isMissing) {
        workingCalendarService.triggerWorkingDateMissingPopup(dateValidation.info);
        throw new Error(
          `Working Date Missing: Planned date ${dateValidation.info.date} (${dateValidation.info.dayDDD}, ${dateValidation.info.weekNo}) exceeds Working Day Calendar boundary (${dateValidation.info.endDate}).`
        );
      }
      if (dateValidation.wasAdjusted) {
        updateData.due_date = new Date(dateValidation.adjustedDate).toISOString();
      }
    }

    const localTasks = getStoredTasks();
    const index = localTasks.findIndex((t) => t.id === taskId);
    const oldTask = index !== -1 ? localTasks[index] : null;

    let taskType = updateData.type || oldTask?.type;
    if (!taskType && updateData.frequency) {
      taskType = updateData.frequency === 'One Time' ? 'unique' : 'checklist';
    }

    const payloadToUpdate = {
      ...updateData,
      type: taskType || updateData.type,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && isValidUUID(taskId)) {
      try {
        await supabase
          .from('tasks')
          .update(payloadToUpdate)
          .eq('id', taskId);

        await supabase.from('task_history').insert([
          {
            task_id: taskId,
            performed_by: isValidUUID(currentUser?.id) ? currentUser.id : null,
            performed_by_name: currentUser?.full_name || 'System User',
            action: 'Task Details Updated',
            details: `Task details edited by ${currentUser?.full_name || 'System User'}`,
          },
        ]);
      } catch (err) {
        console.warn('[taskService] Supabase updateTask error:', err);
      }
    }

    if (index !== -1) {
      const updated = { ...oldTask, ...payloadToUpdate };
      localTasks[index] = updated;
      saveStoredTasks(localTasks);

      saveLocalHistory({
        task_id: taskId,
        performed_by_name: currentUser?.full_name || 'System User',
        action: 'Task Details Updated',
        details: `Task details edited by ${currentUser?.full_name || 'System User'}`,
      });

      // Notify Doer
      if (updated.assigned_to) {
        notificationService.notifyTaskEdited({
          doerId: updated.assigned_to,
          taskTitle: updated.title,
          editedByName: currentUser?.full_name || 'Manager',
        });
      }

      return updated;
    }

    return payloadToUpdate;
  },

  async deleteTask(taskId, currentUser) {
    if (isSupabaseConfigured && isValidUUID(taskId)) {
      try {
        await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);
      } catch (err) {
        console.warn('[taskService] Supabase deleteTask error:', err);
      }
    }

    const tasks = getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    const filtered = tasks.filter((t) => t.id !== taskId);
    saveStoredTasks(filtered);

    saveLocalHistory({
      task_id: taskId,
      performed_by_name: currentUser?.full_name || 'System User',
      action: 'Task Deleted',
      details: `Task ${task?.task_code || taskId} deleted by ${currentUser?.full_name || 'System User'}`,
    });

    if (task?.assigned_to) {
      notificationService.notifyTaskDeleted({
        doerId: task.assigned_to,
        taskTitle: task.title,
        deletedByName: currentUser?.full_name || 'System User',
      });
    }
  },

  async updateTaskStatus(taskId, newStatus, payload = {}, currentUser) {
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'Completed' || newStatus === 'Not Done') {
      updateData.completion_date = new Date().toISOString();
      updateData.completion_remarks = payload.remarks || '';
      if (payload.attachment_url) updateData.proof_doc_url = payload.attachment_url;
      if (payload.proof_image_url) updateData.proof_image_url = payload.proof_image_url;
      if (payload.proof_doc_url) updateData.proof_doc_url = payload.proof_doc_url;
      if (payload.items_completed) updateData.items_completed = payload.items_completed;
    }

    if (isSupabaseConfigured && isValidUUID(taskId)) {
      try {
        await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', taskId);

        await supabase.from('task_history').insert([
          {
            task_id: taskId,
            performed_by: isValidUUID(currentUser?.id) ? currentUser.id : null,
            performed_by_name: currentUser ? currentUser.full_name : 'System User',
            action: `Status Updated to ${newStatus}`,
            details: `Status changed to ${newStatus}. Remarks: ${payload.remarks || 'None'}`,
          },
        ]);
      } catch (err) {
        console.warn('[taskService] Supabase updateTaskStatus error:', err);
      }
    }

    const tasks = getStoredTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    let oldTask = {};

    if (taskIndex !== -1) {
      oldTask = tasks[taskIndex];
      tasks[taskIndex] = { ...oldTask, ...updateData };
      saveStoredTasks(tasks);
    }

    saveLocalHistory({
      task_id: taskId,
      performed_by_name: currentUser ? currentUser.full_name : 'System User',
      action: `Status Updated to ${newStatus}`,
      details: `Status changed from ${oldTask.status || 'Pending'} to ${newStatus}. Remarks: ${payload.remarks || 'None'}`,
    });

    if (newStatus === 'Completed') {
      notificationService.notifyTaskCompleted({
        managerId: oldTask.assigned_by,
        taskTitle: oldTask.title,
        doerName: currentUser ? currentUser.full_name : oldTask.assigned_to_name,
      });
    }

    return taskIndex !== -1 ? tasks[taskIndex] : updateData;
  },

  async addTaskComment(taskId, commentText, currentUser) {
    if (!commentText || !commentText.trim()) return;

    if (isSupabaseConfigured && isValidUUID(taskId) && isValidUUID(currentUser?.id)) {
      try {
        await supabase.from('task_comments').insert([
          {
            task_id: taskId,
            user_id: currentUser.id,
            comment_text: commentText.trim(),
          },
        ]);
      } catch (err) {
        console.warn('[taskService] Supabase addTaskComment error:', err);
      }
    }

    saveLocalHistory({
      task_id: taskId,
      performed_by_name: currentUser?.full_name || 'System User',
      action: 'Comment Added',
      details: commentText.trim(),
    });
  },

  // Leave Delegation / Task Transfer Engine
  async transferTasks({ fromUserId, toUserId, startDate, endDate, reason }, currentUser) {
    const tasks = getStoredTasks();
    const fromUser = INITIAL_USERS.find((u) => u.id === fromUserId) || { full_name: 'Employee' };
    const toUser = INITIAL_USERS.find((u) => u.id === toUserId) || { full_name: 'Substitute' };

    if (fromUserId === toUserId) throw new Error('Cannot transfer tasks to the same user');

    const start = startDate ? new Date(startDate) : new Date('1970-01-01');
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date('2099-12-31');

    let transferredCount = 0;

    const updatedTasks = tasks.map((task) => {
      if (
        task.assigned_to === fromUserId &&
        task.status !== 'Completed' &&
        task.status !== 'Not Done'
      ) {
        const taskDueDate = new Date(task.due_date);
        if (taskDueDate >= start && taskDueDate <= end) {
          transferredCount++;

          saveLocalHistory({
            task_id: task.id,
            performed_by_name: currentUser ? currentUser.full_name : 'System Admin',
            action: 'Task Transferred (Leave Delegation)',
            details: `Transferred from ${fromUser.full_name} to ${toUser.full_name} due to leave (${startDate || 'Any'} to ${endDate || 'Any'}). Reason: ${reason || 'On Leave'}`,
          });

          if (isSupabaseConfigured && isValidUUID(task.id) && isValidUUID(toUserId)) {
            supabase
              .from('tasks')
              .update({
                assigned_to: toUserId,
                assigned_to_name: toUser.full_name,
                updated_at: new Date().toISOString(),
              })
              .eq('id', task.id)
              .then(() => {});
          }

          return {
            ...task,
            assigned_to: toUserId,
            assigned_to_name: toUser.full_name,
            transferred_from: fromUserId,
            transferred_from_name: fromUser.full_name,
            transfer_reason: reason || 'Leave Delegation',
            updated_at: new Date().toISOString(),
          };
        }
      }
      return task;
    });

    if (transferredCount === 0) {
      throw new Error('No active or pending tasks found for this user in the specified date range.');
    }

    saveStoredTasks(updatedTasks);

    // Send notification to substitute user
    notificationService.notifyTaskTransferred({
      toUserId: toUser.id,
      fromUserName: fromUser.full_name,
      taskCount: transferredCount,
      reason,
    });

    return {
      transferredCount,
      fromUserName: fromUser.full_name,
      toUserName: toUser.full_name,
    };
  },
};
