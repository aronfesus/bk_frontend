import { Call } from "@/types/call"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface OutboundCallRequest {
  first_message: string;
  number: string;
  prompt: string;
}

export const callsApi = {
  getCalls: async (
    page: number = 1,
    limit: number = 10,
    searchTerm?: string,
    directionFilter?: string,
    statusFilter?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{ calls: Call[]; total: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) params.append('search', searchTerm);
    if (directionFilter && directionFilter !== 'all') params.append('direction', directionFilter);
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const response = await fetch(`${API_BASE_URL}/calls?${params.toString()}`)
    if (!response.ok) {
      throw new Error("Failed to fetch calls")
    }
    console.log(response)
    return response.json()
  },

  getCall: async (callId: string): Promise<Call> => {
    const response = await fetch(`${API_BASE_URL}/calls/${callId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch call")
    }
    return response.json()
  },

  updateCall: async (callId: string, updates: Partial<Call>): Promise<Call> => {
    const response = await fetch(`${API_BASE_URL}/calls/${callId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error("Failed to update call")
    }
    return response.json()
  },

  deleteCall: async (callId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/calls/${callId}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete call")
    }
  },

  makeOutboundCall: async (callData: OutboundCallRequest): Promise<any> => {
    const response = await fetch('https://app-fs80.onrender.com/twilio/outbound-call', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callData),
    });
    
    if (!response.ok) {
      throw new Error("Failed to make outbound call");
    }
    
    return response.json();
  },

  getRecentCalls: async (limit: number = 3): Promise<Call[]> => {
    const response = await fetch(`${API_BASE_URL}/calls/recent?limit=${limit}`);
    if (!response.ok) {
      throw new Error("Failed to fetch recent calls");
    }
    return response.json();
  }
} 