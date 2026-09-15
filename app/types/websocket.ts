import { Detection } from "./detection";
import { DeviceStatus } from "./device";

export type WSMessageType =
  | "connected"
  | "heartbeat"
  | "heartbeat_ack"
  | "telemetry"
  | "telemetry_ack"
  | "telemetry_error"
  | "detection"
  | "device_offline"
  | "ml_prediction"
  | "ml_prediction_ack"
  | "ml_prediction_error"
  | "error";

export interface WSConnectedMessage {
  type: "connected";
  message: string;
  timestamp: string;
}

export interface WSHeartbeatAckMessage {
  type: "heartbeat_ack";
  deviceId: string;
  status: DeviceStatus;
  lastSeen: string;
  timestamp: string;
}

export interface WSTelemetryAckMessage {
  type: "telemetry_ack";
  deviceId: string;
  sessionId: string;
  detected: boolean;
  telemetryId: string;
  timestamp: string;
  analysis: {
    movementScore: number;
    presenceScore: number;
    survivorProbability: number;
    reason: string;
  };
}

export interface WSDetectionMessage {
  type: "detection";
  deviceId?: string;
  sessionId: string;
  detection: Detection;
  analysis: {
    movementScore: number;
    presenceScore: number;
    survivorProbability: number;
    reason: string;
  };
  timestamp?: string;
}

export interface WSDeviceOfflineMessage {
  type: "device_offline";
  deviceId: string;
  status: "OFFLINE";
}

export interface WSMLPredictionMessage {
  type: "ml_prediction";
  sessionId: string;
  data: {
    timestamp: string;
    environment_mode: "room" | "rubble";
    prediction: {
      presence: boolean;
      activity: "empty" | "static_presence" | "dynamic_movement";
      zone: "near_esp1" | "near_esp2" | "near_tx" | "center" | "none";
      confidence: number;
      alert_level: "normal" | "medium" | "high";
    };
    telemetry: {
      temporal_cv_a: number;
      temporal_cv_b: number;
      spatial_mean_a: number;
      spatial_mean_b: number;
      differential_ratio: number;
    };
    hardware: {
      esp1_status: "online" | "degraded" | "offline";
      esp2_status: "online" | "degraded" | "offline";
      esp3_tx_status: "active" | "degraded" | "offline";
    };
  };
  timestamp: string;
}

export interface WSMLPredictionAckMessage {
  type: "ml_prediction_ack";
  sessionId: string;
  detected: boolean;
  telemetryId: string;
  detectionId?: string;
  timestamp: string;
  prediction?: {
    presence: boolean;
    activity: "empty" | "static_presence" | "dynamic_movement";
    zone: "near_esp1" | "near_esp2" | "near_tx" | "center" | "none";
    confidence: number;
    alert_level: "normal" | "medium" | "high";
  };
}

export interface WSMLPredictionErrorMessage {
  type: "ml_prediction_error";
  sessionId?: string;
  message: string;
  details?: unknown;
}

export type WSIncomingMessage =
  | WSConnectedMessage
  | WSHeartbeatAckMessage
  | WSTelemetryAckMessage
  | WSDetectionMessage
  | WSDeviceOfflineMessage
  | WSMLPredictionMessage
  | WSMLPredictionAckMessage
  | WSMLPredictionErrorMessage;
