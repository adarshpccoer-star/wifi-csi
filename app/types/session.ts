export type SessionStatus = "CREATED" | "ACTIVE" | "COMPLETED";

export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}
