import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json()
    
    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a map to store user ID to name mappings
    const userNames: Record<string, string> = {}

    // Since we may not have service role access, let's use a simpler approach
    // For now, we'll show user IDs with a more friendly format
    for (const userId of userIds) {
      if (session.user.id === userId) {
        // For current user, we can get their info
        const currentUserEmail = session.user.email
        if (currentUserEmail) {
          // Try to find in personnel
          const { data: personnel } = await supabase
            .from('personnel')
            .select('name')
            .eq('email', currentUserEmail)
            .single()
          
          if (personnel?.name) {
            userNames[userId] = personnel.name
          } else {
            userNames[userId] = session.user.user_metadata?.name || 
                              currentUserEmail.split('@')[0] || 
                              'You'
          }
        } else {
          userNames[userId] = 'You'
        }
      } else {
        // For other users, show a friendly placeholder
        userNames[userId] = `Team Member (${userId.substring(0, 8)})`
      }
    }

    return NextResponse.json({ userNames })
  } catch (error) {
    console.error('Error resolving user names:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
