export type DetectionType = "MOVEMENT" | "PRESENCE" | "POSSIBLE_SURVIVOR";

export type DetectionStatus = "UNVERIFIED" | "VERIFIED" | "DISMISSED";

export interface DetectionInput {
  rssi?: number;

  meanAmplitude?: number;
  amplitudeStd?: number;
  rmsAmplitude?: number;
  frameDifference?: number;
  rollingVariation?: number;
  mlConfidence?: number;
}

export interface DetectionResult {
  detected: boolean;

  type: DetectionType;

  presenceScore: number;
  movementScore: number;
  survivorProbability: number;

  reason: string;
}
