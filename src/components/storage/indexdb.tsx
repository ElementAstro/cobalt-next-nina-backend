"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Trash2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Upload,
  Filter,
  SortAsc,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { useIndexedDBStore } from "@/stores/storage/indexdbStore";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

type ImageType = "image/jpeg" | "image/png" | string;

interface ImageData {
  id?: number;
  url: string;
  name?: string;
  type?: ImageType;
  timestamp?: number;
  size?: number;
  selected?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const imageVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  hover: { scale: 1.05 },
};

export function IndexedDBManager() {
  const {
    isDBOpen,
    openDB: openDBStore,
    addImage,
    deleteImage,
    clearDB,
    getAllImages,
  } = useIndexedDBStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("latest");
  const [filterType, setFilterType] = useState<string>("all");
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStore] = useState<string>("images");

  const openDB = useCallback(() => {
    openDBStore();
  }, [openDBStore]);

  useEffect(() => {
    openDB();
  }, [openDB]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "上传失败",
        description: "请选择有效的图片文件",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onloadstart = () => setUploadProgress(0);
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress((e.loaded / e.total) * 100);
      }
    };
    reader.onload = async (e) => {
      try {
        const imageUrl = e.target?.result as string;
        setPreviewUrl(imageUrl);
        setMetadata({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });
        const newImage: ImageData = {
          url: imageUrl,
          name: file.name,
          type: file.type as ImageType,
          size: file.size,
          timestamp: Date.now(),
        };
        await addImage(newImage, selectedStore);
        handleFetchImages();
        toast({
          title: "图片上传成功",
          description: `成功上传文件: ${file.name}`,
        });
      } catch (err) {
        setError("上传图片失败");
        console.error(err);
        toast({
          title: "上传失败",
          description: "上传图片时发生错误",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const input = document.createElement("input");
      input.type = "file";
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      const event = {
        target: input,
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(event);
    } else {
      toast({
        title: "上传失败",
        description: "请拖放有效的图片文件",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (id?: number) => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      await deleteImage(id, selectedStore);
      toast({
        title: "图片已删除",
        description: "选中的图片已成功删除",
      });
      await handleFetchImages();
    } catch (err) {
      setError("删除图片失败");
      console.error(err);
      toast({
        title: "删除失败",
        description: "删除图片时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDB = async () => {
    try {
      setIsLoading(true);
      await clearDB();
      setPreviewUrl(null);
      setMetadata(null);
      setImages([]);
      setFilteredImages([]);
      toast({
        title: "数据库已清空",
        description: "所有数据已成功清除",
      });
    } catch (err) {
      setError("清空数据库失败");
      console.error(err);
      toast({
        title: "清空失败",
        description: "清空数据库时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchImages = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedImages = await getAllImages(selectedStore);
      setImages(fetchedImages);
      toast({
        title: "图片已加载",
        description: `成功加载 ${fetchedImages.length} 张图片`,
      });
    } catch (err) {
      setError("获取图片失败");
      console.error(err);
      toast({
        title: "加载失败",
        description: "获取图片时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getAllImages, selectedStore]);

  useEffect(() => {
    let filtered = [...images];

    if (filterType !== "all") {
      filtered = filtered.filter((img) => img.type?.includes(filterType));
    }

    switch (sortOrder) {
      case "latest":
        filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        break;
      case "oldest":
        filtered.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        break;
      case "name":
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }

    setFilteredImages(filtered);
  }, [images, filterType, sortOrder]);

  const toggleMetadata = () => {
    setShowMetadata((prev) => !prev);
    toast({
      title: showMetadata ? "已隐藏元数据" : "已显示元数据",
      description: showMetadata
        ? "图片元数据已隐藏"
        : "现在可以查看图片的详细信息",
    });
  };

  return (
    <TooltipProvider>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="min-h-screen space-y-4"
      >
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-6 h-6" />
                图片管理器
              </CardTitle>
              <Badge
                variant={isDBOpen ? "default" : "destructive"}
                className="transition-colors duration-300"
              >
                {isDBOpen ? "已连接" : "未连接"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Display */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
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

            {/* Upload Area */}
            <motion.div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-700 hover:border-gray-600"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
            >
              <Input
                type="file"
                onChange={handleFileUpload}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-blue-500/10 rounded-full">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">拖拽图片到此处或点击上传</p>
                  <p className="text-sm text-gray-500">支持 JPEG, PNG 图片格式</p>
                </div>
              </div>
            </motion.div>

            {/* Upload Progress */}
            <AnimatePresence>
              {uploadProgress > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>上传进度</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress
                    value={uploadProgress}
                    className="h-2"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">最新上传</SelectItem>
                    <SelectItem value="oldest">最早上传</SelectItem>
                    <SelectItem value="name">文件名</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === "latest" ? "oldest" : "latest")}
                      className="bg-gray-800/50 border-gray-700"
                    >
                      <SortAsc className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>切换排序顺序</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="筛选类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部图片</SelectItem>
                    <SelectItem value="image/jpeg">JPEG</SelectItem>
                    <SelectItem value="image/png">PNG</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setFilterType("all")}
                      className="bg-gray-800/50 border-gray-700"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>重置筛选</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Preview */}
            {previewUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative rounded-lg overflow-hidden bg-gray-800/50"
              >
                <AspectRatio ratio={16 / 9}>
                  <Image
                    src={previewUrl}
                    alt="预览图片"
                    fill
                    className="object-cover"
                    priority
                  />
                </AspectRatio>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMetadata}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                >
                  {showMetadata ? (
                    <EyeOff className="w-4 h-4 text-white" />
                  ) : (
                    <Eye className="w-4 h-4 text-white" />
                  )}
                </Button>
                <AnimatePresence>
                  {showMetadata && metadata && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-sm p-4 space-y-2"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-400">文件名</Label>
                          <p className="text-white text-sm truncate">{metadata.name}</p>
                        </div>
                        <div>
                          <Label className="text-gray-400">大小</Label>
                          <p className="text-white text-sm">
                            {(metadata.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-400">类型</Label>
                          <p className="text-white text-sm">{metadata.type}</p>
                        </div>
                        <div>
                          <Label className="text-gray-400">修改时间</Label>
                          <p className="text-white text-sm">
                            {new Date(metadata.lastModified).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Image Grid */}
            <Card className="bg-gray-800/30 border-gray-700">
              <ScrollArea className="h-[400px] rounded-md p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {filteredImages.map((image) => (
                      <motion.div
                        key={image.id}
                        variants={imageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        whileHover="hover"
                        className="group relative"
                      >
                        <AspectRatio ratio={1}>
                          <Image
                            src={image.url}
                            alt={image.name || "图片"}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </AspectRatio>
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center gap-2"
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => handleDeleteImage(image.id)}
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>删除图片</p>
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
              >
                <Button
                  onClick={() => handleFetchImages()}
                  variant="default"
                  className="gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  刷新列表
                </Button>
              </motion.div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      清空数据库
                    </Button>
                  </motion.div>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-gray-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认清空数据库？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将删除所有存储的图片数据，且无法恢复。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-800 hover:bg-gray-700">
                      取消
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearDB}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      确认清空
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-white">处理中...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
}
