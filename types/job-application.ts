import { Job } from "./job";
import { Applicant } from "./applicant";

export interface JobApplication {
  application_id: string;
  applicant_id: string;
  job_id: string;
  application_date: string;
  job?: Job;
  applicant?: Applicant;
}

export interface JobApplicationCreate {
  applicant_id: string;
  job_id: string;
} 