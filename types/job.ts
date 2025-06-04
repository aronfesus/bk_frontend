export enum JobType {
  NORMAL = "Normál",
  STUDENT = "Diák",
  ELDER = "Nyugdíjas"
}

export interface Job {
  jobId: string;
  title: string;
  description: string;
  salary: string;
  jobPlace: string;
  jobType: JobType;
  isActive: boolean;
  createdAt: string;
  applicantsCount?: number;
}

export interface CreateJobInput {
  title: string;
  description: string;
  salary: string;
  jobPlace: string;
  jobType: JobType;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  isActive?: boolean;
} 