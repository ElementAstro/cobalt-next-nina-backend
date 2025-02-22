"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "react-responsive";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}

const cardVariants = {
  initial: { 
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2
    }
  }
};

const iconVariants = {
  initial: { 
    scale: 0.5,
    opacity: 0
  },
  animate: { 
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.2,
      duration: 0.3,
      type: "spring",
      stiffness: 200
    }
  }
};

const contentVariants = {
  initial: { 
    opacity: 0,
    x: -20
  },
  animate: { 
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.3,
      duration: 0.4
    }
  }
};

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: StatsCardProps) {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="h-full"
          >
            <Card className={cn(
              "h-full overflow-hidden",
              "bg-card/50 backdrop-blur",
              "border-primary/10",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-300"
            )}>
              <CardContent className={cn(
                "p-6",
                isMobile && "p-4",
                "relative"
              )}>
                <div className="flex items-start space-x-4">
                  <motion.div
                    variants={iconVariants}
                    className={cn(
                      "p-2 rounded-full",
                      "bg-primary/10",
                      "flex items-center justify-center"
                    )}
                  >
                    <Icon className={cn(
                      "h-6 w-6 text-primary",
                      isMobile && "h-5 w-5"
                    )} />
                  </motion.div>

                  <motion.div 
                    variants={contentVariants}
                    className="space-y-1"
                  >
                    <p className={cn(
                      "text-sm font-medium text-muted-foreground",
                      isMobile && "text-xs"
                    )}>
                      {title}
                    </p>
                    <p className={cn(
                      "text-2xl font-bold tracking-tight",
                      isMobile && "text-xl"
                    )}>
                      {value}
                    </p>
                    <p className={cn(
                      "text-xs text-muted-foreground",
                      isMobile && "text-[10px]"
                    )}>
                      {description}
                    </p>
                  </motion.div>
                </div>

                {/* 装饰效果 */}
                <motion.div
                  className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.3, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
