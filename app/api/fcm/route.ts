import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    // For now, we'll just acknowledge the token
    // In production, you would store this in a database
    // TODO: Store token in fcm_tokens table when database migration is run
    console.log('FCM Token received for user:', userId, 'Token:', token.substring(0, 20) + '...');

    return NextResponse.json({ 
      success: true, 
      message: 'FCM token received successfully',
      tokenPreview: token.substring(0, 20) + '...'
    });
  } catch (error) {
    console.error('FCM token storage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // For now, we'll just acknowledge the deletion
    // TODO: Delete token from fcm_tokens table when database migration is run
    console.log('FCM Token deletion requested for user:', userId);

    return NextResponse.json({ success: true, message: 'FCM token deletion acknowledged' });
  } catch (error) {
    console.error('FCM token deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
