"use client";

import { useState, useRef } from "react";
import { useSerialStore } from "@/stores/serial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  Save,
  Trash2,
  Plus,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";

interface Script {
  id: string;
  name: string;
  content: string;
}

export function ScriptAutomation() {
  const { sendData, isMonitoring, addTerminalData } = useSerialStore();
  const [isOpen, setIsOpen] = useState(false);
  const [scripts, setScripts] = useState<Script[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedScripts = localStorage.getItem("serial-debug-scripts");
        return savedScripts ? JSON.parse(savedScripts) : [];
      } catch (error) {
        console.error("Error loading scripts:", error);
      }
    }
    return [];
  });

  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [scriptName, setScriptName] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runningScriptId, setRunningScriptId] = useState<string | null>(null);
  const [delay, setDelay] = useState("1000");

  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commandIndexRef = useRef(0);

  // Save scripts to localStorage
  const saveScriptsToStorage = (updatedScripts: Script[]) => {
    try {
      localStorage.setItem(
        "serial-debug-scripts",
        JSON.stringify(updatedScripts)
      );
    } catch (error) {
      console.error("Error saving scripts:", error);
    }
  };

  // Create a new script
  const createScript = () => {
    if (!scriptName.trim()) {
      toast({
        title: "Script name required",
        description: "Please enter a name for your script",
        variant: "destructive",
      });
      return;
    }

    const newScript: Script = {
      id: nanoid(),
      name: scriptName,
      content: scriptContent,
    };

    const updatedScripts = [...scripts, newScript];
    setScripts(updatedScripts);
    saveScriptsToStorage(updatedScripts);

    setScriptName("");
    setScriptContent("");

    toast({
      title: "Script created",
      description: `Script "${newScript.name}" has been created`,
    });
  };

  // Update an existing script
  const updateScript = () => {
    if (!activeScript) return;

    if (!scriptName.trim()) {
      toast({
        title: "Script name required",
        description: "Please enter a name for your script",
        variant: "destructive",
      });
      return;
    }

    const updatedScript: Script = {
      ...activeScript,
      name: scriptName,
      content: scriptContent,
    };

    const updatedScripts = scripts.map((script) =>
      script.id === activeScript.id ? updatedScript : script
    );

    setScripts(updatedScripts);
    saveScriptsToStorage(updatedScripts);
    setActiveScript(updatedScript);

    toast({
      title: "Script updated",
      description: `Script "${updatedScript.name}" has been updated`,
    });
  };

  // Delete a script
  const deleteScript = (id: string) => {
    const scriptToDelete = scripts.find((script) => script.id === id);
    if (!scriptToDelete) return;

    const updatedScripts = scripts.filter((script) => script.id !== id);
    setScripts(updatedScripts);
    saveScriptsToStorage(updatedScripts);

    if (activeScript?.id === id) {
      setActiveScript(null);
      setScriptName("");
      setScriptContent("");
    }

    toast({
      title: "Script deleted",
      description: `Script "${scriptToDelete.name}" has been deleted`,
    });
  };

  // Load a script for editing
  const loadScript = (script: Script) => {
    setActiveScript(script);
    setScriptName(script.name);
    setScriptContent(script.content);
  };

  // Clear the current script
  const clearScript = () => {
    setActiveScript(null);
    setScriptName("");
    setScriptContent("");
  };

  // Run a script
  const runScript = (script: Script) => {
    if (!isMonitoring) {
      toast({
        title: "Not monitoring",
        description: "Please start monitoring before running a script",
        variant: "destructive",
      });
      return;
    }

    if (isRunning) {
      toast({
        title: "Script already running",
        description: "Please wait for the current script to finish",
        variant: "destructive",
      });
      return;
    }

    // Parse the script content into commands
    const commands = script.content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    if (commands.length === 0) {
      toast({
        title: "Empty script",
        description: "Script contains no commands to execute",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setRunningScriptId(script.id);
    commandIndexRef.current = 0;

    addTerminalData(`--- Running script: ${script.name} ---`, "info");

    // Execute the first command
    executeNextCommand(commands);
  };

  // Execute the next command in the script
  const executeNextCommand = (commands: string[]) => {
    if (!isRunning || commandIndexRef.current >= commands.length) {
      // Script finished
      setIsRunning(false);
      setRunningScriptId(null);
      addTerminalData("--- Script execution completed ---", "info");
      return;
    }

    const command = commands[commandIndexRef.current];

    // Check for special commands
    if (command.startsWith("delay:")) {
      // Custom delay command
      const customDelay = Number.parseInt(command.substring(6).trim());
      if (!isNaN(customDelay) && customDelay > 0) {
        addTerminalData(`Waiting for ${customDelay}ms...`, "info");
        timeoutRef.current = setTimeout(() => {
          commandIndexRef.current++;
          executeNextCommand(commands);
        }, customDelay);
        return;
      }
    } else if (command.startsWith("wait_for:")) {
      // Wait for specific response (not implemented in this version)
      // For now, just continue with next command
      addTerminalData(`Wait for command not implemented yet`, "warning");
      commandIndexRef.current++;
      executeNextCommand(commands);
      return;
    } else {
      // Regular command
      sendData(command);
    }

    // Schedule the next command
    commandIndexRef.current++;
    const delayMs = Number.parseInt(delay);

    timeoutRef.current = setTimeout(
      () => {
        executeNextCommand(commands);
      },
      isNaN(delayMs) ? 1000 : delayMs
    );
  };

  // Stop the currently running script
  const stopScript = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsRunning(false);
    setRunningScriptId(null);
    addTerminalData("--- Script execution stopped ---", "warning");

    toast({
      title: "Script stopped",
      description: "Script execution has been stopped",
    });
  };

  return (
    <div className="border-t border-gray-700 dark:border-gray-800 transition-colors duration-200">
      <div className="flex justify-between items-center p-2">
        <div className="font-medium text-white flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          脚本自动化
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              className="h-7"
              onClick={stopScript}
            >
              <Square className="h-3 w-3 mr-1" />
              停止
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
              onClick={() => activeScript && runScript(activeScript)}
              disabled={!activeScript || !isMonitoring}
            >
              <Play className="h-3 w-3 mr-1" />
              运行
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Script List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">脚本列表</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700"
                      onClick={clearScript}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      新建
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {scripts.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        No scripts yet
                      </div>
                    ) : (
                      scripts.map((script) => (
                        <div
                          key={script.id}
                          className={cn(
                            "p-3 rounded-md border cursor-pointer transition-colors",
                            activeScript?.id === script.id
                              ? "border-purple-600 bg-[#1a2b3d]"
                              : "border-gray-700 hover:border-gray-600",
                            runningScriptId === script.id && "border-green-600"
                          )}
                          onClick={() => loadScript(script)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{script.name}</span>
                            <div className="flex gap-1">
                              {runningScriptId === script.id && (
                                <span className="flex items-center text-xs text-green-400">
                                  <Clock className="h-3 w-3 mr-1 animate-pulse" />
                                  Running
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (runningScriptId !== script.id) {
                                    runScript(script);
                                  }
                                }}
                                disabled={!isMonitoring || isRunning}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteScript(script.id);
                                }}
                                disabled={runningScriptId === script.id}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {script.content.split("\n")[0]}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Script Editor */}
                <div className="space-y-4 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">脚本编辑器</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="delay"
                          className="text-xs whitespace-nowrap"
                        >
                          命令延迟 (ms)
                        </Label>
                        <Input
                          id="delay"
                          type="number"
                          className="w-20 h-7 bg-[#1a2b3d] border-[#2a3b4d] text-white"
                          value={delay}
                          onChange={(e) => setDelay(e.target.value)}
                          min="100"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700"
                        onClick={activeScript ? updateScript : createScript}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {activeScript ? "更新" : "保存"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="script-name">脚本名称</Label>
                      <Input
                        id="script-name"
                        className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
                        value={scriptName}
                        onChange={(e) => setScriptName(e.target.value)}
                        placeholder="My Script"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="script-content">脚本内容</Label>
                      <Textarea
                        id="script-content"
                        className="h-48 font-mono text-sm bg-[#1a2b3d] border-[#2a3b4d] text-white"
                        value={scriptContent}
                        onChange={(e) => setScriptContent(e.target.value)}
                        placeholder="# Enter one command per line
# Lines starting with # are comments
# Special commands:
# delay:1000 - Wait for 1000ms
# wait_for:OK - Wait for 'OK' response (not implemented yet)

help
status
sensor"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
