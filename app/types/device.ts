export type DeviceStatus = "ONLINE" | "OFFLINE";

export interface Device {
  id: string;
  device_id: string;
  name: string;
  status: DeviceStatus;
  location_x: number | null;
  location_y: number | null;
  location_z: number | null;
  last_seen: string | null;
  created_at?: string;
}
