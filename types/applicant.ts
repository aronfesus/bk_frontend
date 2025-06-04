import { Job } from "./job";

export enum ApplicantOrigin {
  FACEBOOK = "Facebook",
  PHONE = "Telefonszám",
  OTHER = "Egyéb"
}

export enum ApplicantType {
  NORMAL = "Normál",
  STUDENT = "Diák",
  ELDER = "Nyugdíjas"
}

export interface Applicant {
  applicantId: string;
  name: string;
  dateOfBirth?: string;
  email: string;
  phoneNumber: string;
  applicantType: ApplicantType;
  address: string;
  facebookId?: string;
  hasEKG: boolean;
  origin: ApplicantOrigin;
  jobs?: Job[]; // Assuming you have a Job type imported
  aiResponse: boolean;
}

// This type represents the data needed to create a new applicant
export interface CreateApplicantInput {
  name: string;
  dateOfBirth: Date;
  email: string;
  phoneNumber: string;
  type: ApplicantType;
  address: string;
  facebookId?: string;
  hasEKG?: boolean;
  origin: ApplicantOrigin;
}

// This type represents the data that can be updated for an applicant
export interface UpdateApplicantInput {
  name?: string;
  dateOfBirth?: Date;
  email?: string;
  phoneNumber?: string;
  type?: ApplicantType;
  address?: string;
  facebookId?: string;
  hasEKG?: boolean;
  origin?: ApplicantOrigin;
} 