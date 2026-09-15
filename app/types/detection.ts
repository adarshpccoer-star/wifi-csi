export type DetectionType = "MOVEMENT" | "PRESENCE" | "POSSIBLE_SURVIVOR";

export type DetectionStatus = "UNVERIFIED" | "VERIFIED" | "DISMISSED";

export type DetectionActivity =
  | "empty"
  | "static_presence"
  | "dynamic_movement";

export type EnvironmentMode = "room" | "rubble";

export type AlertLevel = "normal" | "medium" | "high";

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

  // ML fields
  environment_mode?: EnvironmentMode;

  activity?: DetectionActivity;

  ml_confidence?: number;

  alert_level?: AlertLevel;
}
