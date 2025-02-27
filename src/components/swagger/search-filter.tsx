import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onMethodFilter: (methods: string[]) => void;
  onTagFilter: (tags: string[]) => void;
  availableTags: string[];
}

export default function SearchFilter({
  onSearch,
  onMethodFilter,
  onTagFilter,
  availableTags,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const methods = ["get", "post", "put", "delete", "patch"];

  const handleMethodChange = (method: string) => {
    const updated = selectedMethods.includes(method)
      ? selectedMethods.filter((m) => m !== method)
      : [...selectedMethods, method];

    setSelectedMethods(updated);
    onMethodFilter(updated);
  };

  const handleTagChange = (tag: string) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(updated);
    onTagFilter(updated);
  };

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMethods([]);
    setSelectedTags([]);
    onSearch("");
    onMethodFilter([]);
    onTagFilter([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索接口..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="secondary" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              方法
              {selectedMethods.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {selectedMethods.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {methods.map((method) => (
              <DropdownMenuCheckboxItem
                key={method}
                checked={selectedMethods.includes(method)}
                onCheckedChange={() => handleMethodChange(method)}
              >
                <span className="capitalize">{method}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              标签
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-[300px] overflow-y-auto"
          >
            {availableTags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => handleTagChange(tag)}
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(selectedMethods.length > 0 ||
          selectedTags.length > 0 ||
          searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            清除筛选
          </Button>
        )}
      </div>

      {(selectedMethods.length > 0 || selectedTags.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {selectedMethods.map((method) => (
            <Badge
              key={method}
              variant="outline"
              className="flex items-center gap-1"
            >
              <span className="capitalize">{method}</span>
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleMethodChange(method)}
              />
            </Badge>
          ))}
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="flex items-center gap-1"
            >
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleTagChange(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
