import { z } from "zod";

export const mlPredictionSchema = z.object({
  timestamp: z.string().datetime(),

  environment_mode: z.enum(["room", "rubble"]),

  prediction: z.object({
    presence: z.boolean(),

    activity: z.enum(["empty", "static_presence", "dynamic_movement"]),

    zone: z.enum(["near_esp1", "near_esp2", "near_tx", "center", "none"]),

    confidence: z.number().min(0).max(1),

    alert_level: z.enum(["normal", "medium", "high"]),
  }),

  telemetry: z.object({
    temporal_cv_a: z.number(),
    temporal_cv_b: z.number(),
    spatial_mean_a: z.number(),
    spatial_mean_b: z.number(),
    differential_ratio: z.number(),
  }),

  hardware: z.object({
    esp1_status: z.enum(["online", "degraded", "offline"]),

    esp2_status: z.enum(["online", "degraded", "offline"]),

    esp3_tx_status: z.enum(["active", "degraded", "offline"]),
  }),
});

export type MLPredictionPayload = z.infer<typeof mlPredictionSchema>;
