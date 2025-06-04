import { Applicant } from "./applicant"

export interface Call {
  callId: string
  applicantId: string
  createdAt: string
  duration: number
  status: string
  transcript: any
  call_success: boolean
  callerNumber: string
  callDirection: string
  callerName: string
  callerEmail: string
}

export interface CallWithApplicant extends Call {
  applicant: Applicant
} 