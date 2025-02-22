import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useCallback } from "react";
import { FovDataType } from "@/types/skymap/fov";
import { Calculator, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FocalLengthCalculatorProps {
  aperture: number;
  fRatio: number;
  setAperture: React.Dispatch<React.SetStateAction<number>>;
  setFRatio: React.Dispatch<React.SetStateAction<number>>;
  reset: (newSettings: FovDataType) => void;
  getValues: () => FovDataType;
}

export const FocalLengthCalculator: React.FC<FocalLengthCalculatorProps> = ({
  aperture,
  fRatio,
  setAperture,
  setFRatio,
  reset,
  getValues,
}) => {
  const calculateFocalLength = useCallback(
    (aperture: number, fRatio: number) => {
      return aperture * fRatio;
    },
    []
  );

  return (
    <Card className="mt-4 bg-gray-900/95 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-sky-400">
          <Calculator className="w-4 h-4" />
          焦距计算器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="aperture" className="text-xs text-gray-400">
              口径 (mm)
            </Label>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Input
                id="aperture"
                type="number"
                value={aperture || ""}
                onChange={(e) => setAperture(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-gray-100 text-sm focus:ring-sky-500 focus:border-sky-500"
                placeholder="请输入口径..."
              />
            </motion.div>
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="fRatio" className="text-xs text-gray-400">
              焦比
            </Label>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Input
                id="fRatio"
                type="number"
                value={fRatio || ""}
                onChange={(e) => setFRatio(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-gray-100 text-sm focus:ring-sky-500 focus:border-sky-500"
                placeholder="请输入焦比..."
              />
            </motion.div>
          </div>

          <motion.div
            className="flex items-end"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => {
                const fl = calculateFocalLength(aperture, fRatio);
                if (fl > 0) {
                  reset({ ...getValues(), focal_length: fl });
                  toast({
                    title: "计算完成",
                    description: (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sky-400">
                          焦距: {fl.toFixed(2)} mm
                        </span>
                        <span className="text-xs text-gray-400">
                          基于口径 {aperture} mm 和焦比 f/{fRatio}
                        </span>
                      </div>
                    ),
                  });
                } else {
                  toast({
                    variant: "destructive",
                    title: "计算失败",
                    description: "请检查输入值是否正确。",
                  });
                }
              }}
              className="h-10 px-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white shadow-lg"
            >
              <Calculator className="w-4 h-4 mr-2" />
              计算
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {(!aperture || !fRatio) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="bg-yellow-900/20 border-yellow-600/50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-xs text-yellow-200">
                  请输入口径和焦比以计算焦距。
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
