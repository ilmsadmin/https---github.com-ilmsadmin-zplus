import { NextRequest, NextResponse } from 'next/server';

// Endpoint để gửi test notification
export async function POST(request: NextRequest) {
  try {
    const { subscription, title, message } = await request.json();
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription object is required' },
        { status: 400 }
      );
    }
    
    // Trong môi trường thực tế, bạn sẽ sử dụng web-push library
    // Ở đây chỉ là mock response để test
    
    // Giả lập gửi push notification
    const mockPushSuccess = true;
    
    if (mockPushSuccess) {
      return NextResponse.json(
        { success: true, message: 'Test notification sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send test notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
