import React, { FC } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface FlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flagText: string;
  setFlagText: (text: string) => void;
  handleFlagClose: (save: boolean) => void;
  isBatchMode?: boolean;
  onBatchUpdate?: (value: string) => void;
}

const FlagDialog: FC<FlagDialogProps> = ({
  open,
  onOpenChange,
  flagText,
  setFlagText,
  handleFlagClose,
  isBatchMode,
  onBatchUpdate,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBatchMode ? "批量更新 Flag" : "更新 Flag"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            输入新的 Flag 值:
            <Input
              type="text"
              value={flagText}
              onChange={(e) => setFlagText(e.target.value)}
              className="mt-2"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleFlagClose(false)}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              isBatchMode && onBatchUpdate
                ? onBatchUpdate(flagText)
                : handleFlagClose(true)
            }
          >
            保存
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FlagDialog;
