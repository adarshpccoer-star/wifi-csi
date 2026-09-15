export interface TelemetryData {
  id?: string;

  session_id?: string;

  deviceId?: string;

  timestamp: string;

  // Existing telemetry
  rssi?: number | null;

  meanAmplitude?: number | null;

  amplitudeStd?: number | null;

  rmsAmplitude?: number | null;

  frameDifference?: number | null;

  rollingVariation?: number | null;

  // ML telemetry
  temporalCvA?: number | null;

  temporalCvB?: number | null;

  spatialMeanA?: number | null;

  spatialMeanB?: number | null;

  differentialRatio?: number | null;
}

/** The telemetry record shape returned by the session overview API. */
export interface TelemetryRow {
  id?: string;

  session_id?: string;

  device_id?: string;

  timestamp: string;

  // Existing telemetry
  rssi?: number | null;

  mean_amplitude?: number | null;

  amplitude_std?: number | null;

  rms_amplitude?: number | null;

  frame_difference?: number | null;

  rolling_variation?: number | null;

  // ML telemetry
  temporal_cv_a?: number | null;

  temporal_cv_b?: number | null;

  spatial_mean_a?: number | null;

  spatial_mean_b?: number | null;

  differential_ratio?: number | null;
}
