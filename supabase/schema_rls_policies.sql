-- ==============================================================================
-- Row Level Security (RLS) Policies for Processly Checklist & Delegation System
-- Run this in your Supabase SQL Editor to enable Read/Write permissions for your app.
-- ==============================================================================

-- 1. Checklists Policies
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.checklists;
CREATE POLICY "Allow select for all" ON public.checklists
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.checklists;
CREATE POLICY "Allow insert for all" ON public.checklists
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.checklists;
CREATE POLICY "Allow update for all" ON public.checklists
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for all" ON public.checklists;
CREATE POLICY "Allow delete for all" ON public.checklists
  FOR DELETE USING (true);


-- 2. Checklist Items Policies
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.checklist_items;
CREATE POLICY "Allow select for all" ON public.checklist_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.checklist_items;
CREATE POLICY "Allow insert for all" ON public.checklist_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.checklist_items;
CREATE POLICY "Allow update for all" ON public.checklist_items
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for all" ON public.checklist_items;
CREATE POLICY "Allow delete for all" ON public.checklist_items
  FOR DELETE USING (true);


-- 3. Tasks Policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.tasks;
CREATE POLICY "Allow select for all" ON public.tasks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.tasks;
CREATE POLICY "Allow insert for all" ON public.tasks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.tasks;
CREATE POLICY "Allow update for all" ON public.tasks
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for all" ON public.tasks;
CREATE POLICY "Allow delete for all" ON public.tasks
  FOR DELETE USING (true);


-- 4. Task History Policies
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.task_history;
CREATE POLICY "Allow select for all" ON public.task_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.task_history;
CREATE POLICY "Allow insert for all" ON public.task_history
  FOR INSERT WITH CHECK (true);


-- 5. Task Comments Policies
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.task_comments;
CREATE POLICY "Allow select for all" ON public.task_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.task_comments;
CREATE POLICY "Allow insert for all" ON public.task_comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.task_comments;
CREATE POLICY "Allow update for all" ON public.task_comments
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for all" ON public.task_comments;
CREATE POLICY "Allow delete for all" ON public.task_comments
  FOR DELETE USING (true);


-- 6. Task Extension Requests Policies
ALTER TABLE public.task_extension_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.task_extension_requests;
CREATE POLICY "Allow select for all" ON public.task_extension_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.task_extension_requests;
CREATE POLICY "Allow insert for all" ON public.task_extension_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.task_extension_requests;
CREATE POLICY "Allow update for all" ON public.task_extension_requests
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for all" ON public.task_extension_requests;
CREATE POLICY "Allow delete for all" ON public.task_extension_requests
  FOR DELETE USING (true);


-- 7. Departments Policies
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.departments;
CREATE POLICY "Allow select for all" ON public.departments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.departments;
CREATE POLICY "Allow insert for all" ON public.departments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.departments;
CREATE POLICY "Allow update for all" ON public.departments
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for all" ON public.departments;
CREATE POLICY "Allow delete for all" ON public.departments
  FOR DELETE USING (true);
