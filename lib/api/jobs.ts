import { Job, CreateJobInput, UpdateJobInput } from "@/types/job";

// Default to localhost if no env variable is set
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

if (!API_BASE_URL) {
  console.error("API URL is not configured!");
}

const defaultHeaders = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};

export interface PaginatedJobs {
  jobs: Job[];
  total: number;
}

export const jobsApi = {
  async getJobs(): Promise<Job[]> {
    console.log('Fetching jobs from:', `${API_BASE_URL}/jobs`);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        credentials: "include",
        headers: defaultHeaders,
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 307 || response.status === 401) {
        throw new Error("Please login to view jobs");
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('Received jobs:', data);
      return data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  async createJob(job: CreateJobInput): Promise<Job> {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: "POST",
      headers: defaultHeaders,
      credentials: "include",
      body: JSON.stringify(job),
    });
    if (!response.ok) throw new Error("Failed to create job");
    return response.json();
  },

  async updateJobActiveStatus(jobId: string, isActive: boolean): Promise<Job> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/active?isActive=${isActive}`, {
      method: "PATCH",
      headers: defaultHeaders,
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to update job status");
    return response.json();
  },

  async updateJob(jobId: string, updates: UpdateJobInput): Promise<Job> {
    // If only isActive is being updated, use the dedicated endpoint
    if (Object.keys(updates).length === 1 && 'isActive' in updates) {
      return this.updateJobActiveStatus(jobId, updates.isActive!);
    }

    // Otherwise use the general update endpoint
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: "PUT",
      headers: defaultHeaders,
      credentials: "include",
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update job");
    return response.json();
  },

  async deleteJob(jobId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: "DELETE",
      headers: defaultHeaders,
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to delete job");
  },

  async getJobsPaginated(
    page: number = 1,
    limit: number = 20,
    searchTerm?: string,
    typeFilter?: string,
    statusFilter?: string
  ): Promise<{ jobs: Job[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (searchTerm) {
      params.append('search', searchTerm);
    }
    if (typeFilter && typeFilter !== 'all') {
      params.append('type', typeFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      params.append('status', statusFilter);
    }

    const response = await fetch(`${API_BASE_URL}/jobs?${params.toString()}`, {
      credentials: "include",
      headers: defaultHeaders,
    });
    if (!response.ok) throw new Error("Failed to fetch jobs");
    return response.json();
  },
}; 