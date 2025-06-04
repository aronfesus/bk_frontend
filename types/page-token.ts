export interface PageAccessToken {
  id?: string;
  pageId: string;
  pageName: string;
  accessToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageAccessTokenInput {
  pageId: string;
  pageName: string;
  accessToken: string;
} 