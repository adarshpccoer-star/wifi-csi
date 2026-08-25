import WebSocket from "ws";

const DEVICE_ID = "ESP32-01";
const SESSION_ID = "545fe095-9073-4ece-a7a2-af690bbbb3fb";

const ws = new WebSocket("ws://localhost:3001");

let heartbeatTimer: NodeJS.Timeout;
let telemetryTimer: NodeJS.Timeout;

ws.on("open", () => {
  console.log("Connected");

  // ----------------------------------------
  // HEARTBEAT
  // ----------------------------------------

  const sendHeartbeat = () => {
    const message = {
      type: "heartbeat",
      deviceId: DEVICE_ID,
    };

    console.log("Sending heartbeat:", message);

    ws.send(JSON.stringify(message));
  };

  sendHeartbeat();

  heartbeatTimer = setInterval(sendHeartbeat, 5000);

  // ----------------------------------------
  // TELEMETRY
  // ----------------------------------------

  telemetryTimer = setInterval(() => {
    const message = {
      type: "telemetry",

      deviceId: DEVICE_ID,

      sessionId: SESSION_ID,

      timestamp: new Date().toISOString(),

      rssi: -48,

      features: {
        meanAmplitude: 12.4,
        amplitudeStd: 2.1,
        rmsAmplitude: 13.2,
        frameDifference: 0.72,
        rollingVariation: 0.31,
      },
    };

    console.log("Sending telemetry:", message);

    ws.send(JSON.stringify(message));
  }, 3000);
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());

  console.log("Server:", message);
});

ws.on("close", () => {
  console.log("Connection closed");

  clearInterval(heartbeatTimer);
  clearInterval(telemetryTimer);
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});

// Ctrl+C
process.on("SIGINT", () => {
  console.log("\nStopping test client...");

  clearInterval(heartbeatTimer);
  clearInterval(telemetryTimer);

  ws.close();
});
