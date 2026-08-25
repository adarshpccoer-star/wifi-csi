import { Device } from "@/app/types/device";
import { Session } from "@/app/types/session";
import { Detection } from "@/app/types/detection";

export async function fetchDevices(): Promise<Device[]> {
  const res = await fetch("/api/devices");
  if (!res.ok) throw new Error("Failed to fetch devices");
  const data = await res.json();
  return data.devices ?? [];
}

export async function fetchSessionOverview(sessionId: string): Promise<{
  session: Session;
  devices: Device[];
  detections: Detection[];
  stats: {
    totalDetections: number;
    possibleSurvivors: number;
    onlineDevices: number;
  };
}> {
  const res = await fetch(`/api/sessions/${sessionId}/overview`);
  if (!res.ok) throw new Error("Failed to fetch session overview");
  return res.json();
}
