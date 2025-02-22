"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clipboard,
  ClipboardCheck,
  Trash2,
  Edit,
  Download,
  Plus,
  Check,
  X,
  AlertCircle,
  Cookie as CookieIcon,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCookieStore } from "@/stores/storage/cookieStore";

interface CookieData {
  name: string;
  value: string;
  path?: string;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
  httpOnly?: boolean;
  selected?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export function CookieManager() {
  const {
    addCookie,
    updateCookie,
    deleteCookie,
    deleteSelected,
    selectAll,
    toggleSelect,
    getCookies,
  } = useCookieStore();

  const [newCookie, setNewCookie] = useState<CookieData>({
    name: "",
    value: "",
    path: "/",
    sameSite: "strict",
    secure: true,
    httpOnly: false,
  });

  const [cookies, setCookies] = useState<CookieData[]>([]);
  const [editCookie, setEditCookie] = useState<CookieData | null>(null);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [copiedCookie, setCopiedCookie] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCookies = useCallback(async () => {
    try {
      const loadedCookies = await getCookies();
      setCookies(loadedCookies);
    } catch (error) {
      setError("无法加载 Cookies");
      console.error("加载 Cookies 失败:", error);
    }
  }, [getCookies]);

  useEffect(() => {
    loadCookies();
  }, [loadCookies]);

  const handleAddCookie = async () => {
    if (!newCookie.name || !newCookie.value) {
      setError("Cookie 名称和值不能为空");
      return;
    }

    if (cookies.some((c) => c.name === newCookie.name)) {
      setError("已存在相同名称的 Cookie");
      return;
    }

    setIsAdding(true);
    try {
      await addCookie(newCookie);
      setNewCookie({
        name: "",
        value: "",
        path: "/",
        sameSite: "strict",
        secure: true,
        httpOnly: false,
      });
      loadCookies();
      toast({
        title: "Cookie 已添加",
        description: `Cookie "${newCookie.name}" 已成功添加`,
      });
    } catch (error) {
      setError("添加 Cookie 失败");
      console.error("添加 Cookie 失败:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateCookie = async () => {
    if (!editCookie) return;

    try {
      await updateCookie(editCookie);
      setEditCookie(null);
      loadCookies();
      toast({
        title: "Cookie 已更新",
        description: `Cookie "${editCookie.name}" 已成功更新`,
      });
    } catch (error) {
      setError("更新 Cookie 失败");
      console.error("更新 Cookie 失败:", error);
    }
  };

  const handleDeleteCookie = async (name: string) => {
    try {
      await deleteCookie(name);
      loadCookies();
      toast({
        title: "Cookie 已删除",
        description: `Cookie "${name}" 已成功删除`,
      });
    } catch (error) {
      setError("删除 Cookie 失败");
      console.error("删除 Cookie 失败:", error);
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      await deleteSelected();
      loadCookies();
      setSelectAllChecked(false);
      toast({
        title: "已删除选中的 Cookies",
        description: "所选 Cookies 已成功删除",
      });
    } catch (error) {
      setError("删除 Cookies 失败");
      console.error("删除 Cookies 失败:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    const selectedCookies = cookies.filter((cookie) => cookie.selected);
    if (selectedCookies.length === 0) {
      setError("请先选择要导出的 Cookies");
      return;
    }

    setIsExporting(true);
    try {
      const cookieData = JSON.stringify(selectedCookies, null, 2);
      const blob = new Blob([cookieData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cookies.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Cookies 已导出",
        description: `${selectedCookies.length} 个 Cookies 已成功导出`,
      });
    } catch (error) {
      setError("导出 Cookies 失败");
      console.error("导出 Cookies 失败:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedCookie(value);
    setTimeout(() => setCopiedCookie(null), 2000);
    toast({
      title: "已复制",
      description: "Cookie 值已复制到剪贴板",
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAllChecked(checked);
    selectAll(checked);
    loadCookies();
  };

  const handleToggleSelect = (name: string, checked: boolean) => {
    toggleSelect(name, checked);
    loadCookies().then(() => {
      setSelectAllChecked(cookies.every((cookie) => cookie.selected));
    });
  };

  return (
    <TooltipProvider>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        className="space-y-4"
      >
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <CookieIcon className="w-6 h-6" />
                Cookie 管理器
              </CardTitle>
              <Badge
                variant="outline"
                className="text-blue-400 border-blue-400/30"
              >
                {cookies.length} 个 Cookies
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Display */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="absolute top-2 right-2 p-1 hover:bg-red-500/20 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Cookie Form */}
            <Card className="bg-gray-800/30 border-gray-700">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400">名称</Label>
                    <Input
                      placeholder="Cookie 名称"
                      value={newCookie.name}
                      onChange={(e) =>
                        setNewCookie({ ...newCookie, name: e.target.value })
                      }
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">值</Label>
                    <Input
                      placeholder="Cookie 值"
                      value={newCookie.value}
                      onChange={(e) =>
                        setNewCookie({ ...newCookie, value: e.target.value })
                      }
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400">路径</Label>
                    <Input
                      placeholder="/"
                      value={newCookie.path}
                      onChange={(e) =>
                        setNewCookie({ ...newCookie, path: e.target.value })
                      }
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">SameSite</Label>
                    <Select
                      value={newCookie.sameSite}
                      onValueChange={(value) =>
                        setNewCookie({
                          ...newCookie,
                          sameSite: value as "strict" | "lax" | "none",
                        })
                      }
                    >
                      <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue placeholder="选择 SameSite 值" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strict">Strict</SelectItem>
                        <SelectItem value="lax">Lax</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="secure"
                      checked={newCookie.secure}
                      onCheckedChange={(checked) =>
                        setNewCookie({ ...newCookie, secure: !!checked })
                      }
                    />
                    <Label htmlFor="secure" className="text-gray-400">
                      Secure
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="httpOnly"
                      checked={newCookie.httpOnly}
                      onCheckedChange={(checked) =>
                        setNewCookie({ ...newCookie, httpOnly: !!checked })
                      }
                    />
                    <Label htmlFor="httpOnly" className="text-gray-400">
                      HttpOnly
                    </Label>
                  </div>
                </div>

                <Button
                  onClick={handleAddCookie}
                  className="w-full gap-2"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      添加中...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      添加 Cookie
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectAllChecked}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
                <Label htmlFor="select-all" className="text-gray-400">
                  全选
                </Label>
              </div>

              <div className="flex-1" />

              <div className="flex flex-wrap gap-2">
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={!cookies.some((c) => c.selected) || isDeleting}
                    className="gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        删除中...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        删除选中
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  <Button
                    onClick={handleExport}
                    disabled={!cookies.some((c) => c.selected) || isExporting}
                    className="gap-2"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        导出中...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        导出选中
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Cookie Table */}
            <Card className="bg-gray-800/30 border-gray-700">
              <ScrollArea className="h-[400px] rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-gray-800/50">
                      <TableHead className="w-[50px]">选择</TableHead>
                      <TableHead>名称</TableHead>
                      <TableHead>值</TableHead>
                      <TableHead>路径</TableHead>
                      <TableHead>SameSite</TableHead>
                      <TableHead>Secure</TableHead>
                      <TableHead>HttpOnly</TableHead>
                      <TableHead className="w-[120px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {cookies.map((cookie) => (
                        <motion.tr
                          key={cookie.name}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="group hover:bg-gray-800/50"
                        >
                          <TableCell>
                            <Checkbox
                              checked={cookie.selected}
                              onCheckedChange={(checked) =>
                                handleToggleSelect(cookie.name, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium text-gray-200">
                            {cookie.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-[200px]">
                              <span className="truncate text-gray-300">
                                {cookie.value}
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleCopyValue(cookie.value)
                                    }
                                    className="invisible group-hover:visible"
                                  >
                                    {copiedCookie === cookie.value ? (
                                      <ClipboardCheck className="w-4 h-4 text-green-400" />
                                    ) : (
                                      <Clipboard className="w-4 h-4 text-gray-400" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {copiedCookie === cookie.value
                                      ? "已复制"
                                      : "复制值"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {cookie.path || "/"}
                          </TableCell>
                          <TableCell className="text-gray-300 capitalize">
                            {cookie.sameSite || "strict"}
                          </TableCell>
                          <TableCell>
                            {cookie.secure ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <X className="w-4 h-4 text-red-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            {cookie.httpOnly ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <X className="w-4 h-4 text-red-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-gray-700/50"
                                  >
                                    <Edit className="w-4 h-4 text-blue-400" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-gray-900 border-gray-800">
                                  <DialogHeader>
                                    <DialogTitle>编辑 Cookie</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label className="text-right text-gray-400">
                                        名称
                                      </Label>
                                      <Input
                                        value={editCookie?.name || ""}
                                        readOnly
                                        className="col-span-3 bg-gray-800 border-gray-700"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label className="text-right text-gray-400">
                                        值
                                      </Label>
                                      <Input
                                        value={editCookie?.value || ""}
                                        onChange={(e) =>
                                          setEditCookie(
                                            editCookie
                                              ? {
                                                  ...editCookie,
                                                  value: e.target.value,
                                                }
                                              : null
                                          )
                                        }
                                        className="col-span-3 bg-gray-800 border-gray-700"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      onClick={() => setEditCookie(null)}
                                    >
                                      取消
                                    </Button>
                                    <Button onClick={handleUpdateCookie}>
                                      更新
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gray-900 border-gray-800">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      确认删除？
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      确定要删除 Cookie &quot;{cookie.name}
                                      &quot; 吗？此操作无法撤销。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-800 hover:bg-gray-700">
                                      取消
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteCookie(cookie.name)
                                      }
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      删除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
