export interface TelemetryFeatures {
  meanAmplitude?: number;
  amplitudeStd?: number;
  rmsAmplitude?: number;
  frameDifference?: number;
  rollingVariation?: number;
}

export interface TelemetryData extends TelemetryFeatures {
  rssi?: number;
  timestamp?: string;
  deviceId?: string;
}
