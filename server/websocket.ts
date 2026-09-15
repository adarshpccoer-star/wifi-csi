import "dotenv/config";

import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/utils/supabse/server";
import { telemetrySchema } from "@/lib/vaildation/telemetry";
import { mlPredictionSchema } from "@/lib/vaildation/mlPrediction";
import { translatePrediction } from "@/lib/ml/translatePrediction";
import { detectMovement } from "@/lib/detection/detection-engine";

const PORT = Number(process.env.PORT) || 3001;
const OFFLINE_THRESHOLD_MS = 15_000;

// Hoisted schema definition (instantiated once)
const mlMessageSchema = z.object({
  type: z.literal("ml_prediction"),
  sessionId: z.string().uuid(),
  data: mlPredictionSchema,
});

const wss = new WebSocketServer({
  port: PORT,
  host: "0.0.0.0",
});

console.log(`WebSocket server running on port ${PORT}`);

// --------------------------------------------------
// CONNECTION
// --------------------------------------------------

wss.on("connection", (socket) => {
  console.log("WebSocket client connected");

  socket.send(
    JSON.stringify({
      type: "connected",
      message: "Connected to CSI Rescue WebSocket server",
      timestamp: new Date().toISOString(),
    }),
  );

  // ------------------------------------------------
  // MESSAGE
  // ------------------------------------------------

  socket.on("message", async (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      console.log("Received:", message);

      // ==============================================
      // HEARTBEAT
      // ==============================================

      if (message.type === "heartbeat") {
        const { deviceId } = message;

        if (!deviceId) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "deviceId is required",
            }),
          );
          return;
        }

        const now = new Date().toISOString();

        const { data: updatedDevice, error } = await supabaseAdmin
          .from("devices")
          .update({
            status: "ONLINE",
            last_seen: now,
          })
          .eq("device_id", deviceId)
          .select("device_id, status, last_seen")
          .single();

        if (error || !updatedDevice) {
          console.error("Failed to update device heartbeat:", error);

          socket.send(
            JSON.stringify({
              type: "error",
              message: "Device not found or failed to update",
              deviceId,
            }),
          );
          return;
        }

        console.log(`Heartbeat updated: ${updatedDevice.device_id} → ONLINE`);

        socket.send(
          JSON.stringify({
            type: "heartbeat_ack",
            deviceId: updatedDevice.device_id,
            status: updatedDevice.status,
            lastSeen: updatedDevice.last_seen,
            timestamp: now,
          }),
        );

        return;
      }

      // ==============================================
      // TELEMETRY (LEGACY HANDLER)
      // ==============================================

      if (message.type === "telemetry") {
        const result = telemetrySchema.safeParse(message);

        if (!result.success) {
          socket.send(
            JSON.stringify({
              type: "telemetry_error",
              message: "Invalid telemetry",
              details: result.error.flatten(),
            }),
          );
          return;
        }

        const telemetry = result.data;
        const { deviceId, sessionId, timestamp, rssi, features } = telemetry;

        // 1. CHECK SESSION
        const { data: session, error: sessionError } = await supabaseAdmin
          .from("sessions")
          .select("id, status")
          .eq("id", sessionId)
          .single();

        if (sessionError || !session) {
          socket.send(
            JSON.stringify({
              type: "telemetry_error",
              deviceId,
              message: "Session not found",
            }),
          );
          return;
        }

        if (session.status !== "ACTIVE") {
          socket.send(
            JSON.stringify({
              type: "telemetry_error",
              deviceId,
              message: "Session is not active",
            }),
          );
          return;
        }

        // 2. FIND DEVICE
        const { data: device, error: deviceError } = await supabaseAdmin
          .from("devices")
          .select("id, device_id, status")
          .eq("device_id", deviceId)
          .single();

        if (deviceError || !device) {
          socket.send(
            JSON.stringify({
              type: "telemetry_error",
              deviceId,
              message: "Device not found",
            }),
          );
          return;
        }

        // 3. MARK DEVICE ONLINE
        const { error: deviceUpdateError } = await supabaseAdmin
          .from("devices")
          .update({
            status: "ONLINE",
            last_seen: timestamp,
          })
          .eq("id", device.id);

        if (deviceUpdateError) {
          console.error("Failed to update device status:", deviceUpdateError);
        }

        // 4. SAVE TELEMETRY
        const { data: telemetryRow, error: telemetryError } =
          await supabaseAdmin
            .from("telemetry")
            .insert({
              session_id: sessionId,
              device_id: device.id,
              timestamp,
              rssi,
              mean_amplitude: features.meanAmplitude,
              amplitude_std: features.amplitudeStd,
              rms_amplitude: features.rmsAmplitude,
              frame_difference: features.frameDifference,
              rolling_variation: features.rollingVariation,
            })
            .select()
            .single();

        if (telemetryError || !telemetryRow) {
          console.error("Telemetry insert error:", telemetryError);

          socket.send(
            JSON.stringify({
              type: "telemetry_error",
              deviceId,
              message: "Failed to save telemetry",
            }),
          );
          return;
        }

        // 5. RUN DETECTION ENGINE
        const detection = detectMovement({
          rssi,
          meanAmplitude: features.meanAmplitude,
          amplitudeStd: features.amplitudeStd,
          rmsAmplitude: features.rmsAmplitude,
          frameDifference: features.frameDifference,
          rollingVariation: features.rollingVariation,
        });

        console.log(`Detection ${deviceId}:`, detection);

        // 6. NO DETECTION
        if (!detection.detected) {
          socket.send(
            JSON.stringify({
              type: "telemetry_ack",
              deviceId,
              sessionId,
              detected: false,
              telemetryId: telemetryRow.id,
              timestamp,
              analysis: {
                movementScore: detection.movementScore,
                presenceScore: detection.presenceScore,
                survivorProbability: detection.survivorProbability,
                reason: detection.reason,
              },
            }),
          );
          return;
        }

        // 7. SAVE DETECTION
        const { data: detectionRow, error: detectionError } =
          await supabaseAdmin
            .from("detections")
            .insert({
              session_id: sessionId,
              timestamp,
              zone: null,
              type: detection.type,
              presence_score: detection.presenceScore,
              movement_score: detection.movementScore,
              survivor_probability: detection.survivorProbability,
              status: "UNVERIFIED",
              contributing_devices: [device.id],
            })
            .select()
            .single();

        if (detectionError || !detectionRow) {
          console.error("Detection insert error:", detectionError);

          socket.send(
            JSON.stringify({
              type: "telemetry_error",
              deviceId,
              message: "Detection detected but failed to save",
            }),
          );
          return;
        }

        // 8. BROADCAST DETECTION
        const detectionMessage = JSON.stringify({
          type: "detection",
          deviceId,
          sessionId,
          detection: detectionRow,
          analysis: {
            movementScore: detection.movementScore,
            presenceScore: detection.presenceScore,
            survivorProbability: detection.survivorProbability,
            reason: detection.reason,
          },
          timestamp,
        });

        broadcast(detectionMessage);

        socket.send(
          JSON.stringify({
            type: "telemetry_ack",
            deviceId,
            sessionId,
            detected: true,
            telemetryId: telemetryRow.id,
            detectionId: detectionRow.id,
            timestamp,
            analysis: {
              movementScore: detection.movementScore,
              presenceScore: detection.presenceScore,
              survivorProbability: detection.survivorProbability,
              reason: detection.reason,
            },
          }),
        );
        return;
      }

      // ==============================================
      // ML PREDICTION
      // ==============================================

      if (message.type === "ml_prediction") {
        const result = mlMessageSchema.safeParse(message);

        if (!result.success) {
          socket.send(
            JSON.stringify({
              type: "ml_prediction_error",
              message: "Invalid ML prediction message",
              details: result.error.flatten(),
            }),
          );
          return;
        }

        const { sessionId, data: mlData } = result.data;

        // 1. CHECK SESSION
        const { data: session, error: sessionError } = await supabaseAdmin
          .from("sessions")
          .select("id, status")
          .eq("id", sessionId)
          .single();

        if (sessionError || !session) {
          socket.send(
            JSON.stringify({
              type: "ml_prediction_error",
              sessionId,
              message: "Session not found",
            }),
          );
          return;
        }

        if (session.status !== "ACTIVE") {
          socket.send(
            JSON.stringify({
              type: "ml_prediction_error",
              sessionId,
              message: "Session is not active",
            }),
          );
          return;
        }

        // 2. SAVE ML TELEMETRY
        const { data: telemetryRow, error: telemetryError } =
          await supabaseAdmin
            .from("telemetry")
            .insert({
              session_id: sessionId,
              timestamp: mlData.timestamp,
              temporal_cv_a: mlData.telemetry.temporal_cv_a,
              temporal_cv_b: mlData.telemetry.temporal_cv_b,
              spatial_mean_a: mlData.telemetry.spatial_mean_a,
              spatial_mean_b: mlData.telemetry.spatial_mean_b,
              differential_ratio: mlData.telemetry.differential_ratio,
            })
            .select()
            .single();

        if (telemetryError || !telemetryRow) {
          console.error("ML telemetry insert error:", telemetryError);

          socket.send(
            JSON.stringify({
              type: "ml_prediction_error",
              sessionId,
              message: "Failed to save ML telemetry",
            }),
          );
          return;
        }

        // 3. UPDATE HARDWARE STATUS
        await updateMLHardwareStatus(mlData.hardware);

        // 4. BROADCAST ML PREDICTION
        broadcast(
          JSON.stringify({
            type: "ml_prediction",
            sessionId,
            data: mlData,
            timestamp: mlData.timestamp,
          }),
        );

        // 5. TRANSLATE PREDICTION
        const translated = translatePrediction(mlData.prediction);

        // 6. NO PRESENCE
        if (!translated) {
          socket.send(
            JSON.stringify({
              type: "ml_prediction_ack",
              sessionId,
              detected: false,
              telemetryId: telemetryRow.id,
              timestamp: mlData.timestamp,
            }),
          );
          return;
        }

        // 7. SAVE DETECTION
        const { data: detectionRow, error: detectionError } =
          await supabaseAdmin
            .from("detections")
            .insert({
              session_id: sessionId,
              timestamp: mlData.timestamp,
              zone: translated.zone,
              type: translated.type,
              presence_score: translated.presence_score,
              movement_score: translated.movement_score,
              survivor_probability: translated.survivor_probability,
              status: "UNVERIFIED",
              contributing_devices: [],
              environment_mode: mlData.environment_mode,
              activity: translated.activity,
              ml_confidence: translated.ml_confidence,
              alert_level: translated.alert_level,
            })
            .select()
            .single();

        if (detectionError || !detectionRow) {
          console.error("ML detection insert error:", detectionError);

          socket.send(
            JSON.stringify({
              type: "ml_prediction_error",
              sessionId,
              message:
                "ML prediction detected presence but failed to save detection",
            }),
          );
          return;
        }

        // 8. BROADCAST COMPATIBLE DETECTION
        const detectionMessage = JSON.stringify({
          type: "detection",
          sessionId,
          detection: detectionRow,
          analysis: {
            movementScore: translated.movement_score,
            presenceScore: translated.presence_score,
            survivorProbability: translated.survivor_probability,
            reason: `${translated.activity} detected with ${Math.round(
              translated.ml_confidence * 100,
            )}% confidence`,
          },
          timestamp: mlData.timestamp,
        });

        broadcast(detectionMessage);

        // 9. ACK ML WORKER
        socket.send(
          JSON.stringify({
            type: "ml_prediction_ack",
            sessionId,
            detected: true,
            telemetryId: telemetryRow.id,
            detectionId: detectionRow.id,
            timestamp: mlData.timestamp,
            prediction: {
              presence: mlData.prediction.presence,
              activity: mlData.prediction.activity,
              zone: mlData.prediction.zone,
              confidence: mlData.prediction.confidence,
              alert_level: mlData.prediction.alert_level,
            },
          }),
        );
        return;
      }

      // ==============================================
      // UNKNOWN MESSAGE TYPE
      // ==============================================

      socket.send(
        JSON.stringify({
          type: "error",
          message: `Unknown message type: ${message.type}`,
        }),
      );
    } catch (error) {
      console.error("Invalid WebSocket message:", error);

      socket.send(
        JSON.stringify({
          type: "error",
          message: "Invalid JSON message",
        }),
      );
    }
  });

  // ------------------------------------------------
  // CLOSE
  // ------------------------------------------------

  socket.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  // ------------------------------------------------
  // ERROR
  // ------------------------------------------------

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// --------------------------------------------------
// BROADCAST HELPER
// --------------------------------------------------

function broadcast(message: string) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error("Broadcast failed:", error);
      }
    }
  });
}

// --------------------------------------------------
// HARDWARE STATUS HELPER
// --------------------------------------------------

async function updateMLHardwareStatus(hardware: {
  esp1_status: "online" | "degraded" | "offline";
  esp2_status: "online" | "degraded" | "offline";
  esp3_tx_status: "active" | "degraded" | "offline";
}) {
  const now = new Date().toISOString();

  const statusMap = {
    online: "ONLINE",
    degraded: "DEGRADED",
    offline: "OFFLINE",
  } as const;

  // ESP1
  const esp1Update: {
    status: "ONLINE" | "DEGRADED" | "OFFLINE";
    health_status: string;
    last_seen?: string;
  } = {
    status: statusMap[hardware.esp1_status],
    health_status: hardware.esp1_status,
  };

  if (hardware.esp1_status !== "offline") {
    esp1Update.last_seen = now;
  }

  const { error: esp1Error } = await supabaseAdmin
    .from("devices")
    .update(esp1Update)
    .eq("device_id", "ESP32-01");

  if (esp1Error) {
    console.error("Failed to update ESP1 status:", esp1Error);
  }

  // ESP2
  const esp2Update: {
    status: "ONLINE" | "DEGRADED" | "OFFLINE";
    health_status: string;
    last_seen?: string;
  } = {
    status: statusMap[hardware.esp2_status],
    health_status: hardware.esp2_status,
  };

  if (hardware.esp2_status !== "offline") {
    esp2Update.last_seen = now;
  }

  const { error: esp2Error } = await supabaseAdmin
    .from("devices")
    .update(esp2Update)
    .eq("device_id", "ESP32-02");

  if (esp2Error) {
    console.error("Failed to update ESP2 status:", esp2Error);
  }

  // ESP3 / TRANSMITTER
  const esp3Status =
    hardware.esp3_tx_status === "active"
      ? "ONLINE"
      : hardware.esp3_tx_status === "degraded"
        ? "DEGRADED"
        : "OFFLINE";

  const esp3HealthStatus =
    hardware.esp3_tx_status === "active" ? "online" : hardware.esp3_tx_status;

  const esp3Update: {
    status: "ONLINE" | "DEGRADED" | "OFFLINE";
    health_status: string;
    last_seen?: string;
  } = {
    status: esp3Status,
    health_status: esp3HealthStatus,
  };

  if (hardware.esp3_tx_status !== "offline") {
    esp3Update.last_seen = now;
  }

  const { error: esp3Error } = await supabaseAdmin
    .from("devices")
    .update(esp3Update)
    .eq("device_id", "ESP32-03");

  if (esp3Error) {
    console.error("Failed to update ESP3 TX status:", esp3Error);
  }
}

// --------------------------------------------------
// AUTOMATIC OFFLINE DETECTION
// --------------------------------------------------

setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS).toISOString();

    const { data: devices, error } = await supabaseAdmin
      .from("devices")
      .select("id, device_id, status, last_seen")
      .eq("status", "ONLINE")
      .lt("last_seen", cutoff);

    if (error) {
      console.error("Offline check failed:", error);
      return;
    }

    if (!devices || devices.length === 0) {
      return;
    }

    for (const device of devices) {
      const { error: updateError } = await supabaseAdmin
        .from("devices")
        .update({
          status: "OFFLINE",
        })
        .eq("id", device.id);

      if (updateError) {
        console.error(
          `Failed to mark ${device.device_id} offline:`,
          updateError,
        );
        continue;
      }

      console.log(`Device offline: ${device.device_id}`);

      const message = JSON.stringify({
        type: "device_offline",
        deviceId: device.device_id,
        status: "OFFLINE",
        lastSeen: device.last_seen,
        timestamp: new Date().toISOString(),
      });

      broadcast(message);
    }
  } catch (error) {
    console.error("Offline detection error:", error);
  }
}, 5_000);

// --------------------------------------------------
// SERVER ERROR & SHUTDOWN
// --------------------------------------------------

wss.on("error", (error) => {
  console.error("WebSocket server error:", error);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing WebSocket server...");

  wss.close(() => {
    console.log("WebSocket server closed.");
    process.exit(0);
  });
});
