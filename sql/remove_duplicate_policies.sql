-- Fix Multiple Permissive Policies Issues
-- This script removes duplicate/redundant RLS policies to improve performance

-- =============================================================================
-- FIX 2: Remove Multiple Permissive Policies
-- Keep only the most specific and necessary policies
-- =============================================================================

-- Events table - Remove broad "Allow all operations" policy
DROP POLICY IF EXISTS "Allow all operations on events" ON public.events;

-- Personnel table - Remove broad policies and keep specific ones
DROP POLICY IF EXISTS "Allow all operations on personnel" ON public.personnel;

-- Consolidate personnel INSERT policies
DROP POLICY IF EXISTS "Enable insert for anonymous users during signup" ON public.personnel;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON public.personnel;
DROP POLICY IF EXISTS "Users can insert their own personnel record" ON public.personnel;

-- Create a single, comprehensive personnel INSERT policy
CREATE POLICY "Users can insert personnel record during signup" ON public.personnel
    FOR INSERT WITH CHECK (
        -- Allow anonymous users during signup
        auth.role() = 'anon' OR 
        -- Allow authenticated users to insert their own record
        (auth.role() = 'authenticated' AND user_id = (SELECT auth.uid()))
    );

-- Consolidate personnel SELECT policies
DROP POLICY IF EXISTS "Users can view all personnel" ON public.personnel;

CREATE POLICY "Users can view all personnel" ON public.personnel
    FOR SELECT USING (true); -- Allow all authenticated users to view personnel

-- Consolidate personnel UPDATE policies
DROP POLICY IF EXISTS "Users can update own personnel record" ON public.personnel;
DROP POLICY IF EXISTS "Users can update their own personnel record" ON public.personnel;

CREATE POLICY "Users can update their own personnel record" ON public.personnel
    FOR UPDATE USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Photos table - Remove broad "Allow all operations" policy
DROP POLICY IF EXISTS "Allow all operations on photos" ON public.photos;

-- Projects table - Remove broad "Allow all operations" policy
DROP POLICY IF EXISTS "Allow all operations on projects" ON public.projects;

-- Reports table - Remove broad "Allow all operations" policy
DROP POLICY IF EXISTS "Allow all operations on reports" ON public.reports;

-- Tasks table - Remove broad "Allow all operations" policy
DROP POLICY IF EXISTS "Allow all operations on tasks" ON public.tasks;

-- =============================================================================
-- Add missing policies that might be needed
-- =============================================================================

-- Tasks policies
CREATE POLICY IF NOT EXISTS "Users can create tasks in their projects" ON public.tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid()) OR 
            id IN (
                SELECT project_id 
                FROM project_assignments 
                WHERE personnel_id IN (
                    SELECT id 
                    FROM personnel 
                    WHERE user_id = (SELECT auth.uid())
                )
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can update tasks in their projects" ON public.tasks
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid()) OR 
            id IN (
                SELECT project_id 
                FROM project_assignments 
                WHERE personnel_id IN (
                    SELECT id 
                    FROM personnel 
                    WHERE user_id = (SELECT auth.uid())
                )
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can delete tasks in their projects" ON public.tasks
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid()) OR 
            id IN (
                SELECT project_id 
                FROM project_assignments 
                WHERE personnel_id IN (
                    SELECT id 
                    FROM personnel 
                    WHERE user_id = (SELECT auth.uid())
                )
            )
        )
    );

-- Reports policies
CREATE POLICY IF NOT EXISTS "Users can upload reports to their projects" ON public.reports
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid()) OR 
            id IN (
                SELECT project_id 
                FROM project_assignments 
                WHERE personnel_id IN (
                    SELECT id 
                    FROM personnel 
                    WHERE user_id = (SELECT auth.uid())
                )
            )
        )
    );

-- Photos policies
CREATE POLICY IF NOT EXISTS "Users can upload photos to their projects" ON public.photos
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid()) OR 
            id IN (
                SELECT project_id 
                FROM project_assignments 
                WHERE personnel_id IN (
                    SELECT id 
                    FROM personnel 
                    WHERE user_id = (SELECT auth.uid())
                )
            )
        )
    );

-- Milestones policies
CREATE POLICY IF NOT EXISTS "Users can create milestones in their projects" ON public.milestones
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid()) OR 
            id IN (
                SELECT project_id 
                FROM project_assignments 
                WHERE personnel_id IN (
                    SELECT id 
                    FROM personnel 
                    WHERE user_id = (SELECT auth.uid())
                )
            )
        )
    );

-- Add indexes to improve performance of RLS policies
CREATE INDEX IF NOT EXISTS idx_personnel_user_id ON public.personnel(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_assignments_personnel_id ON public.project_assignments(personnel_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON public.project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON public.reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_uploader_id ON public.reports(uploader_id);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON public.events(project_id);
CREATE INDEX IF NOT EXISTS idx_photos_project_id ON public.photos(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
