import { NextRequest, NextResponse } from 'next/server';
import { locales } from '@/lib/i18n/config';

// In-memory storage for demo purposes
// In a real application, this would use a database
const userLanguagePreferences = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  
  // Get user language preference
  const preference = userLanguagePreferences.get(userId);
  
  if (!preference) {
    return NextResponse.json(
      { error: 'User language preference not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(preference);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  
  try {
    const body = await request.json();
    
    // Validate locale
    if (!body.locale || !locales.includes(body.locale)) {
      return NextResponse.json(
        { error: `Invalid locale: ${body.locale}` },
        { status: 400 }
      );
    }
    
    // Create or update preference
    const preference = {
      userId,
      locale: body.locale,
      createdAt: userLanguagePreferences.has(userId)
        ? userLanguagePreferences.get(userId).createdAt
        : new Date(),
      updatedAt: new Date(),
    };
    
    // Save preference
    userLanguagePreferences.set(userId, preference);
    
    return NextResponse.json(preference);
  } catch (error) {
    console.error('Error updating user language preference:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
