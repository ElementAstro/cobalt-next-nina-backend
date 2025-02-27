import { useFavoritesStore } from "@/stores/swagger/favoriteStore";
import { useSwaggerStore } from "@/stores/swagger/swaggerStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export default function Favorites() {
  const { favorites, removeFavorite } = useFavoritesStore();
  const { setSelectedEndpoint } = useSwaggerStore();

  const methodColors: Record<string, string> = {
    get: "bg-blue-500",
    post: "bg-green-500",
    put: "bg-yellow-500",
    delete: "bg-red-500",
    patch: "bg-purple-500",
  };

  const handleEndpointClick = (path: string, method: string) => {
    setSelectedEndpoint(`${path}:${method}`);
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <Star className="mb-2 h-8 w-8 opacity-20" />
        <p>还没有收藏的接口</p>
        <p className="text-sm">点击端点旁边的星标图标添加收藏</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      <div className="space-y-2 p-1">
        <AnimatePresence>
          {favorites.map((favorite) => (
            <motion.div
              key={favorite.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() =>
                  handleEndpointClick(favorite.path, favorite.method)
                }
              >
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${
                      methodColors[favorite.method.toLowerCase()]
                    } uppercase`}
                  >
                    {favorite.method}
                  </Badge>
                  <span className="font-medium">
                    {favorite.summary || favorite.path}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {favorite.path}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {favorite.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFavorite(favorite.id)}
                className="ml-2 text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
