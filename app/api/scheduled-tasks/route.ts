import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client for API routes
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TaskDeadline {
  id: string;
  title: string;
  project_name: string;
  end_date: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  daysRemaining: number;
}

export async function GET() {
  try {
    console.log('📅 [API] Checking scheduled tasks for notifications...');
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        end_date,
        status,
        priority,
        assigned_to,
        projects!inner(name)
      `)
      .neq('status', 'completed')
      .not('end_date', 'is', null);

    if (error) {
      console.error('❌ [API] Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    if (!tasks || tasks.length === 0) {
      console.log('ℹ️ [API] No active tasks found');
      return NextResponse.json({ tasks: [] });
    }

    const now = new Date();
    const tasksWithDeadlines: TaskDeadline[] = [];

    tasks.forEach(task => {
      if (!task.end_date) return;

      const endDate = new Date(task.end_date);
      const timeDiff = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Include tasks with 0-7 days remaining
      if (daysRemaining >= 0 && daysRemaining <= 7) {
        const taskDeadline = {
          id: task.id,
          title: task.title,
          project_name: Array.isArray(task.projects) ? 
            task.projects[0]?.name || 'Unknown Project' : 
            (task.projects as unknown as { name: string })?.name || 'Unknown Project',
          end_date: task.end_date,
          status: task.status || 'unknown',
          priority: task.priority || 'medium',
          assigned_to: task.assigned_to,
          daysRemaining
        };
        
        tasksWithDeadlines.push(taskDeadline);
      }
    });

    console.log(`📅 [API] Found ${tasksWithDeadlines.length} tasks with upcoming deadlines`);
    
    // Sort by urgency - urgent tasks first, then by days remaining
    tasksWithDeadlines.sort((a, b) => {
      // Urgent tasks (≤3 days) come first
      const aIsUrgent = a.daysRemaining <= 3;
      const bIsUrgent = b.daysRemaining <= 3;
      
      if (aIsUrgent && !bIsUrgent) return -1;
      if (!aIsUrgent && bIsUrgent) return 1;
      
      // Within same urgency level, sort by days remaining (sooner first)
      return a.daysRemaining - b.daysRemaining;
    });

    return NextResponse.json({ 
      tasks: tasksWithDeadlines,
      timestamp: new Date().toISOString(),
      urgent: tasksWithDeadlines.filter(t => t.daysRemaining <= 3).length,
      warning: tasksWithDeadlines.filter(t => t.daysRemaining > 3 && t.daysRemaining <= 7).length
    });

  } catch (error) {
    console.error('❌ [API] Error in scheduled-tasks endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
