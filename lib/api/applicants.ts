import { Applicant, CreateApplicantInput, UpdateApplicantInput } from "@/types/applicant";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const defaultHeaders = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};

export interface PaginatedApplicants {
  applicants: Applicant[];
  total: number;
}

export const applicantsApi = {
  async getApplicants(): Promise<Applicant[]> {
    console.log('Fetching applicants from:', `${API_BASE_URL}/applicants`);
    try {
      const response = await fetch(`${API_BASE_URL}/applicants`, {
        credentials: "include",
        headers: defaultHeaders,
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 307 || response.status === 401) {
        throw new Error("Please login to view applicants");
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data: PaginatedApplicants = await response.json();
      console.log('Received applicants:', data);
      
      // Return just the applicants array from the paginated response
      return data.applicants;
    } catch (error) {
      console.error('Error fetching applicants:', error);
      throw error;
    }
  },

  async getApplicantsByOrigin(origin: string): Promise<Applicant[]> {
    console.log('Fetching applicants by origin:', `${API_BASE_URL}/applicants/by-origin/${origin}`);
    try {
      const response = await fetch(`${API_BASE_URL}/applicants/by-origin/${origin}`, {
        credentials: "include",
        headers: defaultHeaders,
      });
      
      if (response.status === 307 || response.status === 401) {
        throw new Error("Please login to view applicants");
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('Received applicants by origin:', data);
      return data;
    } catch (error) {
      console.error('Error fetching applicants by origin:', error);
      throw error;
    }
  },

  async createApplicant(applicant: CreateApplicantInput): Promise<Applicant> {
    const response = await fetch(`${API_BASE_URL}/applicants`, {
      method: "POST",
      headers: defaultHeaders,
      credentials: "include",
      body: JSON.stringify(applicant),
    });
    if (!response.ok) throw new Error("Failed to create applicant");
    return response.json();
  },

  async updateApplicant(applicantId: string, updates: UpdateApplicantInput): Promise<Applicant> {
    const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}`, {
      method: "PUT",
      headers: defaultHeaders,
      credentials: "include",
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update applicant");
    return response.json();
  },

  async deleteApplicant(applicantId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}`, {
      method: "DELETE",
      headers: defaultHeaders,
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to delete applicant");
  },

  // Additional function to get a single applicant by ID
  async getApplicantById(applicantId: string): Promise<Applicant> {
    const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}`, {
      credentials: "include",
      headers: defaultHeaders,
    });
    if (!response.ok) throw new Error("Failed to fetch applicant");
    return response.json();
  },

  async updateAiResponse(applicantId: string, aiResponse: boolean): Promise<Applicant> {
    const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}/ai-response?ai_response=${aiResponse}`, {
      method: "PATCH",
      headers: defaultHeaders,
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to update AI response");
    return response.json();
  },

  async getApplicantsPaginated(
    page: number = 1,
    limit: number = 20,
    searchTerm?: string,
    jobId?: string,
    typeFilter?: string,
    originFilter?: string
  ): Promise<{ applicants: Applicant[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (searchTerm) {
      params.append('search', searchTerm);
    }
    if (jobId && jobId !== 'all') {
      params.append('job_id', jobId);
    }
    if (typeFilter && typeFilter !== 'all') {
      params.append('type', typeFilter);
    }
    if (originFilter && originFilter !== 'all') {
      params.append('origin', originFilter);
    }

    const response = await fetch(`${API_BASE_URL}/applicants?${params.toString()}`, {
      credentials: "include",
      headers: defaultHeaders,
    });
    if (!response.ok) throw new Error("Failed to fetch applicants");
    return response.json();
  },
};