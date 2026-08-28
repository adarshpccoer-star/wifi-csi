Absolutely. Based on the API routes you provided, here is a complete `README.md` you can use for the Python/ESP32 side and the Next.js API.

````markdown
# CSI Rescue Dashboard API

Backend API for the CSI Rescue system.

The system receives telemetry from ESP32 CSI devices, registers and monitors devices, processes telemetry through the detection engine, and stores detections and session information in Supabase.

## Architecture

```text
ESP32
  │
  │ CSI / RSSI telemetry
  ▼
Python Pipeline / Device Client
  │
  │ HTTP API
  ▼
Next.js API
  │
  ├── Device Registration
  ├── Device Heartbeat
  ├── Telemetry Processing
  ├── Movement Detection
  └── Session Management
  │
  ▼
Supabase
  │
  ├── devices
  ├── sessions
  └── detections
  │
  ▼
Dashboard
```
````

---

# Base URL

For local development:

```text
http://localhost:3000
```

For production, replace this with the deployed Next.js application URL.

Example:

```text
https://your-domain.com
```

---

# API Overview

| Method | Endpoint                     | Purpose                                |
| ------ | ---------------------------- | -------------------------------------- |
| GET    | `/api/devices`               | Get all devices                        |
| GET    | `/api/devices/:id`           | Get a specific device                  |
| POST   | `/api/devices/:id/register`  | Register a device                      |
| POST   | `/api/devices/:id/heartbeat` | Update device heartbeat                |
| POST   | `/api/detections`            | Process telemetry and create detection |
| POST   | `/api/telemetry`             | Process telemetry and create detection |
| POST   | `/api/sessions`              | Create a session                       |
| GET    | `/api/sessions`              | Get all sessions                       |

---

# 1. Device Registration

Devices should register themselves before sending telemetry.

## Endpoint

```http
POST /api/devices/:id/register
```

`id` is the hardware/device identifier.

Example:

```http
POST /api/devices/ESP32_001/register
```

## Request Body

```json
{
  "name": "ESP32 Rescue Sensor 1",
  "location_x": 10,
  "location_y": 20,
  "location_z": 5
}
```

### Fields

| Field        | Type   | Required | Description                |
| ------------ | ------ | -------- | -------------------------- |
| `name`       | string | No       | Human-readable device name |
| `location_x` | number | No       | X coordinate               |
| `location_y` | number | No       | Y coordinate               |
| `location_z` | number | No       | Z coordinate               |

If location values are not provided, they default to:

```text
x = 0
y = 0
z = 0
```

## Successful Registration

HTTP `201`

```json
{
  "success": true,
  "message": "Device registered successfully",
  "device": {
    "id": "uuid",
    "device_id": "ESP32_001",
    "name": "ESP32 Rescue Sensor 1",
    "status": "OFFLINE",
    "last_seen": null,
    "location_x": 10,
    "location_y": 20,
    "location_z": 5
  }
}
```

## If Device Already Exists

HTTP `200`

```json
{
  "success": true,
  "message": "Device already registered",
  "device": {
    "id": "uuid",
    "device_id": "ESP32_001"
  }
}
```

### Recommended Device Startup Flow

When an ESP32/Python client starts:

```text
1. Generate/read device ID
2. POST /api/devices/:id/register
3. Start heartbeat
4. Start collecting CSI
5. Send telemetry
```

The registration endpoint is idempotent, so calling it again for an existing device does not create a duplicate device.

---

# 2. Get All Devices

## Endpoint

```http
GET /api/devices
```

Returns all registered devices.

The API also checks for stale devices.

A device is considered stale if it has not sent a heartbeat for more than:

```text
15 seconds
```

Stale devices are automatically changed to:

```text
OFFLINE
```

## Response

```json
{
  "success": true,
  "devices": [
    {
      "id": "uuid",
      "device_id": "ESP32_001",
      "name": "ESP32 Rescue Sensor 1",
      "status": "ONLINE",
      "last_seen": "2026-08-25T10:20:30.000Z",
      "location_x": 10,
      "location_y": 20,
      "location_z": 5
    }
  ]
}
```

---

# 3. Get Device

## Endpoint

```http
GET /api/devices/:id
```

Example:

```http
GET /api/devices/ESP32_001
```

## Response

```json
{
  "success": true,
  "device": {
    "id": "uuid",
    "device_id": "ESP32_001",
    "name": "ESP32 Rescue Sensor 1",
    "status": "ONLINE",
    "last_seen": "2026-08-25T10:20:30.000Z",
    "location_x": 10,
    "location_y": 20,
    "location_z": 5
  }
}
```

## Device Not Found

HTTP `404`

```json
{
  "error": "Device not found"
}
```

---

# 4. Device Heartbeat

Heartbeat is used to tell the backend that an ESP32/device is still alive.

## Endpoint

```http
POST /api/devices/:id/heartbeat
```

Example:

```http
POST /api/devices/ESP32_001/heartbeat
```

No request body is required.

## Response

```json
{
  "success": true,
  "message": "Heartbeat received",
  "device": {
    "id": "uuid",
    "device_id": "ESP32_001",
    "status": "ONLINE",
    "last_seen": "2026-08-25T10:20:30.000Z"
  }
}
```

The backend automatically updates:

```text
status = ONLINE
last_seen = current timestamp
```

## Recommended Heartbeat Interval

Because the backend considers devices stale after 15 seconds, send heartbeat approximately every:

```text
5 seconds
```

Example:

```text
ESP32
  │
  ├── heartbeat
  │       ↓
  │   every 5 sec
  │
  └── telemetry
```

If heartbeat stops for more than 15 seconds:

```text
ONLINE → OFFLINE
```

---

# 5. Create Session

A session represents a rescue/detection operation.

## Endpoint

```http
POST /api/sessions
```

## Request

```json
{
  "name": "Building A Search"
}
```

## Response

HTTP `201`

```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "name": "Building A Search",
    "status": "CREATED"
  }
}
```

## Session Status

The detection API currently requires:

```text
ACTIVE
```

Therefore, a session must be activated before detections can be submitted to `/api/detections`.

Typical lifecycle:

```text
CREATED
   │
   ▼
ACTIVE
   │
   ▼
COMPLETED
```

---

# 6. Get Sessions

## Endpoint

```http
GET /api/sessions
```

## Response

```json
{
  "success": true,
  "sessions": [
    {
      "id": "uuid",
      "name": "Building A Search",
      "status": "ACTIVE",
      "created_at": "2026-08-25T10:00:00.000Z"
    }
  ]
}
```

---

# 7. Telemetry API

The telemetry API receives sensor information and runs the detection engine.

## Endpoint

```http
POST /api/telemetry
```

## Request

```json
{
  "sessionId": "SESSION_UUID",
  "zone": "Zone-A",
  "telemetry": {
    "rssi": -52,
    "meanAmplitude": 31.5,
    "amplitudeStd": 4.2,
    "rmsAmplitude": 32.1,
    "frameDifference": 2.7,
    "rollingVariation": 0.8
  }
}
```

## Required Fields

```text
sessionId
zone
telemetry
```

Telemetry values:

| Field              | Type   | Description                     |
| ------------------ | ------ | ------------------------------- |
| `rssi`             | number | Wi-Fi signal strength           |
| `meanAmplitude`    | number | Mean CSI amplitude              |
| `amplitudeStd`     | number | Standard deviation of amplitude |
| `rmsAmplitude`     | number | RMS amplitude                   |
| `frameDifference`  | number | Difference between CSI frames   |
| `rollingVariation` | number | Rolling CSI variation           |

The detection engine may use these values to calculate movement/presence.

---

# 8. Detection API

The recommended device-aware detection endpoint is:

```http
POST /api/detections
```

Unlike `/api/telemetry`, this endpoint associates the detection with a specific device.

## Request

```json
{
  "sessionId": "SESSION_UUID",
  "deviceId": "DEVICE_UUID",
  "zone": "Zone-A",
  "telemetry": {
    "rssi": -52,
    "meanAmplitude": 31.5,
    "amplitudeStd": 4.2,
    "rmsAmplitude": 32.1,
    "frameDifference": 2.7,
    "rollingVariation": 0.8
  }
}
```

## Required Fields

| Field       | Type   | Required |
| ----------- | ------ | -------- |
| `sessionId` | UUID   | Yes      |
| `deviceId`  | UUID   | Yes      |
| `zone`      | string | Yes      |
| `telemetry` | object | Yes      |

---

# Detection Processing

The backend performs the following steps:

```text
Request
   │
   ▼
Validate JSON
   │
   ▼
Check Session
   │
   ├── Not found → 404
   │
   └── Not ACTIVE → 409
   │
   ▼
Check Device
   │
   ├── Not found → 404
   │
   ▼
Update Device Heartbeat
   │
   ▼
Run Detection Engine
   │
   ▼
Detection?
   │
   ├── NO
   │    └── Return analysis
   │
   └── YES
        │
        ▼
   Save detection
        │
        ▼
   Return result
```

---

# Detection Response — No Detection

```json
{
  "success": true,
  "detected": false,
  "detection": {
    "type": "NONE",
    "presenceScore": 0.2,
    "mentScore": 0.1,
    "survivorProbability": 0.15,
    "reason": "Insufficient movement"
  }
}
```

No detection is stored in the `detections` table when the detection engine returns `detected = false`.

---

# Detection Response — Detection Found

```json
{
  "success": true,
  "detected": true,
  "detection": {
    "id": "detection-uuid",
    "session_id": "session-uuid",
    "timestamp": "2026-08-25T10:25:00.000Z",
    "zone": "Zone-A",
    "type": "MOVEMENT",
    "presence_score": 0.87,
    "movement_score": 0.91,
    "survivor_probability": 0.84,
    "status": "UNVERIFIED",
    "contributing_devices": ["device-uuid"]
  },
  "analysis": {
    "movementScore": 0.91,
    "presenceScore": 0.87,
    "survivorProbability": 0.84,
    "reason": "Strong movement detected"
  }
}
```

---

# Detection Fields

| Field                  | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `type`                 | Detection classification                       |
| `presence_score`       | Estimated presence confidence                  |
| `movement_score`       | Estimated movement confidence                  |
| `survivor_probability` | Estimated probability of survivor presence     |
| `status`               | Verification state                             |
| `contributing_devices` | Devices contributing to detection              |
| `zone`                 | Physical/logical area where detection occurred |
| `timestamp`            | Detection time                                 |

A newly created detection has:

```text
status = UNVERIFIED
```

---

# Python Client Integration

The Python CSI pipeline can communicate with the Next.js API.

The Python application should perform:

```text
ESP32
  │
  │ Serial CSI data
  ▼
Python
  │
  ├── Parse CSI
  ├── Calculate amplitude
  ├── Maintain window
  ├── Calculate features
  ├── Run ML model
  │
  ▼
Next.js API
  │
  ▼
Supabase
```

---

# Python Environment

Install dependencies:

```bash
pip install requests pyserial numpy pandas joblib scikit-learn
```

If using Supabase directly from Python:

```bash
pip install supabase
```

---

# Example Python Configuration

```python
API_URL = "http://localhost:3000"

DEVICE_ID = "ESP32_001"
SESSION_ID = "SESSION_UUID"
ZONE = "Zone-A"
```

---

# Register Device from Python

```python
import requests

API_URL = "http://localhost:3000"
DEVICE_ID = "ESP32_001"

response = requests.post(
    f"{API_URL}/api/devices/{DEVICE_ID}/register",
    json={
        "name": "ESP32 Rescue Sensor 1",
        "location_x": 10,
        "location_y": 20,
        "location_z": 5
    },
)

print(response.status_code)
print(response.json())
```

---

# Send Heartbeat from Python

```python
import requests

response = requests.post(
    f"{API_URL}/api/devices/{DEVICE_ID}/heartbeat"
)

print(response.json())
```

Recommended:

```python
import time

while True:
    requests.post(
        f"{API_URL}/api/devices/{DEVICE_ID}/heartbeat"
    )

    time.sleep(5)
```

---

# Send Telemetry from Python

```python
import requests

telemetry = {
    "rssi": -52,
    "meanAmplitude": 31.5,
    "amplitudeStd": 4.2,
    "rmsAmplitude": 32.1,
    "frameDifference": 2.7,
    "rollingVariation": 0.8,
}

response = requests.post(
    f"{API_URL}/api/detections",
    json={
        "sessionId": SESSION_ID,
        "deviceId": DEVICE_UUID,
        "zone": "Zone-A",
        "telemetry": telemetry,
    },
)

print(response.status_code)
print(response.json())
```

---

# Important: Hardware ID vs Database UUID

There are two different device identifiers in the current API.

## Hardware Device ID

Example:

```text
ESP32_001
```

This is stored as:

```text
devices.device_id
```

It is used by:

```text
/api/devices/:id/register
/api/devices/:id
/api/devices/:id/heartbeat
```

## Database Device UUID

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

This is stored as:

```text
devices.id
```

The `/api/detections` endpoint expects:

```json
{
  "deviceId": "DATABASE_DEVICE_UUID"
}
```

Therefore, the normal flow is:

```text
ESP32_001
    │
    ▼
POST /api/devices/ESP32_001/register
    │
    ▼
Backend returns:
devices.id = UUID
    │
    ▼
Python stores UUID
    │
    ▼
POST /api/detections
deviceId = UUID
```

---

# Recommended Complete Device Flow

When a device boots:

```text
┌───────────────────────┐
│ ESP32 / Python starts │
└───────────┬───────────┘
            │
            ▼
     Register device
            │
            ▼
     Device already?
       /          \
     YES           NO
      │             │
      └──────┬──────┘
             ▼
       Start heartbeat
             │
             ▼
       Start CSI capture
             │
             ▼
      Process CSI window
             │
             ▼
       Generate telemetry
             │
             ▼
       Send to API
             │
             ▼
      Detection Engine
             │
        ┌────┴────┐
        ▼         ▼
      None     Detection
        │         │
        │         ▼
        │      Supabase
        │         │
        └────┬────┘
             ▼
          Continue
```

---

# ESP32 Responsibilities

The ESP32 should primarily be responsible for collecting CSI information.

Example serial output:

```text
timestamp,rssi,length,"csi_data"
1724000012,-52,128,"12,4,15,7,18,6,..."
```

The Python process can read this serial stream.

The ESP32 does not need to communicate directly with Supabase.

Recommended architecture:

```text
ESP32
  │
  │ Serial
  ▼
Python
  │
  │ HTTP
  ▼
Next.js API
  │
  │ Supabase
  ▼
Database
```

---

# Python CSI Processing

The existing Python pipeline calculates amplitude from CSI data.

CSI values are interpreted as:

```text
imaginary, real, imaginary, real, ...
```

Amplitude is calculated as:

```text
amplitude = sqrt(imaginary² + real²)
```

The average amplitude is then calculated for each CSI frame.

A window contains:

```text
WINDOW_SIZE = 50
```

frames.

The current ML features are:

```text
variance
amp_range
mean_amplitude
```

These correspond to the trained model's expected feature columns.

---

# Existing ML Pipeline

The Python model can produce:

```python
detected = clf.predict(features)
```

The resulting telemetry can then be sent to the API.

For example:

```python
telemetry = {
    "rssi": int(rssi_mean),
    "meanAmplitude": float(mean_amplitude),
    "amplitudeStd": float(np.std(amplitude)),
    "rollingVariation": float(variance),
}
```

---

# Environment Variables

For direct Supabase access from Python, the following environment variables are required:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### Important

Use the Supabase **anon key**, not the service-role key, for the Python client when using the existing direct Supabase approach.

Do not commit secrets to Git.

Example `.env`:

```env
SUPABASE_URL=...
SUPABASE_KEY=...
```

Add `.env` to `.gitignore`.

---

# Recommended API Architecture

For production, the preferred architecture is:

```text
ESP32
   │
   │ Serial
   ▼
Python CSI Processor
   │
   │ HTTPS
   ▼
Next.js API
   │
   ├── Authentication
   ├── Validation
   ├── Device verification
   ├── Detection engine
   │
   ▼
Supabase
   │
   ▼
Dashboard
```

The device should **not** receive or store the Supabase service-role key.

The service-role key should remain on the server.

---

# HTTP Status Codes

| Status | Meaning                         |
| ------ | ------------------------------- |
| `200`  | Request successful              |
| `201`  | Resource created                |
| `400`  | Invalid request                 |
| `404`  | Resource not found              |
| `409`  | Conflict, e.g. inactive session |
| `500`  | Server/database error           |

---

# Error Response Format

Most endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Description of the error"
}
```

Validation errors may additionally contain:

```json
{
  "success": false,
  "error": "Invalid detection request",
  "details": {}
}
```

---

# Testing with cURL

## Register Device

```bash
curl -X POST \
  http://localhost:3000/api/devices/ESP32_001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ESP32 Sensor 1",
    "location_x": 10,
    "location_y": 20,
    "location_z": 5
  }'
```

## Heartbeat

```bash
curl -X POST \
  http://localhost:3000/api/devices/ESP32_001/heartbeat
```

## Get Device

```bash
curl \
  http://localhost:3000/api/devices/ESP32_001
```

## Get All Devices

```bash
curl \
  http://localhost:3000/api/devices
```

## Create Session

```bash
curl -X POST \
  http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Building A Search"
  }'
```

## Get Sessions

```bash
curl \
  http://localhost:3000/api/sessions
```

## Send Detection

```bash
curl -X POST \
  http://localhost:3000/api/detections \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_UUID",
    "deviceId": "DEVICE_UUID",
    "zone": "Zone-A",
    "telemetry": {
      "rssi": -52,
      "meanAmplitude": 31.5,
      "amplitudeStd": 4.2,
      "rmsAmplitude": 32.1,
      "frameDifference": 2.7,
      "rollingVariation": 0.8
    }
  }'
```

---

# Database Relationships

The main entities are:

```text
devices
   │
   │ contributes to
   ▼
detections
   │
   │ belongs to
   ▼
sessions
```

Conceptually:

```text
Session
  │
  ├── Device 1
  │      │
  │      └── Detection
  │
  ├── Device 2
  │      │
  │      └── Detection
  │
  └── Device 3
         │
         └── Detection
```

A detection can contain multiple contributing device UUIDs:

```json
{
  "contributing_devices": ["device-uuid-1", "device-uuid-2"]
}
```

This allows future multi-device confirmation of a detected survivor/movement event.

---

# Current Detection Model

The detection engine returns:

```text
movementScore
presenceScore
survivorProbability
type
reason
```

The API stores these as:

```text
movement_score
presence_score
survivor_probability
type
```

Example:

```json
{
  "movementScore": 0.91,
  "presenceScore": 0.87,
  "survivorProbability": 0.84
}
```

---

# Security Notes

## Do not expose Supabase service-role key

The service-role key must only exist on the server.

Do not put it in:

```text
ESP32 firmware
Python client
browser JavaScript
NEXT_PUBLIC_* variables
Git repository
```

## HTTPS

Production devices should communicate with:

```text
https://your-domain.com
```

instead of:

```text
http://...
```

## Authentication

The current API code does not show device authentication.

For production deployment, consider adding:

```text
Device ID
+
Device API key/token
+
HTTPS
```

before allowing arbitrary devices to submit telemetry.

---

# Recommended Production Flow

```text
                     ┌──────────────┐
                     │   ESP32 #1   │
                     └──────┬───────┘
                            │
                            │ CSI
                            ▼
                     ┌──────────────┐
                     │    Python    │
                     │ CSI Processor│
                     └──────┬───────┘
                            │
                            │ HTTPS
                            ▼
                  ┌────────────────────┐
                  │     Next.js API    │
                  ├────────────────────┤
                  │ Device API         │
                  │ Heartbeat          │
                  │ Telemetry          │
                  │ Detection Engine   │
                  │ Session Management │
                  └─────────┬──────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Supabase   │
                     ├──────────────┤
                     │ devices      │
                     │ sessions     │
                     │ detections   │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Dashboard   │
                     └──────────────┘
```

---

# API Endpoint Summary

### Devices

```text
POST /api/devices/:id/register
```

Register a physical ESP32.

```text
GET /api/devices/:id
```

Get device information.

```text
GET /api/devices
```

Get all devices and automatically mark stale devices offline.

```text
POST /api/devices/:id/heartbeat
```

Mark a device as online and update `last_seen`.

### Sessions

```text
POST /api/sessions
```

Create a rescue session.

```text
GET /api/sessions
```

Get rescue sessions.

### Detection

```text
POST /api/telemetry
```

Process telemetry without explicitly identifying a device.

```text
POST /api/detections
```

Process telemetry with session + device information and save confirmed detections.

---

# Recommended Device Lifecycle

```text
             BOOT
               │
               ▼
        Register Device
               │
               ▼
        Receive Device UUID
               │
               ▼
       ┌─────────────────┐
       │ Send heartbeat  │◄──── every ~5 seconds
       └────────┬────────┘
                │
                ▼
          Read CSI data
                │
                ▼
       Build 50-frame window
                │
                ▼
        Calculate features
                │
                ▼
          Run ML model
                │
                ▼
       Send telemetry/API
                │
                ▼
        Detection Engine
                │
          ┌─────┴─────┐
          │           │
        NONE       DETECTED
          │           │
          │           ▼
          │       Save detection
          │           │
          └─────┬─────┘
                ▼
             Continue
```

---

# Notes for Developers

The current implementation contains two telemetry/detection paths:

```text
/api/telemetry
/api/detections
```

For a device-based architecture, `/api/detections` is the preferred endpoint because it explicitly accepts:

```text
sessionId
deviceId
zone
telemetry
```

and updates the device heartbeat while processing the detection.

The Python CSI pipeline should therefore ideally use:

```text
/api/devices/:id/register
/api/devices/:id/heartbeat
/api/detections
```

rather than directly writing detection rows to Supabase.

This keeps the detection logic and database access behind the Next.js API.

---

# End-to-End Example

A complete operation might look like:

```text
1. ESP32 boots
       ↓
2. Python identifies device as ESP32_001
       ↓
3. POST /api/devices/ESP32_001/register
       ↓
4. Backend returns database UUID
       ↓
5. Python starts heartbeat every 5 seconds
       ↓
6. ESP32 streams CSI over serial
       ↓
7. Python calculates CSI features
       ↓
8. Python sends telemetry to /api/detections
       ↓
9. API validates session/device
       ↓
10. API updates device last_seen
       ↓
11. Detection engine analyzes telemetry
       ↓
12. If detection is positive:
       ↓
13. Detection stored in Supabase
       ↓
14. Dashboard reads detection
       ↓
15. Operator sees possible survivor/movement
```

---

# Project Status

Current API functionality:

- [x] Device registration
- [x] Device lookup
- [x] Device listing
- [x] Device heartbeat
- [x] Automatic offline detection
- [x] Session creation
- [x] Session listing
- [x] Telemetry processing
- [x] Detection engine integration
- [x] Detection persistence
- [x] Multi-device detection support through `contributing_devices`
- [ ] Device authentication
- [ ] API rate limiting
- [ ] Telemetry batching
- [ ] Device configuration API
- [ ] Session activation/deactivation API
- [ ] Detection verification API

````

### One important implementation detail

Your current code has a mismatch worth fixing/documenting clearly:

- `/api/devices/:id/register` uses the **hardware `device_id`** such as `ESP32_001`.
- `/api/devices/:id/heartbeat` also uses the **hardware `device_id`**.
- `/api/detections` expects `deviceId` to be the **database UUID** (`devices.id`).

So the Python client should register first, save the returned `device.id`, and then use that UUID for `/api/detections`.

Also, `/api/detections` requires the session to already have:

```text
status = "ACTIVE"
````

while your session creation API creates sessions with:

```text
status = "CREATED"
```

There is currently no session activation route in the APIs you supplied, so you'll need one before the end-to-end detection flow can work.
