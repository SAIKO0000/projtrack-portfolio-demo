// Quick script to check task data in Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTaskData() {
  try {
    console.log('🔍 Checking task data...')
    
    // Check total count
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📊 Total tasks in database: ${count}`)
    
    // Get first few tasks with details
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, name, status, description')
      .limit(5)
    
    if (error) {
      console.error('❌ Error fetching tasks:', error)
      return
    }
    
    console.log('📋 Sample tasks:')
    tasks?.forEach(task => {
      console.log(`  - ID: ${task.id}`)
      console.log(`    Title: "${task.title}"`)
      console.log(`    Name: "${task.name}"`)
      console.log(`    Status: "${task.status}"`)
      console.log(`    Description: "${task.description?.substring(0, 50)}..."`)
      console.log('')
    })
    
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

checkTaskData()
