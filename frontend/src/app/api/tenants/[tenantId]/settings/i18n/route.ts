import { NextRequest, NextResponse } from 'next/server';
import { locales } from '@/lib/i18n/config';

// In-memory storage for demo purposes
// In a real application, this would use a database
const tenantSettings = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const tenantId = params.tenantId;
  
  // Get tenant settings from storage or return defaults
  const settings = tenantSettings.get(tenantId) || {
    id: tenantId,
    defaultLocale: 'en',
    enabledLocales: ['en'],
    customTranslations: {},
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    timezone: 'UTC',
    currency: {
      code: 'USD',
      symbol: '$',
      format: '{symbol}{amount}',
    },
    updatedAt: new Date(),
  };
  
  return NextResponse.json(settings);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const tenantId = params.tenantId;
  
  try {
    const body = await request.json();
    
    // Get existing settings or create defaults
    const existingSettings = tenantSettings.get(tenantId) || {
      id: tenantId,
      defaultLocale: 'en',
      enabledLocales: ['en'],
      customTranslations: {},
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'h:mm A',
      timezone: 'UTC',
      currency: {
        code: 'USD',
        symbol: '$',
        format: '{symbol}{amount}',
      },
      updatedAt: new Date(),
    };
    
    // Validate defaultLocale
    if (body.defaultLocale && !locales.includes(body.defaultLocale)) {
      return NextResponse.json(
        { error: `Invalid defaultLocale: ${body.defaultLocale}` },
        { status: 400 }
      );
    }
    
    // Validate enabledLocales
    if (body.enabledLocales) {
      if (!Array.isArray(body.enabledLocales)) {
        return NextResponse.json(
          { error: 'enabledLocales must be an array' },
          { status: 400 }
        );
      }
      
      // Filter invalid locales
      body.enabledLocales = body.enabledLocales.filter(locale => 
        locales.includes(locale)
      );
      
      // Ensure defaultLocale is always enabled
      if (body.defaultLocale && !body.enabledLocales.includes(body.defaultLocale)) {
        body.enabledLocales.push(body.defaultLocale);
      }
    }
    
    // Merge and update settings
    const updatedSettings = {
      ...existingSettings,
      ...body,
      currency: {
        ...existingSettings.currency,
        ...(body.currency || {}),
      },
      updatedAt: new Date(),
    };
    
    // Save to storage
    tenantSettings.set(tenantId, updatedSettings);
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating tenant i18n settings:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
