import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const GRAPH_API_VERSION = process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_VERSION || 'v19.0';

console.log('API Route Initializing: app/api/facebook/get-manageable-pages/route.ts');
console.log('FACEBOOK_APP_ID available:', !!FACEBOOK_APP_ID);
console.log('FACEBOOK_APP_SECRET available (only length):', FACEBOOK_APP_SECRET ? FACEBOOK_APP_SECRET.length : 0);
console.log('GRAPH_API_VERSION:', GRAPH_API_VERSION);

interface ManageablePage {
  id: string;
  name: string;
  accessToken: string; 
  category: string;
  tasks: string[];
}

// ApiResponse structure is implicitly defined by what NextResponse.json returns

export async function POST(req: NextRequest) {
  console.log(`[${new Date().toISOString()}] Received request to app/api/facebook/get-manageable-pages/route.ts`);

  try {
    const { userId: clerkUserId } = getAuth(req); // Pass the NextRequest object to getAuth
    if (!clerkUserId) {
      console.warn('Clerk authentication failed: No clerkUserId found');
      return NextResponse.json({ message: 'Not authenticated with Clerk' }, { status: 401 });
    }
    console.log('Authenticated with Clerk. User ID:', clerkUserId);

    const body = await req.json(); // Parse the body from the Request object
    const { shortLivedUserAccessToken, facebookUserId } = body;
    console.log('Request body parsed. FB User ID:', facebookUserId, 'Short-lived token (first 10 chars):', shortLivedUserAccessToken?.substring(0, 10));

    if (!shortLivedUserAccessToken || !facebookUserId) {
      console.warn('Missing shortLivedUserAccessToken or facebookUserId in request body');
      return NextResponse.json({ message: 'Missing shortLivedUserAccessToken or facebookUserId' }, { status: 400 });
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('CRITICAL: Facebook App ID or Secret is not configured in server environment variables.');
      return NextResponse.json({ message: 'Server configuration error: Facebook credentials missing.', error: 'FB App ID/Secret missing' }, { status: 500 });
    }

    // 1. Exchange short-lived user token for a long-lived user token
    const longLivedUserTokenUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedUserAccessToken}`;
    console.log('Attempting to get long-lived user token from URL:', longLivedUserTokenUrl.replace(FACEBOOK_APP_SECRET, '[APP_SECRET_REDACTED]'));
    
    const llUserTokenResponse = await fetch(longLivedUserTokenUrl);
    const llUserTokenData = await llUserTokenResponse.json();

    if (!llUserTokenResponse.ok || !llUserTokenData.access_token) {
      console.error('Failed to get long-lived user token. Status:', llUserTokenResponse.status, 'Response:', llUserTokenData);
      return NextResponse.json({ 
        message: 'Failed to exchange for long-lived user token', 
        error: llUserTokenData.error?.message || 'Facebook API error during token exchange',
        details: llUserTokenData.error 
      }, { status: llUserTokenResponse.status || 500 });
    }
    const longLivedUserAccessToken = llUserTokenData.access_token;
    console.log('Successfully obtained long-lived user access token (first 10 chars):', longLivedUserAccessToken?.substring(0, 10));

    // 2. Get long-lived Page Access Tokens using the long-lived User Access Token
    const pagesUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${facebookUserId}/accounts?access_token=${longLivedUserAccessToken}`;
    console.log('Attempting to fetch pages from URL:', pagesUrl.replace(longLivedUserAccessToken, '[LL_USER_TOKEN_REDACTED]'));
    
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      console.error('Failed to fetch pages. Status:', pagesResponse.status, 'Response:', pagesData);
      return NextResponse.json({ 
        message: 'Failed to fetch pages', 
        error: pagesData.error?.message || 'Facebook API error while fetching pages',
        details: pagesData.error 
      }, { status: pagesResponse.status || 500 });
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      console.log('No manageable pages found for this user.');
      return NextResponse.json({ pages: [], message: 'No manageable pages found for this user.' }, { status: 200 });
    }

    const manageablePages: ManageablePage[] = pagesData.data.map((page: any) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
      category: page.category,
      tasks: page.tasks,
    }));
    console.log(`Successfully fetched ${manageablePages.length} page(s). Returning to client.`);
    return NextResponse.json({ pages: manageablePages }, { status: 200 });

  } catch (error: unknown) {
    console.error('Unhandled error in app/api/facebook/get-manageable-pages/route.ts POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ message: 'Server error', error: errorMessage, details: error instanceof Error ? error.stack : error }, { status: 500 });
  }
} 