import type { DeviceProfile } from "@/types/serial";
import { nanoid } from "nanoid";

// Local storage key
const STORAGE_KEY = "serial-debug-device-profiles";

// Get all device profiles
export function getDeviceProfiles(): DeviceProfile[] {
  try {
    const profilesJson = localStorage.getItem(STORAGE_KEY);
    if (!profilesJson) return [];

    return JSON.parse(profilesJson);
  } catch (error) {
    console.error("Error loading device profiles:", error);
    return [];
  }
}

// Get a specific device profile
export function getDeviceProfile(id: string): DeviceProfile | null {
  const profiles = getDeviceProfiles();
  return profiles.find((profile) => profile.id === id) || null;
}

// Save a device profile
export function saveDeviceProfile(
  profile: Omit<DeviceProfile, "id"> & { id?: string }
): DeviceProfile {
  const profiles = getDeviceProfiles();

  // Create a new profile or update existing one
  const newProfile: DeviceProfile = {
    id: profile.id || nanoid(),
    name: profile.name,
    port: profile.port,
    baudRate: profile.baudRate,
    dataBits: profile.dataBits || 8,
    stopBits: profile.stopBits || 1,
    parity: profile.parity || "none",
    flowControl: profile.flowControl || "none",
    parser: profile.parser,
    macros: profile.macros || [],
  };

  // Update or add the profile
  const existingIndex = profiles.findIndex((p) => p.id === newProfile.id);
  if (existingIndex >= 0) {
    profiles[existingIndex] = newProfile;
  } else {
    profiles.push(newProfile);
  }

  // Save to local storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));

  return newProfile;
}

// Delete a device profile
export function deleteDeviceProfile(id: string): boolean {
  const profiles = getDeviceProfiles();
  const newProfiles = profiles.filter((profile) => profile.id !== id);

  if (newProfiles.length === profiles.length) {
    return false; // Profile not found
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfiles));
  return true;
}

// Import device profiles from JSON
export function importDeviceProfiles(json: string): boolean {
  try {
    const profiles = JSON.parse(json);

    if (!Array.isArray(profiles)) {
      throw new Error("Invalid profiles format");
    }

    // Validate each profile
    profiles.forEach((profile) => {
      if (!profile.id || !profile.name || !profile.port || !profile.baudRate) {
        throw new Error("Invalid profile data");
      }
    });

    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (error) {
    console.error("Error importing device profiles:", error);
    return false;
  }
}

// Export device profiles to JSON
export function exportDeviceProfiles(): string {
  const profiles = getDeviceProfiles();
  return JSON.stringify(profiles, null, 2);
}
