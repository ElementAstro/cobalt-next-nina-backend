"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Save, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// 添加类型定义
export interface FormData {
  [key: string]: unknown;
}

export interface Step {
  title: string;
  component: React.ComponentType<{
    onNext: (data: FormData) => void;
    formData: FormData;
  }>;
}

interface SetupWizardProps {
  steps: Step[];
  onComplete: (formData: FormData) => void;
  initialData?: FormData;
  saveProgress?: boolean;
  storageKey?: string;
}

const MotionButton = motion(Button);

export function SetupWizard({
  steps,
  onComplete,
  initialData = {},
  saveProgress = true,
  storageKey = "setupWizardData",
}: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(() => {
    if (typeof window !== "undefined" && saveProgress) {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
    }
    return initialData;
  });
  const [isStepsOpen, setIsStepsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (saveProgress) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, saveProgress, storageKey]);

  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = (data: FormData) => {
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(updatedFormData);
      toast({
        title: "Setup Complete",
        description: "Your setup has been successfully completed!",
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveProgress = () => {
    if (saveProgress) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      toast({
        title: "Progress Saved",
        description: "Your setup progress has been saved.",
      });
    }
  };

  const toggleSteps = () => {
    setIsStepsOpen(!isStepsOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Setup Wizard</CardTitle>
          <CardDescription>
            Complete the following steps to finish your setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Collapsible
            open={isStepsOpen}
            onOpenChange={setIsStepsOpen}
            className="mb-8 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Steps</h2>
              <CollapsibleTrigger asChild>
                <MotionButton
                  variant="ghost"
                  size="sm"
                  className="w-9 p-0 lg:hidden"
                  onClick={toggleSteps}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: isStepsOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                  <span className="sr-only">Toggle steps</span>
                </MotionButton>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-2 py-2 ${
                      index === currentStep
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        index <= currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {index < currentStep ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span>{step.title}</span>
                  </motion.div>
                ))}
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
          <div className="hidden lg:block mb-8">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <motion.div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </motion.div>
                  <span className="text-sm mt-2 text-center">{step.title}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent onNext={handleNext} formData={formData} />
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-4">
              {currentStep > 0 && (
                <MotionButton
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 sm:flex-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back
                </MotionButton>
              )}
              {saveProgress && (
                <MotionButton
                  onClick={handleSaveProgress}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save className="mr-2 h-4 w-4" /> Save Progress
                </MotionButton>
              )}
            </div>
            {currentStep === steps.length - 1 && (
              <MotionButton
                onClick={() => handleNext(formData)}
                className="flex-1 sm:flex-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Finish
              </MotionButton>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
