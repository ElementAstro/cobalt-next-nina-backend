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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagValue: string;
  setTagValue: (value: string) => void;
  all_tags: string[];
  handleTagSelection: (value: string) => void;
  handleTagClose: () => void;
  isBatchMode?: boolean;
  onBatchUpdate?: (value: string) => void;
}

const TagDialog: FC<TagDialogProps> = ({
  open,
  onOpenChange,
  tagValue,
  all_tags,
  handleTagSelection,
  handleTagClose,
  isBatchMode,
  onBatchUpdate,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBatchMode ? "批量更新 Tag" : "更新 Tag"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            选择新的 Tag 值:
            <Select onValueChange={(value) => handleTagSelection(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择 Tag" />
              </SelectTrigger>
              <SelectContent>
                {all_tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleTagClose()}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              isBatchMode && onBatchUpdate
                ? onBatchUpdate(tagValue)
                : handleTagClose()
            }
          >
            保存
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TagDialog;
