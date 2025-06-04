import { JobApplication } from "@/types/job-application";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const defaultHeaders = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};

export const jobApplicationsApi = {
  async getApplicationsByApplicant(applicantId: string): Promise<JobApplication[]> {
    console.log('Fetching job applications for applicant:', applicantId);
    try {
      const response = await fetch(`${API_BASE_URL}/job-applications/applicant/${applicantId}/jobs`, {
        credentials: "include",
        headers: defaultHeaders,
      });
      
      if (response.status === 307 || response.status === 401) {
        throw new Error("Please login to view job applications");
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('Received job applications:', data);
      return data;
    } catch (error) {
      console.error('Error fetching job applications:', error);
      throw error;
    }
  }
}; 