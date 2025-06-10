const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const defaultHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

export interface SummaryStats {
    total_applicants: { current: number; change_percent: number };
    active_jobs: { current: number; change: number };
    total_messages: { current: number; change_percent: number };
    total_calls: { current: number; change_percent: number };
}

export interface ConversationActivity {
    date: string;
    messages: number;
    calls: number;
}

export interface ApplicantsByJob {
    job_title: string;
    count: number;
}

export const statsApi = {
    async getSummaryStats(): Promise<SummaryStats> {
        const response = await fetch(`${API_BASE_URL}/stats/summary`, {
            credentials: "include",
            headers: defaultHeaders,
        });
        if (!response.ok) throw new Error("Failed to fetch summary stats");
        return response.json();
    },

    async getConversationActivity(period: string = "7d"): Promise<ConversationActivity[]> {
        const response = await fetch(`${API_BASE_URL}/stats/conversation-activity?period=${period}`, {
            credentials: "include",
            headers: defaultHeaders,
        });
        if (!response.ok) throw new Error("Failed to fetch conversation activity");
        return response.json();
    },

    async getApplicantsByJob(): Promise<ApplicantsByJob[]> {
        const response = await fetch(`${API_BASE_URL}/stats/applicants-by-job`, {
            credentials: "include",
            headers: defaultHeaders,
        });
        if (!response.ok) throw new Error("Failed to fetch applicants by job");
        return response.json();
    }
}; 