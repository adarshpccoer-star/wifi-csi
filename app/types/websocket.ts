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
  deviceId: string;
  sessionId: string;
  detection: Detection;
  analysis: {
    movementScore: number;
    presenceScore: number;
    survivorProbability: number;
    reason: string;
  };
}

export interface WSDeviceOfflineMessage {
  type: "device_offline";
  deviceId: string;
  status: "OFFLINE";
}

export type WSIncomingMessage =
  | WSConnectedMessage
  | WSHeartbeatAckMessage
  | WSTelemetryAckMessage
  | WSDetectionMessage
  | WSDeviceOfflineMessage;
