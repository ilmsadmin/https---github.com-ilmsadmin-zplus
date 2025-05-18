import { NextRequest, NextResponse } from 'next/server';

// Xử lý đăng ký push subscription
export async function POST(request: NextRequest) {
  try {
    const { subscription, tenantId, userId } = await request.json();
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription object is required' },
        { status: 400 }
      );
    }
    
    // Lưu subscription vào database (implementation phụ thuộc vào backend service)
    // Ví dụ call tới notification service
    const response = await fetch(`${process.env.NOTIFICATION_SERVICE_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        tenantId,
        userId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to store push subscription');
    }
    
    return NextResponse.json(
      { success: true, message: 'Subscription saved successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}
