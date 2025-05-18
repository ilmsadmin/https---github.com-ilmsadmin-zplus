import { NextRequest, NextResponse } from 'next/server';

// Xử lý hủy đăng ký push subscription
export async function POST(request: NextRequest) {
  try {
    const { subscription, tenantId, userId } = await request.json();
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription object is required' },
        { status: 400 }
      );
    }
    
    // Gọi API để xóa subscription từ database
    const response = await fetch(`${process.env.NOTIFICATION_SERVICE_URL}/api/push/unsubscribe`, {
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
      throw new Error('Failed to remove push subscription');
    }
    
    return NextResponse.json(
      { success: true, message: 'Subscription removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in push unsubscription:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscription' },
      { status: 500 }
    );
  }
}
