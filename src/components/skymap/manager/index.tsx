"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FC } from "react";
import { useSkymapStore } from "@/stores/skymap/skymapStore";
import FilterPanel from "./filter-panel";
import TargetList from "./target-list";
import BatchOperationToolbar from "./batch-toolbar";
import RenameDialog from "./rename-dialog";
import FlagDialog from "./flag-dialog";
import TagDialog from "./tag-dialog";
import PopupDialog from "./popup-dialog";
import { IDSOFramingObjectInfo } from "@/types/skymap";
import { toast } from "sonner";
import { Tag, Flag, Target, AlertTriangle, Check, X } from "lucide-react";

interface ObjectManagementProps {
  on_choice_maken: (() => void) | null;
}

interface FilterMode {
  tag: string;
  flag: string;
  type: string;
  search_query: string;
}

const ObjectManagement: FC<ObjectManagementProps> = (props) => {
  // Store handler
  const target_store = useSkymapStore((state) => state.targets);
  const clear_all_checked = useSkymapStore((state) => state.clearAllChecked);
  const remove_one_target = useSkymapStore((state) => state.removeTarget);
  const save_all_targets = useSkymapStore((state) => state.saveAllTargets);
  const change_saved_focus_target = useSkymapStore(
    (state) => state.setFocusTarget
  );
  const store_target_set_flag = useSkymapStore((state) => state.setTargetFlag);
  const store_target_set_tag = useSkymapStore((state) => state.setTargetTag);
  const store_target_rename = useSkymapStore((state) => state.renameTarget);
  const store_check_one_target = useSkymapStore(
    (state) => state.checkOneTarget
  );
  const all_tags = useSkymapStore((state) => state.all_tags);
  const all_flags = useSkymapStore((state) => state.all_flags);

  // Data
  const [filterMode, setFilterMode] = useState<FilterMode>({
    tag: "all",
    flag: "all",
    type: "all",
    search_query: "",
  });

  const [renameTextDialog, setRenameTextDialog] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [flagDialog, setFlagDialog] = useState(false);
  const [flagText, setFlagText] = useState("");
  const [popupDialog, setPopupDialog] = useState(false);
  const [popupText, setPopupText] = useState("");
  const [tagDialog, setTagDialog] = useState(false);
  const [tagValue, setTagValue] = useState<string>("");

  // Batch operation state
  const [batchMode, setBatchMode] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<number[]>([]);

  // View and sorting state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState<"name" | "type" | "tag" | "flag">(
    "name"
  );

  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // 从 localStorage 加载收藏列表
    const savedFavorites = localStorage.getItem("favorite-targets");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // 通知和反馈增强
  const handleFavoriteClick = useCallback((target: IDSOFramingObjectInfo) => {
    setFavorites((prev) => {
      const isFavorite = prev.includes(target.name);
      const newFavorites = isFavorite
        ? prev.filter((name) => name !== target.name)
        : [...prev, target.name];

      // 保存到 localStorage
      localStorage.setItem("favorite-targets", JSON.stringify(newFavorites));

      // 添加反馈通知
      toast(isFavorite ? "已移除收藏" : "已添加到收藏", {
        icon: isFavorite ? "💔" : "❤️",
        description: target.name,
      });

      return newFavorites;
    });
  }, []);

  // Filtered and sorted targets
  const filteredTargets = useMemo(() => {
    return target_store
      .filter((target) => {
        if (showFavorites && !favorites.includes(target.name)) return false;
        if (filterMode.tag !== "all" && target.tag !== filterMode.tag)
          return false;
        if (filterMode.flag !== "all" && target.flag !== filterMode.flag)
          return false;
        if (filterMode.type !== "all" && target.type !== filterMode.type)
          return false;
        if (
          filterMode.search_query &&
          !target.name.includes(filterMode.search_query)
        )
          return false;
        return true;
      })
      .map((target) => ({
        ...target,
        type: target.type || "",
      }));
  }, [target_store, filterMode, showFavorites, favorites]);

  const sortedTargets = useMemo(() => {
    return [...filteredTargets].sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [filteredTargets, sortOrder, sortField]);

  // Functions
  const onCardChecked = useCallback(
    (card_index: number, checked: boolean) => {
      if (checked) {
        clear_all_checked();
        store_check_one_target(card_index);
        setSelectedTargets([card_index]);
      } else {
        clear_all_checked();
        setSelectedTargets([]);
      }
    },
    [clear_all_checked, store_check_one_target]
  );

  // 优化聚焦目标函数
  const onFocusCenterTargetClicked = () => {
    if (selectedTargets.length === 1) {
      const targetName = target_store[selectedTargets[0]].name;
      const toastId = toast.loading(`聚焦到目标 ${targetName}...`);

      setTimeout(() => {
        change_saved_focus_target(selectedTargets[0].toString());

        toast.success(`已聚焦到目标`, {
          id: toastId,
          icon: <Target className="h-4 w-4" />,
          description: targetName,
        });

        if (props.on_choice_maken) {
          props.on_choice_maken();
        }
      }, 500);
    } else {
      toast.error("无法聚焦", {
        description: "请选择单个目标进行聚焦",
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }
  };

  // 优化删除目标函数
  const deleteSelectedTargets = useCallback(() => {
    if (selectedTargets.length > 0) {
      const targetNames = selectedTargets.map(
        (index) => target_store[index].name
      );
      const count = selectedTargets.length;

      // 显示带进度的通知
      const toastId = toast.loading(`正在删除 ${count} 个目标...`);

      // 模拟删除过程
      setTimeout(() => {
        selectedTargets.forEach((index) => {
          remove_one_target(index.toString());
        });
        save_all_targets();

        toast.success(`已删除 ${count} 个目标`, {
          id: toastId,
          description:
            targetNames.slice(0, 2).join(", ") +
            (targetNames.length > 2 ? ` 等 ${count} 个目标` : ""),
        });

        setSelectedTargets([]);
        setBatchMode(false);
      }, 800);
    } else {
      toast.error("没有选择任何目标", {
        description: "请先选择要删除的目标",
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }
  }, [remove_one_target, save_all_targets, selectedTargets, target_store]);

  // 优化重命名功能
  const handleRenameClose = (save: boolean) => {
    if (save && renameText !== "" && selectedTargets.length === 1) {
      const oldName = target_store[selectedTargets[0]].name;

      const toastId = toast.loading(`正在重命名 ${oldName}...`);

      // 模拟重命名过程
      setTimeout(() => {
        store_target_rename({
          index: selectedTargets[0],
          update_string: renameText,
        });

        toast.success(`重命名成功`, {
          id: toastId,
          description: `${oldName} → ${renameText}`,
        });
      }, 500);
    }
    setRenameText("");
    setRenameTextDialog(false);
  };

  // 优化更新标记功能
  const handleFlagClose = (save: boolean) => {
    if (save && flagText !== "" && selectedTargets.length === 1) {
      const targetName = target_store[selectedTargets[0]].name;
      const oldFlag = target_store[selectedTargets[0]].flag;

      const toastId = toast.loading(`更新${targetName}的标记...`);

      setTimeout(() => {
        store_target_set_flag({
          index: selectedTargets[0],
          update_string: flagText,
        });

        toast.success(`标记已更新`, {
          id: toastId,
          icon: <Flag className="h-4 w-4" />,
          description: oldFlag
            ? `${targetName}: ${oldFlag} → ${flagText}`
            : `${targetName}: 添加标记 ${flagText}`,
        });
      }, 500);
    }
    setFlagText("");
    setFlagDialog(false);
  };

  const handleTagSelection = (value: string) => {
    setTagValue(value);
  };

  // 优化标签选择
  const handleTagClose = () => {
    if (tagValue !== "all" && selectedTargets.length === 1) {
      const targetName = target_store[selectedTargets[0]].name;
      const oldTag = target_store[selectedTargets[0]].tag;

      const toastId = toast.loading(`更新${targetName}的标签...`);

      setTimeout(() => {
        store_target_set_tag({
          index: selectedTargets[0],
          update_string: tagValue,
        });

        toast.success(`标签已更新`, {
          id: toastId,
          icon: <Tag className="h-4 w-4" />,
          description: oldTag
            ? `${targetName}: ${oldTag} → ${tagValue}`
            : `${targetName}: 添加标签 ${tagValue}`,
        });

        setTagValue("");
        setTagDialog(false);
      }, 500);
    } else {
      toast.error("请选择有效的标签", {
        description: "标签不能为空或'all'",
        icon: <X className="h-4 w-4" />,
      });
    }
  };

  // 优化导出功能
  const exportTargets = () => {
    const toastId = toast.loading("准备导出数据...");

    setTimeout(() => {
      const data = target_store.map((target) => ({
        name: target.name,
        type: target.type,
        tag: target.tag,
        flag: target.flag,
      }));
      const csvContent = `data:text/csv;charset=utf-8,${[
        "Name",
        "Type",
        "Tag",
        "Flag",
      ].join(",")}\n${data
        .map((t) => `${t.name},${t.type},${t.tag},${t.flag}`)
        .join("\n")}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "targets_list.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`已导出 ${data.length} 个目标的数据`, {
        id: toastId,
        description: "文件已下载到您的设备",
      });
    }, 800);
  };

  const handleBatchDelete = useCallback(() => {
    deleteSelectedTargets();
  }, [deleteSelectedTargets]);

  // 优化导出功能
  const exportSelectedTargets = () => {
    if (selectedTargets.length === 0) {
      toast.error("未选择目标", {
        description: "请先选择要导出的目标",
        icon: <AlertTriangle className="h-4 w-4" />,
      });
      return;
    }

    const count = selectedTargets.length;
    const toastId = toast.loading(`正在导出 ${count} 个选定目标...`);

    setTimeout(() => {
      const selectedData = selectedTargets.map((index) => {
        const target = target_store[index];
        return {
          name: target.name,
          ra: target.ra,
          dec: target.dec,
          type: target.target_type,
          tag: target.tag,
          flag: target.flag,
          rotation: target.rotation,
          size: target.size,
        };
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        "Name,RA,Dec,Type,Tag,Flag,Rotation,Size\n" +
        selectedData
          .map(
            (row) =>
              `${row.name},${row.ra},${row.dec},${row.type},${row.tag},${row.flag},${row.rotation},${row.size}`
          )
          .join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `target_export_${new Date().toISOString()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`已导出 ${count} 个选定目标的数据`, {
        id: toastId,
        description: "文件已下载到您的设备",
      });
    }, 800);
  };

  const batchUpdateTags = (newTag: string) => {
    if (selectedTargets.length === 0) {
      toast.error("未选择目标", {
        description: "请先选择要更新的目标",
        icon: <AlertTriangle className="h-4 w-4" />,
      });
      return;
    }

    const count = selectedTargets.length;
    const toastId = toast.loading(`正在更新 ${count} 个目标的标签...`);

    setTimeout(() => {
      selectedTargets.forEach((index) => {
        store_target_set_tag({
          index,
          update_string: newTag,
        });
      });

      save_all_targets();

      toast.success(`已更新 ${count} 个目标的标签`, {
        id: toastId,
        icon: <Tag className="h-4 w-4" />,
        description: `标签设置为: ${newTag}`,
      });

      setTagDialog(false);
      setSelectedTargets([]);
      setBatchMode(false);
    }, 800);
  };

  const batchUpdateFlags = (newFlag: string) => {
    if (selectedTargets.length === 0) {
      toast.error("未选择目标", {
        description: "请先选择要更新的目标",
        icon: <AlertTriangle className="h-4 w-4" />,
      });
      return;
    }

    const count = selectedTargets.length;
    const toastId = toast.loading(`正在更新 ${count} 个目标的标记...`);

    setTimeout(() => {
      selectedTargets.forEach((index) => {
        store_target_set_flag({
          index,
          update_string: newFlag,
        });
      });

      save_all_targets();

      toast.success(`已更新 ${count} 个目标的标记`, {
        id: toastId,
        icon: <Flag className="h-4 w-4" />,
        description: `标记设置为: ${newFlag}`,
      });

      setFlagDialog(false);
      setSelectedTargets([]);
      setBatchMode(false);
    }, 800);
  };

  // 添加批量模式切换函数
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    if (!batchMode) {
      setSelectedTargets([]);
      clear_all_checked();
      toast.info("已开启批量操作模式", {
        description: "可以选择多个目标进行操作",
        duration: 3000,
      });
    } else {
      toast.info("已退出批量操作模式", {
        duration: 2000,
      });
    }
  };

  // 清除选择
  const handleCancelSelection = () => {
    setSelectedTargets([]);
    setBatchMode(false);
    clear_all_checked();
    toast.info("已清除所有选择", {
      icon: <Check className="h-4 w-4" />,
      duration: 2000,
    });
  };

  return (
    <div className="flex flex-col h-[100vh] gap-4 p-4 rounded-lg dark:bg-gray-900">
      {/* 过滤器面板 - 在竖屏模式下水平布局 */}
      <div className="flex-none">
        <FilterPanel
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          all_tags={all_tags}
          all_flags={all_flags}
          onBatchMode={toggleBatchMode}
          onExportAll={exportTargets}
          showFavorites={showFavorites}
          setShowFavorites={setShowFavorites}
        />
      </div>

      {/* 主要内容区域 - 自适应高度 */}
      <div className="flex-1 min-h-0 overflow-auto">
        <TargetList
          targets={sortedTargets}
          viewMode={viewMode}
          batchMode={batchMode}
          selectedTargets={selectedTargets}
          setSelectedTargets={setSelectedTargets}
          onCardChecked={onCardChecked}
          onChoiceMaken={props.on_choice_maken}
          setViewMode={setViewMode}
          sortField={sortField}
          setSortField={setSortField}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          favorites={favorites}
          onFavoriteClick={handleFavoriteClick}
        />
      </div>

      {/* 批量操作工具栏 - 固定在底部 */}
      {batchMode && selectedTargets.length > 0 && (
        <div className="flex-none sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <BatchOperationToolbar
            selectedCount={selectedTargets.length}
            onCancel={handleCancelSelection}
            onBatchDelete={handleBatchDelete}
            onBatchExport={exportSelectedTargets}
            onBatchUpdateTag={() => setTagDialog(true)}
            onBatchUpdateFlag={() => setFlagDialog(true)}
            onFocusTarget={onFocusCenterTargetClicked}
          />
        </div>
      )}

      {/* 对话框组件保持不变 */}
      <RenameDialog
        open={renameTextDialog}
        onOpenChange={setRenameTextDialog}
        renameText={renameText}
        setRenameText={setRenameText}
        handleRenameClose={handleRenameClose}
      />
      <FlagDialog
        open={flagDialog}
        onOpenChange={setFlagDialog}
        flagText={flagText}
        setFlagText={setFlagText}
        handleFlagClose={handleFlagClose}
        isBatchMode={batchMode}
        onBatchUpdate={batchUpdateFlags}
      />
      <TagDialog
        open={tagDialog}
        onOpenChange={setTagDialog}
        tagValue={tagValue}
        setTagValue={setTagValue}
        all_tags={all_tags}
        handleTagSelection={handleTagSelection}
        handleTagClose={handleTagClose}
        isBatchMode={batchMode}
        onBatchUpdate={batchUpdateTags}
      />
      <PopupDialog
        open={popupDialog}
        onOpenChange={setPopupDialog}
        popupText={popupText}
        setPopupText={setPopupText}
      />
    </div>
  );
};

export default ObjectManagement;
