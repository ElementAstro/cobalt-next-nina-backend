import React, { FC, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renameText: string;
  setRenameText: React.Dispatch<React.SetStateAction<string>>;
  handleRenameClose: (save: boolean) => void;
}

const RenameDialog: FC<RenameDialogProps> = ({
  open,
  onOpenChange,
  renameText,
  setRenameText,
  handleRenameClose,
}) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset error when the dialog opens or renameText changes
    setError(null);
  }, [open, renameText]);

  const validateInput = (text: string): string | null => {
    if (!text.trim()) {
      return "名称不能为空";
    }

    if (text.length > 255) {
      return "名称不能超过255个字符";
    }

    //  Add more validation rules as needed, e.g., check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(text)) {
      return '名称包含无效字符 (例如: <>:"/\\|?*)';
    }

    return null;
  };

  const handleConfirm = () => {
    const validationError = validateInput(renameText);
    if (validationError) {
      setError(validationError);
      return;
    }
    handleRenameClose(true);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRenameText(event.target.value);
    // Clear error immediately as the user types
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-800 dark:text-gray-200 w-[90%] max-w-lg p-4">
        <DialogHeader>
          <DialogTitle>重命名该目标</DialogTitle>
          {error && (
            <DialogDescription className="text-red-500">
              {error}
            </DialogDescription>
          )}
        </DialogHeader>
        <Input
          type="text"
          placeholder="重命名为"
          value={renameText}
          onChange={handleInputChange}
          className="mt-4"
        />
        <DialogFooter className="mt-4 flex justify-end space-x-2">
          <Button variant="secondary" onClick={() => handleRenameClose(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;
