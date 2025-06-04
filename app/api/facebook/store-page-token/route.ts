import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { pageTokensApi } from '@/lib/api/page-tokens';
import { encryptToken } from '@/lib/crypto';

// You'll need to import your database utility here
// For example: import { db } from '@/lib/db'; // Adjust path as necessary

console.log('API Route Initializing: app/api/facebook/store-page-token/route.ts');

interface StoreTokenRequestBody {
  pageId: string;
  pageName: string;
  pageAccessToken: string; // Long-lived Page Access Token
}

// ApiResponse structure is implicitly defined by what NextResponse.json returns

export async function POST(req: NextRequest) {
  console.log(`[${new Date().toISOString()}] Received request to app/api/facebook/store-page-token/route.ts`);

  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      console.warn('Clerk authentication failed: No clerkUserId found');
      return NextResponse.json({ message: 'Not authenticated with Clerk' }, { status: 401 });
    }
    console.log('Authenticated with Clerk. User ID:', clerkUserId);

    const body = await req.json() as StoreTokenRequestBody;
    const { pageId, pageName, pageAccessToken } = body;

    console.log(`Request body parsed. Page ID: ${pageId}, Page Name: ${pageName}, Token (first 10): ${pageAccessToken.substring(0, 10)}...`);

    if (!pageId || !pageName || !pageAccessToken) {
      console.warn('Missing pageId, pageName, or pageAccessToken in request body');
      return NextResponse.json({ message: 'Missing pageId, pageName, or pageAccessToken' }, { status: 400 });
    }

    // Encrypt the access token before saving
    console.log('Encrypting access token...');
    const encryptedToken = encryptToken(pageAccessToken);
    console.log('Access token encrypted successfully');

    // Save the page token to the database via the backend API
    const tokenData = {
      pageId,
      pageName,
      accessToken: encryptedToken
    };

    console.log(`Saving Page Token for Page ${pageId} (${pageName}) for Clerk User ${clerkUserId}...`);
    
    const savedToken = await pageTokensApi.createPageAccessToken(tokenData);
    
    console.log(`Page Token saved successfully with ID: ${savedToken.id}`);

    return NextResponse.json({ 
      message: 'Page connection and token stored successfully', 
      pageId,
      tokenId: savedToken.id 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error in app/api/facebook/store-page-token/route.ts POST handler:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ 
          message: 'Page access token already exists', 
          error: error.message 
        }, { status: 409 });
      }
      
      if (error.message.includes('login')) {
        return NextResponse.json({ 
          message: 'Authentication required', 
          error: error.message 
        }, { status: 401 });
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ 
      message: 'Failed to store page token', 
      error: errorMessage 
    }, { status: 500 });
  }
} 