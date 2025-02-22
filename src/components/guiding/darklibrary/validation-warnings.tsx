"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "react-responsive";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ValidationWarningsProps {
  errors: string[];
  warnings: string[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

export function ValidationWarnings({
  errors,
  warnings,
}: ValidationWarningsProps) {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <TooltipProvider>
      <AnimatePresence mode="wait">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-3"
        >
          {errors.length > 0 && (
            <motion.div variants={itemVariants}>
              <Alert 
                variant="destructive" 
                className="bg-red-500/10 border-red-500/30 backdrop-blur"
              >
                <XCircle className="h-4 w-4 animate-pulse" />
                <AlertTitle className="flex items-center gap-2 text-red-500">
                  验证错误
                  <Badge 
                    variant="outline" 
                    className="ml-2 text-red-500 border-red-500/30"
                  >
                    {errors.length}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  <motion.ul 
                    className="mt-2 space-y-2"
                    variants={containerVariants}
                  >
                    {errors.map((error, i) => (
                      <motion.li
                        key={i}
                        variants={itemVariants}
                        className={cn(
                          "flex items-start gap-2 p-2",
                          "bg-red-500/5 rounded-lg",
                          "hover:bg-red-500/10 transition-colors duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-red-500/90">{error}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {warnings.length > 0 && (
            <motion.div variants={itemVariants}>
              <Alert className="bg-yellow-500/10 border-yellow-500/30 backdrop-blur">
                <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
                <AlertTitle className="flex items-center gap-2 text-yellow-500">
                  警告提示
                  <Badge 
                    variant="outline"
                    className="ml-2 text-yellow-500 border-yellow-500/30"
                  >
                    {warnings.length}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-yellow-500/70 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>这些警告不会阻止操作，但可能影响结果质量</p>
                    </TooltipContent>
                  </Tooltip>
                </AlertTitle>
                <AlertDescription>
                  <motion.ul 
                    className="mt-2 space-y-2"
                    variants={containerVariants}
                  >
                    {warnings.map((warning, i) => (
                      <motion.li
                        key={i}
                        variants={itemVariants}
                        className={cn(
                          "flex items-start gap-2 p-2",
                          "bg-yellow-500/5 rounded-lg",
                          "hover:bg-yellow-500/10 transition-colors duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-yellow-500/90">{warning}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}
