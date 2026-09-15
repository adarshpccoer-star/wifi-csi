import WebSocket from "ws";

const SESSION_ID = "0c6e770a-7354-4363-8b62-2e029d0127fe";

const ws = new WebSocket("ws://localhost:3001");

ws.on("open", () => {
  console.log("Connected");

  const message = {
    type: "ml_prediction",

    sessionId: SESSION_ID,

    data: {
      timestamp: new Date().toISOString(),

      environment_mode: "rubble",

      prediction: {
        presence: false,
        activity: "empty",
        zone: "none",
        confidence: 0.95,
        alert_level: "normal",
      },

      telemetry: {
        temporal_cv_a: 0.342,
        temporal_cv_b: 0.081,
        spatial_mean_a: 18.2,
        spatial_mean_b: 24.5,
        differential_ratio: 4.22,
      },

      hardware: {
        esp1_status: "online",
        esp2_status: "online",
        esp3_tx_status: "active",
      },
    },
  };

  console.log("Sending ML prediction:");
  console.dir(message, { depth: null });

  ws.send(JSON.stringify(message));
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());

  console.log("Server:");
  console.dir(message, { depth: null });
});

ws.on("close", () => {
  console.log("Connection closed");
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});

setTimeout(() => {
  console.log("Test finished.");
  ws.close();
}, 3000);
