"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DeviceProfile } from "@/types/serial/index";
import {
  saveDeviceProfile,
  getDeviceProfiles,
  deleteDeviceProfile,
} from "@/lib/serial/device-profiles";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Trash2 } from "lucide-react";

interface DeviceProfileDialogProps {
  onProfileSelected?: (profile: DeviceProfile) => void;
  trigger?: React.ReactNode;
}

export function DeviceProfileDialog({
  onProfileSelected,
  trigger,
}: DeviceProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<DeviceProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<string>("load");

  const [newProfile, setNewProfile] = useState<Partial<DeviceProfile>>({
    name: "",
    port: "/dev/ttyS0",
    baudRate: "115200",
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    flowControl: "none",
  });

  const { toast } = useToast();

  // Load profiles on open
  useEffect(() => {
    if (open) {
      const loadedProfiles = getDeviceProfiles();
      setProfiles(loadedProfiles);

      if (loadedProfiles.length > 0 && !selectedProfileId) {
        setSelectedProfileId(loadedProfiles[0].id);
      }
    }
  }, [open, selectedProfileId]);

  const handleSaveProfile = () => {
    if (!newProfile.name || !newProfile.port || !newProfile.baudRate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const savedProfile = saveDeviceProfile(
        newProfile as Omit<DeviceProfile, "id">
      );

      toast({
        title: "Profile saved",
        description: `Device profile "${savedProfile.name}" has been saved`,
      });

      // Refresh profiles list
      setProfiles(getDeviceProfiles());
      setSelectedProfileId(savedProfile.id);
      setActiveTab("load");

      // Reset new profile form
      setNewProfile({
        name: "",
        port: "/dev/ttyS0",
        baudRate: "115200",
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });
    } catch {
      toast({
        title: "Error saving profile",
        description: "An error occurred while saving the device profile",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProfile = (id: string) => {
    try {
      const profileName = profiles.find((p) => p.id === id)?.name;

      deleteDeviceProfile(id);

      toast({
        title: "Profile deleted",
        description: `Device profile "${profileName}" has been deleted`,
      });

      // Refresh profiles list
      const updatedProfiles = getDeviceProfiles();
      setProfiles(updatedProfiles);

      if (selectedProfileId === id) {
        setSelectedProfileId(
          updatedProfiles.length > 0 ? updatedProfiles[0].id : null
        );
      }
    } catch {
      toast({
        title: "Error deleting profile",
        description: "An error occurred while deleting the device profile",
        variant: "destructive",
      });
    }
  };

  const handleLoadProfile = () => {
    if (!selectedProfileId) {
      toast({
        title: "No profile selected",
        description: "Please select a device profile to load",
        variant: "destructive",
      });
      return;
    }

    const profile = profiles.find((p) => p.id === selectedProfileId);

    if (!profile) {
      toast({
        title: "Profile not found",
        description: "The selected profile could not be found",
        variant: "destructive",
      });
      return;
    }

    if (onProfileSelected) {
      onProfileSelected(profile);
    }

    toast({
      title: "Profile loaded",
      description: `Device profile "${profile.name}" has been loaded`,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-2" />
            Device Profiles
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#0a1929] text-white border-gray-700 dark:bg-gray-900 dark:border-gray-800 transition-colors duration-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Device Profiles</DialogTitle>
          <DialogDescription className="text-gray-400">
            Save and load device configurations for quick access
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-[#1a2b3d] dark:bg-gray-800 transition-colors duration-200">
            <TabsTrigger
              value="load"
              className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
            >
              Load Profile
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
            >
              Create Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="load" className="space-y-4 mt-4">
            {profiles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No device profiles found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("create")}
                >
                  Create your first profile
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`p-4 border rounded-md cursor-pointer transition-colors ${
                        selectedProfileId === profile.id
                          ? "border-purple-600 bg-[#1a2b3d]"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                      onClick={() => setSelectedProfileId(profile.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{profile.name}</h3>
                          <p className="text-sm text-gray-400">
                            {profile.port} @ {profile.baudRate} baud
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {profile.dataBits}-{profile.stopBits}-
                            {profile.parity}, Flow: {profile.flowControl}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <DialogFooter>
                  <Button onClick={handleLoadProfile}>Load Profile</Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Profile Name</Label>
                <Input
                  id="profile-name"
                  className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
                  value={newProfile.name}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, name: e.target.value })
                  }
                  placeholder="My Device"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-port">Port</Label>
                <Input
                  id="profile-port"
                  className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
                  value={newProfile.port}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, port: e.target.value })
                  }
                  placeholder="/dev/ttyS0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-baudrate">Baud Rate</Label>
                <Select
                  value={newProfile.baudRate}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, baudRate: value })
                  }
                >
                  <SelectTrigger
                    id="profile-baudrate"
                    className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
                  >
                    <SelectValue placeholder="115200" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
                    <SelectItem value="9600">9600</SelectItem>
                    <SelectItem value="19200">19200</SelectItem>
                    <SelectItem value="38400">38400</SelectItem>
                    <SelectItem value="57600">57600</SelectItem>
                    <SelectItem value="115200">115200</SelectItem>
                    <SelectItem value="230400">230400</SelectItem>
                    <SelectItem value="460800">460800</SelectItem>
                    <SelectItem value="921600">921600</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-databits">Data Bits</Label>
                <Select
                  value={newProfile.dataBits?.toString()}
                  onValueChange={(value) =>
                    setNewProfile({
                      ...newProfile,
                      dataBits: Number.parseInt(value),
                    })
                  }
                >
                  <SelectTrigger
                    id="profile-databits"
                    className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
                  >
                    <SelectValue placeholder="8" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-stopbits">Stop Bits</Label>
                <Select
                  value={newProfile.stopBits?.toString()}
                  onValueChange={(value) =>
                    setNewProfile({
                      ...newProfile,
                      stopBits: Number.parseInt(value),
                    })
                  }
                >
                  <SelectTrigger
                    id="profile-stopbits"
                    className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
                  >
                    <SelectValue placeholder="1" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-parity">Parity</Label>
                <Select
                  value={newProfile.parity}
                  onValueChange={(value: "none" | "even" | "odd") =>
                    setNewProfile({ ...newProfile, parity: value })
                  }
                >
                  <SelectTrigger
                    id="profile-parity"
                    className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
                  >
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="even">Even</SelectItem>
                    <SelectItem value="odd">Odd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-flowcontrol">Flow Control</Label>
                <Select
                  value={newProfile.flowControl}
                  onValueChange={(value: "none" | "hardware") =>
                    setNewProfile({ ...newProfile, flowControl: value })
                  }
                >
                  <SelectTrigger
                    id="profile-flowcontrol"
                    className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
                  >
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
