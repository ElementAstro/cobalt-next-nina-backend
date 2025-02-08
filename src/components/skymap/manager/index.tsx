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
    const savedFavorites = localStorage.getItem('favorite-targets');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const handleFavoriteClick = useCallback((target: IDSOFramingObjectInfo) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(target.name) 
        ? prev.filter(name => name !== target.name)
        : [...prev, target.name];
      
      // 保存到 localStorage
      localStorage.setItem('favorite-targets', JSON.stringify(newFavorites));
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

  const onFocusCenterTargetClicked = () => {
    if (selectedTargets.length === 1) {
      change_saved_focus_target(selectedTargets[0].toString());
      if (props.on_choice_maken) {
        props.on_choice_maken();
      }
    } else {
      setPopupText("请选择一个单一的目标进行聚焦！");
      setPopupDialog(true);
    }
  };

  const deleteSelectedTargets = useCallback(() => {
    if (selectedTargets.length > 0) {
      selectedTargets.forEach((index) => {
        remove_one_target(index.toString());
      });
      save_all_targets();
      setSelectedTargets([]);
      setBatchMode(false);
    } else {
      setPopupText("没有选中任何目标进行删除！");
      setPopupDialog(true);
    }
  }, [remove_one_target, save_all_targets, selectedTargets]);

  const handleRenameClose = (save: boolean) => {
    if (save && renameText !== "" && selectedTargets.length === 1) {
      store_target_rename({
        index: selectedTargets[0],
        update_string: renameText,
      });
    }
    setRenameText("");
    setRenameTextDialog(false);
  };

  const handleFlagClose = (save: boolean) => {
    if (save && flagText !== "" && selectedTargets.length === 1) {
      store_target_set_flag({
        index: selectedTargets[0],
        update_string: flagText,
      });
    }
    setFlagText("");
    setFlagDialog(false);
  };

  const handleTagSelection = (value: string) => {
    setTagValue(value);
  };

  const handleTagClose = () => {
    if (tagValue !== "all" && selectedTargets.length === 1) {
      store_target_set_tag({
        index: selectedTargets[0],
        update_string: tagValue,
      });
      setTagValue("");
      setTagDialog(false);
    } else {
      setPopupText("请选择一个有效的标签！");
      setPopupDialog(true);
    }
  };

  const exportTargets = () => {
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
  };

  const handleBatchDelete = useCallback(() => {
    deleteSelectedTargets();
  }, [deleteSelectedTargets]);

  const handleCancelSelection = () => {
    setSelectedTargets([]);
    setBatchMode(false);
    clear_all_checked();
  };

  const exportSelectedTargets = () => {
    if (selectedTargets.length === 0) {
      setPopupText("请先选择要导出的目标！");
      setPopupDialog(true);
      return;
    }

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
  };

  const batchUpdateTags = (newTag: string) => {
    if (selectedTargets.length === 0) {
      setPopupText("请先选择要更新的目标！");
      setPopupDialog(true);
      return;
    }

    selectedTargets.forEach((index) => {
      store_target_set_tag({
        index,
        update_string: newTag,
      });
    });

    save_all_targets();
    setTagDialog(false);
    setSelectedTargets([]);
    setBatchMode(false);
  };

  const batchUpdateFlags = (newFlag: string) => {
    if (selectedTargets.length === 0) {
      setPopupText("请先选择要更新的目标！");
      setPopupDialog(true);
      return;
    }

    selectedTargets.forEach((index) => {
      store_target_set_flag({
        index,
        update_string: newFlag,
      });
    });

    save_all_targets();
    setFlagDialog(false);
    setSelectedTargets([]);
    setBatchMode(false);
  };

  // 添加批量模式切换函数
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    if (!batchMode) {
      setSelectedTargets([]);
      clear_all_checked();
    }
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
