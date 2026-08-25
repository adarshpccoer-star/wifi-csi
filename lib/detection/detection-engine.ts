import { DetectionInput, DetectionResult } from "./types";

export function detectMovement(input: DetectionInput): DetectionResult {
  const frameDifference = input.frameDifference ?? 0;

  const rollingVariation = input.rollingVariation ?? 0;

  const amplitudeStd = input.amplitudeStd ?? 0;

  /*
   * IMPORTANT:
   *
   * These are temporary hackathon thresholds.
   *
   * They are NOT a scientifically validated
   * survivor detection model.
   *
   * Replace this function with your friend's
   * trained ML model later.
   */

  const movementScore = Math.min(
    1,
    (frameDifference * 0.5 + rollingVariation * 0.3 + amplitudeStd * 0.2) / 20,
  );

  let type: "MOVEMENT" | "PRESENCE" | "POSSIBLE_SURVIVOR";

  if (movementScore >= 0.75) {
    type = "POSSIBLE_SURVIVOR";
  } else if (movementScore >= 0.4) {
    type = "MOVEMENT";
  } else {
    type = "PRESENCE";
  }

  const detected = movementScore >= 0.4;

  const presenceScore = Math.min(1, (input.meanAmplitude ?? 0) / 100);

  const survivorProbability =
    type === "POSSIBLE_SURVIVOR"
      ? movementScore * 0.8 + presenceScore * 0.2
      : 0;

  return {
    detected,

    type,

    presenceScore: Number(presenceScore.toFixed(3)),

    movementScore: Number(movementScore.toFixed(3)),

    survivorProbability: Number(Math.min(1, survivorProbability).toFixed(3)),

    reason:
      type === "POSSIBLE_SURVIVOR"
        ? "High temporal CSI variation detected"
        : type === "MOVEMENT"
          ? "CSI movement pattern detected"
          : "Low CSI variation",
  };
}
