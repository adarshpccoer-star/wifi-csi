import "dotenv/config";
import { WebSocketServer, WebSocket } from "ws";
import { supabaseAdmin } from "@/lib/utils/supabse/server";
import { telemetrySchema } from "@/lib/vaildation/telemetry";
import { detectMovement } from "@/lib/detection/detection-engine";

const PORT = 3001;
const OFFLINE_THRESHOLD_MS = 15_000;

const wss = new WebSocketServer({
  port: PORT,
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", (socket) => {
  console.log("WebSocket client connected");

  socket.send(
    JSON.stringify({
      type: "connected",
      message: "Connected to CSI Rescue WebSocket server",
      timestamp: new Date().toISOString(),
    }),
  );

  socket.on("message", async (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      console.log("Received:", message);

      // ----------------------------------------
      // HEARTBEAT
      // ----------------------------------------

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

        // Perform atomic update directly using device_id
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

        // Send confirmation ACK
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

        // ----------------------------------------
        // 1. CHECK SESSION
        // ----------------------------------------

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

        // ----------------------------------------
        // 2. FIND DEVICE
        // ----------------------------------------

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

        // ----------------------------------------
        // 3. MARK DEVICE ONLINE
        // ----------------------------------------

        await supabaseAdmin
          .from("devices")
          .update({
            status: "ONLINE",
            last_seen: timestamp,
          })
          .eq("id", device.id);

        // ----------------------------------------
        // 4. SAVE TELEMETRY
        // ----------------------------------------

        const { data: telemetryRow, error: telemetryError } =
          await supabaseAdmin
            .from("telemetry")
            .insert({
              session_id: sessionId,
              device_id: device.id,
              timestamp,

              rssi: rssi,

              mean_amplitude: features.meanAmplitude,

              amplitude_std: features.amplitudeStd,

              rms_amplitude: features.rmsAmplitude,

              frame_difference: features.frameDifference,

              rolling_variation: features.rollingVariation,
            })
            .select()
            .single();

        if (telemetryError) {
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

        // ----------------------------------------
        // 5. RUN DETECTION ENGINE
        // ----------------------------------------

        const detection = detectMovement({
          rssi,

          meanAmplitude: features.meanAmplitude,

          amplitudeStd: features.amplitudeStd,

          rmsAmplitude: features.rmsAmplitude,

          frameDifference: features.frameDifference,

          rollingVariation: features.rollingVariation,
        });

        console.log(`Detection ${deviceId}:`, detection);

        // ----------------------------------------
        // 6. NO DETECTION
        // ----------------------------------------

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

        // ----------------------------------------
        // 7. SAVE DETECTION
        // ----------------------------------------

        const { data: detectionRow, error: detectionError } =
          await supabaseAdmin
            .from("detections")
            .insert({
              session_id: sessionId,

              timestamp,

              // We don't have zone in your telemetry schema yet.
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

        if (detectionError) {
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

        // ----------------------------------------
        // 8. BROADCAST DETECTION
        // ----------------------------------------

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

        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(detectionMessage);
          }
        });
      }
      // ----------------------------------------
      // UNKNOWN MESSAGE
      // ----------------------------------------

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

  socket.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// ----------------------------------------
// AUTOMATIC OFFLINE DETECTION
// ----------------------------------------

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

      // Broadcast to all connected WebSocket clients
      const message = JSON.stringify({
        type: "device_offline",
        deviceId: device.device_id,
        status: "OFFLINE",
        lastSeen: device.last_seen,
        timestamp: new Date().toISOString(),
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  } catch (error) {
    console.error("Offline detection error:", error);
  }
}, 5_000);
