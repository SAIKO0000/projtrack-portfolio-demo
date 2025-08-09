-- Fix RLS Performance Issues
-- This script addresses the Supabase linter warnings by optimizing RLS policies

-- First, let's see current policies to understand what needs to be fixed
-- Run this to see current policies: SELECT * FROM pg_policies WHERE schemaname = 'public';

-- =============================================================================
-- FIX 1: Auth RLS Initialization Plan Issues
-- Replace auth.<function>() with (select auth.<function>()) to prevent re-evaluation
-- =============================================================================

-- Projects table policies
DROP POLICY IF EXISTS "Users can view projects they created or are assigned to" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects they created" ON public.projects;

CREATE POLICY "Users can view projects they created or are assigned to" ON public.projects
    FOR SELECT USING (
        created_by = (SELECT auth.uid()) OR 
        id IN (
            SELECT DISTINCT project_id 
            FROM tasks 
            WHERE assigned_to IN (
                SELECT personnel_id 
                FROM user_profiles 
                WHERE id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can update projects they created" ON public.projects
    FOR UPDATE USING (created_by = (SELECT auth.uid()));

-- Tasks table policies
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON public.tasks;

CREATE POLICY "Users can view tasks in their projects" ON public.tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid())
        ) OR
        assigned_to IN (
            SELECT personnel_id 
            FROM user_profiles 
            WHERE id = (SELECT auth.uid())
        )
    );

-- Reports table policies
DROP POLICY IF EXISTS "Users can view reports they uploaded or in their projects" ON public.reports;

CREATE POLICY "Users can view reports they uploaded or in their projects" ON public.reports
    FOR SELECT USING (
        uploaded_by = (SELECT auth.uid()) OR
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid())
        ) OR
        project_id IN (
            SELECT DISTINCT project_id 
            FROM tasks 
            WHERE assigned_to IN (
                SELECT personnel_id 
                FROM user_profiles 
                WHERE id = (SELECT auth.uid())
            )
        )
    );

-- Events table policies
DROP POLICY IF EXISTS "Users can view events in their projects" ON public.events;
DROP POLICY IF EXISTS "Users can create events in their projects" ON public.events;

CREATE POLICY "Users can view events in their projects" ON public.events
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid())
        ) OR
        project_id IN (
            SELECT DISTINCT project_id 
            FROM tasks 
            WHERE assigned_to IN (
                SELECT personnel_id 
                FROM user_profiles 
                WHERE id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "Users can create events in their projects" ON public.events
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid())
        ) OR
        project_id IN (
            SELECT DISTINCT project_id 
            FROM tasks 
            WHERE assigned_to IN (
                SELECT personnel_id 
                FROM user_profiles 
                WHERE id = (SELECT auth.uid())
            )
        )
    );

-- Milestones table policies
DROP POLICY IF EXISTS "Users can view milestones in their projects" ON public.milestones;

CREATE POLICY "Users can view milestones in their projects" ON public.milestones
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid())
        ) OR
        project_id IN (
            SELECT DISTINCT project_id 
            FROM tasks 
            WHERE assigned_to IN (
                SELECT personnel_id 
                FROM user_profiles 
                WHERE id = (SELECT auth.uid())
            )
        )
    );

-- Photos table policies
DROP POLICY IF EXISTS "Users can view photos in their projects" ON public.photos;

CREATE POLICY "Users can view photos in their projects" ON public.photos
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = (SELECT auth.uid())
        ) OR
        project_id IN (
            SELECT DISTINCT project_id 
            FROM tasks 
            WHERE assigned_to IN (
                SELECT personnel_id 
                FROM user_profiles 
                WHERE id = (SELECT auth.uid())
            )
        )
    );
