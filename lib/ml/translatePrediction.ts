import type { DetectionType } from "../detection/types";

export type MLPrediction = {
  presence: boolean;
  activity: "empty" | "static_presence" | "dynamic_movement";
  zone: "near_esp1" | "near_esp2" | "near_tx" | "center" | "none";
  confidence: number;
  alert_level: "normal" | "medium" | "high";
};

export function translatePrediction(prediction: MLPrediction) {
  if (!prediction.presence) {
    return null;
  }

  const type: DetectionType =
    prediction.activity === "static_presence"
      ? "POSSIBLE_SURVIVOR"
      : "MOVEMENT";

  return {
    type,
    presence_score: prediction.confidence,
    movement_score:
      prediction.activity === "dynamic_movement" ? prediction.confidence : 0,
    survivor_probability:
      prediction.activity === "static_presence" ? prediction.confidence : 0,
    zone: prediction.zone,
    ml_confidence: prediction.confidence,
    activity: prediction.activity,
    alert_level: prediction.alert_level,
  };
}
