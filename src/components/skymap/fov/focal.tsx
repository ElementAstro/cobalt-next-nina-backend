import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useCallback } from "react";
import { FovDataType } from "@/types/skymap/fov";

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
    <div className="mt-4 p-3 bg-gray-700 rounded-lg space-y-2">
      <h3 className="text-sm font-semibold">焦距计算器</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <motion.div whileHover={{ scale: 1.02 }} whileFocus={{ scale: 1.02 }}>
          <Input
            type="number"
            placeholder="口径(mm)"
            value={aperture}
            onChange={(e) => setAperture(Number(e.target.value))}
            className="text-black"
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileFocus={{ scale: 1.02 }}>
          <Input
            type="number"
            placeholder="焦比"
            value={fRatio}
            onChange={(e) => setFRatio(Number(e.target.value))}
            className="text-black"
          />
        </motion.div>
        <Button
          onClick={() => {
            const fl = calculateFocalLength(aperture, fRatio);
            if (fl > 0) {
              reset({ ...getValues(), focal_length: fl });
              toast({
                title: "计算完成",
                description: `焦距为 ${fl.toFixed(2)} mm`,
              });
            } else {
              toast({
                title: "计算失败",
                description: "请检查输入值是否正确。",
                variant: "destructive",
              });
            }
          }}
          className="flex items-center justify-center text-sm"
        >
          计算
        </Button>
      </div>
    </div>
  );
};
