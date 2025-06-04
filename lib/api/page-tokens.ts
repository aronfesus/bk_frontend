import { PageAccessToken, CreatePageAccessTokenInput } from "@/types/page-token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const defaultHeaders = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};

export const pageTokensApi = {
  async createPageAccessToken(tokenData: CreatePageAccessTokenInput): Promise<PageAccessToken> {
    console.log('Creating page access token:', tokenData.pageId);
    try {
      const response = await fetch(`${API_BASE_URL}/page_access_tokens/`, {
        method: "POST",
        headers: defaultHeaders,
        credentials: "include",
        body: JSON.stringify(tokenData),
      });
      
      if (response.status === 307 || response.status === 401) {
        throw new Error("Please login to create page access tokens");
      }
      
      if (response.status === 409) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Page access token already exists");
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Page access token created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating page access token:', error);
      throw error;
    }
  },

  async getPageAccessTokens(): Promise<PageAccessToken[]> {
    console.log('Fetching page access tokens');
    try {
      const response = await fetch(`${API_BASE_URL}/page_access_tokens/`, {
        credentials: "include",
        headers: defaultHeaders,
      });
      
      if (response.status === 307 || response.status === 401) {
        throw new Error("Please login to view page access tokens");
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('Received page access tokens:', data);
      return data;
    } catch (error) {
      console.error('Error fetching page access tokens:', error);
      throw error;
    }
  },
}; 