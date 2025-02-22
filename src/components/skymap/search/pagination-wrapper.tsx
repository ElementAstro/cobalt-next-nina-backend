import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (value: number) => void;
  showQuickJump?: boolean;
  showItemsPerPage?: boolean;
  disabled?: boolean;
}

const PAGE_ITEMS_OPTIONS = [10, 20, 50, 100];

export function PaginationWrapper({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  showQuickJump = true,
  showItemsPerPage = true,
  disabled = false,
}: PaginationWrapperProps) {
  const [jumpPage, setJumpPage] = useState("");

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpPage);
    if (
      !isNaN(page) &&
      page >= 1 &&
      page <= totalPages &&
      page !== currentPage
    ) {
      onPageChange(page);
    }
    setJumpPage("");
  };

  const renderPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 7;
    const sideItems = 2;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 始终显示第一页
      pages.push(1);

      if (currentPage <= sideItems + 2) {
        // 当前页靠近开始
        for (let i = 2; i <= sideItems + 3; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - (sideItems + 1)) {
        // 当前页靠近结束
        pages.push("ellipsis");
        for (let i = totalPages - (sideItems + 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <div className="p-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {totalItems !== undefined && (
              <Badge variant="outline" className="h-9 px-4 text-sm">
                总数: {totalItems}
              </Badge>
            )}
            {showItemsPerPage && onItemsPerPageChange && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每页显示:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_ITEMS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toString()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Pagination>
            <PaginationContent>
              <TooltipProvider>
                {/* 首页按钮 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => !disabled && onPageChange(1)}
                        disabled={currentPage === 1 || disabled}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </TooltipTrigger>
                  <TooltipContent>第一页</TooltipContent>
                </Tooltip>

                {/* 上一页按钮 */}
                {!disabled && currentPage > 1 ? (
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => onPageChange(currentPage - 1)} 
                    />
                  </PaginationItem>
                ) : (
                  <PaginationItem>
                    <Button variant="ghost" size="icon" disabled>
                      <PaginationPrevious />
                    </Button>
                  </PaginationItem>
                )}

                {/* 页码按钮 */}
                <AnimatePresence mode="wait">
                  {renderPageNumbers().map((page, index) => (
                    <PaginationItem key={`${page}-${index}`}>
                      {page === "ellipsis" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled
                          className="cursor-default"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          {!disabled ? (
                            <PaginationLink
                              onClick={() => onPageChange(page)}
                              isActive={page === currentPage}
                            >
                              {page}
                            </PaginationLink>
                          ) : (
                            <Button
                              variant={page === currentPage ? "default" : "ghost"}
                              size="icon"
                              disabled
                            >
                              {page}
                            </Button>
                          )}
                        </motion.div>
                      )}
                    </PaginationItem>
                  ))}
                </AnimatePresence>

                {/* 下一页按钮 */}
                {!disabled && currentPage < totalPages ? (
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => onPageChange(currentPage + 1)} 
                    />
                  </PaginationItem>
                ) : (
                  <PaginationItem>
                    <Button variant="ghost" size="icon" disabled>
                      <PaginationNext />
                    </Button>
                  </PaginationItem>
                )}

                {/* 末页按钮 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => !disabled && onPageChange(totalPages)}
                        disabled={currentPage === totalPages || disabled}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </TooltipTrigger>
                  <TooltipContent>最后一页</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </PaginationContent>
          </Pagination>

          {showQuickJump && (
            <form
              onSubmit={handleJumpSubmit}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-muted-foreground">跳转至:</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                className="w-16 h-9"
                disabled={disabled}
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={!jumpPage || disabled}
              >
                跳转
              </Button>
            </form>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
