"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSequencerStore } from "@/stores/sequencer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, AlertTriangle, RotateCcw } from "lucide-react";

export function TaskValidation() {
  const {
    targets,
    activeTargetId,
    taskValidation,
    validateTask,
    taskStatuses,
  } = useSequencerStore();

  const [isValidating, setIsValidating] = useState(false);

  const activeTarget = targets.find((t) => t.id === activeTargetId);

  if (!activeTarget) return null;

  const handleValidateAll = async () => {
    setIsValidating(true);
    try {
      for (const task of activeTarget.tasks) {
        await validateTask(task.id);
      }
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <motion.div
      className="bg-gray-900/50 p-2 rounded-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">任务验证</h3>
        <Button
          size="sm"
          onClick={handleValidateAll}
          disabled={isValidating}
          className="h-7 px-2"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          验证全部
        </Button>
      </div>

      <div className="rounded-md border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-800/50">
            <TableRow>
              <TableHead className="font-medium text-xs py-2">
                任务名称
              </TableHead>
              <TableHead className="font-medium text-xs py-2 text-center">
                尝试
              </TableHead>
              <TableHead className="font-medium text-xs py-2 text-center">
                成功
              </TableHead>
              <TableHead className="font-medium text-xs py-2 text-right">
                状态
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeTarget.tasks.map((task) => {
              const validation = taskValidation[task.id];
              const status = taskStatuses[task.id];

              return (
                <TableRow key={task.id} className="hover:bg-gray-800/30">
                  <TableCell className="py-1 text-sm">{task.name}</TableCell>
                  <TableCell className="py-1 text-sm text-center">
                    {validation?.attempts || 0}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-center">
                    {validation?.successes || 0}
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center justify-end space-x-1">
                      {status?.status === "completed" ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : status?.status === "failed" ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Progress
                          value={status?.progress || 0}
                          className="w-16 h-1"
                        />
                      )}
                      <span className="text-xs">
                        {status?.status || "pending"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
