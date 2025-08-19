#!/usr/bin/env node

/**
 * Migration script to add notes column to tasks table
 * Run this script to add the notes field to your Supabase tasks table
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.log('\n📋 Please manually run this SQL in your Supabase SQL Editor:')
  console.log('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Running migration: Add notes column to tasks table...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../sql/add_notes_column_to_tasks.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      // Try alternative method - direct SQL execution
      const { error: directError } = await supabase.from('tasks').select('notes').limit(1)
      
      if (directError && directError.message.includes('column "notes" does not exist')) {
        console.log('📝 Notes column does not exist. Creating it...')
        
        // Use a simpler approach - just add the column
        const { error: alterError } = await supabase.rpc('exec_sql', { 
          sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;' 
        })
        
        if (alterError) {
          console.error('❌ Failed to add notes column:', alterError.message)
          console.log('\n📋 Manual SQL to run in Supabase SQL Editor:')
          console.log('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;')
          return
        }
      }
    }
    
    // Verify the column was added
    console.log('✅ Verifying notes column exists...')
    const { data, error: verifyError } = await supabase.from('tasks').select('notes').limit(1)
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message)
      console.log('\n📋 Please manually run this SQL in your Supabase SQL Editor:')
      console.log(sql)
    } else {
      console.log('✅ Migration completed successfully!')
      console.log('📄 Notes column has been added to the tasks table')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Please manually run this SQL in your Supabase SQL Editor:')
    console.log(fs.readFileSync(path.join(__dirname, '../sql/add_notes_column_to_tasks.sql'), 'utf8'))
  }
}

runMigration()
