import { NextRequest, NextResponse } from 'next/server';
import { locales } from '@/lib/i18n/config';

// In-memory storage for demo purposes
// In a real application, this would use a database
const tenantTranslations = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string; locale: string } }
) {
  const { tenantId, locale } = params;
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    return NextResponse.json(
      { error: `Invalid locale: ${locale}` },
      { status: 400 }
    );
  }
  
  // Get tenant translations
  const tenantKey = `${tenantId}-${locale}`;
  const translations = tenantTranslations.get(tenantKey) || {};
  
  return NextResponse.json(translations);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string; locale: string } }
) {
  const { tenantId, locale } = params;
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    return NextResponse.json(
      { error: `Invalid locale: ${locale}` },
      { status: 400 }
    );
  }
  
  try {
    const body = await request.json();
    
    // Validate translations
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Translations must be an object' },
        { status: 400 }
      );
    }
    
    // Save translations
    const tenantKey = `${tenantId}-${locale}`;
    tenantTranslations.set(tenantKey, body);
    
    return NextResponse.json(body);
  } catch (error) {
    console.error('Error updating tenant translations:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
