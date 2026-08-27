export interface TelemetryData {
  id?: string;
  session_id?: string;
  deviceId?: string;

  timestamp: string;

  rssi?: number | null;
  meanAmplitude?: number | null;
  amplitudeStd?: number | null;
  rmsAmplitude?: number | null;
  frameDifference?: number | null;
  rollingVariation?: number | null;
}

/** The telemetry record shape returned by the session overview API. */
export interface TelemetryRow {
  id?: string;
  session_id?: string;
  device_id?: string;
  timestamp: string;

  rssi?: number | null;
  mean_amplitude?: number | null;
  amplitude_std?: number | null;
  rms_amplitude?: number | null;
  frame_difference?: number | null;
  rolling_variation?: number | null;
}
