export type SessionStatus = "CREATED" | "ACTIVE" | "COMPLETED";

export interface Session {
  id: string;
  name: string;
  area?: string | null;
  status: SessionStatus;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}
