import { Message } from "@/types/message"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/";


export const messagesApi = {
  getMessagesByApplicantId: async (applicantId: string): Promise<Message[]> => {
    const response = await fetch(`${API_BASE_URL}/messages/by-applicant/${applicantId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch messages")
    }
    return response.json()
  },
  getMessagesByApplicantIdPaginated: async (applicantId: string, page: number, limit: number): Promise<{ messages: Message[]; total: number }> => {
    const response = await fetch(`${API_BASE_URL}/messages/by-applicant/${applicantId}?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch messages");
    return response.json();
  },
  getRecentMessages: async (limit: number = 3): Promise<Message[]> => {
    const response = await fetch(`${API_BASE_URL}/messages/recent?limit=${limit}`);
    if (!response.ok) {
      throw new Error("Failed to fetch recent messages");
    }
    return response.json();
  }
} 