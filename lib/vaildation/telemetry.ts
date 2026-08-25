import { z } from "zod";

export const telemetrySchema = z.object({
  deviceId: z.string().min(1),
  sessionId: z.string().uuid(),

  timestamp: z.string().datetime(),

  rssi: z.number().optional(),

  features: z.object({
    meanAmplitude: z.number().optional(),
    amplitudeStd: z.number().optional(),
    rmsAmplitude: z.number().optional(),
    frameDifference: z.number().optional(),
    rollingVariation: z.number().optional(),
  }),
});

export type TelemetryInput = z.infer<typeof telemetrySchema>;
