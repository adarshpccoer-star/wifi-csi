export type DetectionType = "MOVEMENT" | "PRESENCE" | "POSSIBLE_SURVIVOR";
export type DetectionStatus = "UNVERIFIED" | "VERIFIED" | "DISMISSED";

export interface Detection {
  id?: string;
  session_id: string;
  timestamp: string;
  zone: string | null;
  type: DetectionType;
  presence_score: number;
  movement_score: number;
  survivor_probability: number;
  status: DetectionStatus;
  contributing_devices: string[];
  reason?: string;
}
