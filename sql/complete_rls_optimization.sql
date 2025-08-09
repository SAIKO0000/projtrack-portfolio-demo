-- Complete RLS Performance Optimization
-- This script applies all fixes in the correct order

BEGIN;

-- =============================================================================
-- STEP 1: Remove all duplicate and broad policies
-- =============================================================================

-- Remove broad "Allow all operations" policies
DROP POLICY IF EXISTS "Allow all operations on events" ON public.events;
DROP POLICY IF EXISTS "Allow all operations on personnel" ON public.personnel;
DROP POLICY IF EXISTS "Allow all operations on photos" ON public.photos;
DROP POLICY IF EXISTS "Allow all operations on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all operations on reports" ON public.reports;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON public.tasks;

-- Remove duplicate personnel policies
DROP POLICY IF EXISTS "Enable insert for anonymous users during signup" ON public.personnel;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON public.personnel;
DROP POLICY IF EXISTS "Users can insert their own personnel record" ON public.personnel;
DROP POLICY IF EXISTS "Users can update own personnel record" ON public.personnel;
DROP POLICY IF EXISTS "Users can update their own personnel record" ON public.personnel;
DROP POLICY IF EXISTS "Users can view all personnel" ON public.personnel;

-- =============================================================================
-- STEP 2: Create optimized policies with proper auth function calls
-- =============================================================================

-- Personnel policies (consolidated)
CREATE POLICY "personnel_insert_policy" ON public.personnel
    FOR INSERT WITH CHECK (
        -- Allow during signup (both anon and authenticated)
        user_id = (SELECT auth.uid()) OR auth.role() = 'anon'
    );

CREATE POLICY "personnel_select_policy" ON public.personnel
    FOR SELECT USING (true); -- Allow all authenticated users to view personnel

CREATE POLICY "personnel_update_policy" ON public.personnel
    FOR UPDATE USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Projects policies (optimized)
DROP POLICY IF EXISTS "Users can view projects they created or are assigned to" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects they created" ON public.projects;

CREATE POLICY "projects_select_policy" ON public.projects
    FOR SELECT USING (
        created_by = (SELECT auth.uid()) OR 
        id IN (
            SELECT project_id 
            FROM project_assignments 
            WHERE personnel_id IN (
                SELECT id 
                FROM personnel 
                WHERE user_id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "projects_insert_policy" ON public.projects
    FOR INSERT WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "projects_update_policy" ON public.projects
    FOR UPDATE USING (created_by = (SELECT auth.uid()));

-- Tasks policies (optimized)
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON public.tasks;

CREATE POLICY "tasks_select_policy" ON public.tasks
    FOR SELECT USING (
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

CREATE POLICY "tasks_insert_policy" ON public.tasks
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

CREATE POLICY "tasks_update_policy" ON public.tasks
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

CREATE POLICY "tasks_delete_policy" ON public.tasks
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

-- Reports policies (optimized)
DROP POLICY IF EXISTS "Users can view reports they uploaded or in their projects" ON public.reports;

CREATE POLICY "reports_select_policy" ON public.reports
    FOR SELECT USING (
        uploader_id = (SELECT auth.uid()) OR
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

CREATE POLICY "reports_insert_policy" ON public.reports
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

-- Events policies (optimized)
DROP POLICY IF EXISTS "Users can view events in their projects" ON public.events;
DROP POLICY IF EXISTS "Users can create events in their projects" ON public.events;

CREATE POLICY "events_select_policy" ON public.events
    FOR SELECT USING (
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

CREATE POLICY "events_insert_policy" ON public.events
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

-- Photos policies (optimized)
DROP POLICY IF EXISTS "Users can view photos in their projects" ON public.photos;

CREATE POLICY "photos_select_policy" ON public.photos
    FOR SELECT USING (
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

CREATE POLICY "photos_insert_policy" ON public.photos
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

-- Milestones policies (optimized)
DROP POLICY IF EXISTS "Users can view milestones in their projects" ON public.milestones;

CREATE POLICY "milestones_select_policy" ON public.milestones
    FOR SELECT USING (
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

CREATE POLICY "milestones_insert_policy" ON public.milestones
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

-- =============================================================================
-- STEP 3: Add performance indexes
-- =============================================================================

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

COMMIT;

-- =============================================================================
-- Verification queries (run these after applying the migration)
-- =============================================================================

-- Check all policies
-- SELECT schemaname, tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;

-- Check for remaining duplicate policies
-- SELECT tablename, cmd, array_agg(policyname) as policies, count(*) 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- GROUP BY tablename, cmd 
-- HAVING count(*) > 1;
