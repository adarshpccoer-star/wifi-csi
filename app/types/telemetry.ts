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
