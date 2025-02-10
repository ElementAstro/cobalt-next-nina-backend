"use client";

import { motion } from "framer-motion";
import { ExternalLink, Clock, AlertTriangle, LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Service, ThemeConfig, StatusType } from "@/types/server/status";
import { StatusDot } from "./status-dot";

interface ServiceCardProps {
  service: Service;
  theme: ThemeConfig;
  showDescription?: boolean;
  showTimestamps?: boolean;
  showResponseTime?: boolean;
  showLastIncident?: boolean;
  showDependencies?: boolean;
  onServiceClick?: (service: Service) => void;
}

export function ServiceCard({
  service,
  theme,
  showDescription = true,
  showTimestamps = true,
  showResponseTime = true,
  showLastIncident = true,
  showDependencies = true,
  onServiceClick,
}: ServiceCardProps) {
  const handleClick = () => {
    if (onServiceClick) {
      onServiceClick(service);
    }
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "up":
        return theme.upColor;
      case "degraded":
        return theme.degradedColor;
      case "down":
        return theme.downColor;
    }
  };

  return (
    <Card
      className={`p-4 hover:shadow-lg transition-shadow duration-300 ${
        service.url ? "cursor-pointer" : ""
      }`}
      onClick={handleClick}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <motion.div
                key={service.uptime}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Badge
                  variant="secondary"
                  className="bg-opacity-90 transition-colors duration-300"
                  style={{ backgroundColor: theme.upColor, color: "white" }}
                >
                  {service.uptime}%
                </Badge>
              </motion.div>
              <span className="font-medium flex items-center gap-2">
                {service.name}
                {service.url && (
                  <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                )}
              </span>
            </div>
            <Badge
              variant="secondary"
              className="bg-opacity-75"
              style={{
                backgroundColor: `${theme.upColor}20`,
                color: theme.upColor,
              }}
            >
              证书有效期: {service.certificateDays} 天
            </Badge>
          </div>
          {showResponseTime && service.responseTime && (
            <motion.div
              key={service.responseTime}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <Clock className="w-4 h-4" />
              <span>{service.responseTime}ms</span>
            </motion.div>
          )}
        </div>

        {showDescription && service.description && (
          <p className="text-sm text-gray-500">{service.description}</p>
        )}

        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          <TooltipProvider>
            {service.statusHistory.map((dot, i) => (
              <Tooltip key={i}>
                <TooltipTrigger>
                  <StatusDot
                    status={dot.status}
                    theme={theme}
                    size={theme.dotSize}
                    className="mx-0.5"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Status: {dot.status}</p>
                  {dot.timestamp && <p>Time: {dot.timestamp}</p>}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
          {showTimestamps && (
            <div className="ml-2 flex items-center gap-4 text-sm text-gray-500 whitespace-nowrap">
              <span>15m ago</span>
              <span>now</span>
            </div>
          )}
        </div>

        {showLastIncident && service.lastIncident && (
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle
              className="w-4 h-4 mt-1 flex-shrink-0"
              style={{ color: getStatusColor(service.lastIncident.status) }}
            />
            <div>
              <p className="font-medium">
                Last Incident: {service.lastIncident.title}
              </p>
              <p className="text-gray-500">
                {new Date(service.lastIncident.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {showDependencies &&
          service.dependencies &&
          service.dependencies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <LinkIcon className="w-4 h-4 mt-1" />
              {service.dependencies.map((dep, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  style={{ color: getStatusColor(dep.status) }}
                >
                  {dep.name}
                </Badge>
              ))}
            </div>
          )}
      </div>
    </Card>
  );
}
