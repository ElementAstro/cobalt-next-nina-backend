"use client";

import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CookieManager } from "@/components/storage/cookie";
import { IndexedDBManager } from "@/components/storage/indexdb";
import { useMediaQuery } from "react-responsive";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// 添加新的样式对象
const scrollableStyles = {
  scrollbarWidth: 'none',  // Firefox
  msOverflowStyle: 'none',  // IE/Edge
  '&::-webkit-scrollbar': {
    display: 'none'  // Chrome/Safari/Webkit
  }
} as const;

export default function OnlineStorage() {
  const isLandscape = useMediaQuery({ query: "(orientation: landscape)" });

  return (
    <motion.div
      className="dark bg-gray-900 h-[100vh] p-4 md:p-6 flex flex-col overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Tabs
        defaultValue="cookies"
        className="bg-gray-800 text-white rounded-lg shadow-lg flex flex-col h-full"
      >
        <TabsList className="flex bg-gray-700 p-1 rounded-t-lg shrink-0">
          <TabsTrigger
            value="cookies"
            className="flex-1 text-sm py-2 data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            Cookies
          </TabsTrigger>
          <TabsTrigger
            value="indexeddb"
            className="flex-1 text-sm py-2 data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            IndexedDB
          </TabsTrigger>
        </TabsList>
        <div className="p-2 flex-1 overflow-hidden">
          <TabsContent value="cookies" className="mt-0 h-full">
            <div className="h-full overflow-auto" style={scrollableStyles}>
              <CookieManager isLandscape={isLandscape} />
            </div>
          </TabsContent>
          <TabsContent value="indexeddb" className="mt-0 h-full">
            <div className="h-full overflow-auto" style={scrollableStyles}>
              <IndexedDBManager isLandscape={isLandscape} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}