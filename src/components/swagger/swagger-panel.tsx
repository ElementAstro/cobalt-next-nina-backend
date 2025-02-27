import { useEffect, useMemo, useState } from 'react'
import { useSwaggerStore } from '@/store/swagger-store'
import { useSettingsStore } from '@/store/settings-store'
import { useFavoritesStore } from '@/store/favorites-store'
import { useRequestHistoryStore } from '@/store/request-history-store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SwaggerEndpoints from './swagger-endpoints'
import SwaggerEndpointDetail from './swagger-endpoint-detail'
import SwaggerModels from './swagger-models'
import Favorites from './swagger-favorites'
import SearchFilter from './search-filter'
import SettingsPanel from './settings-panel'
import RequestHistory from './request-history'
import ResponsiveLayout from './responsive-layout'
import { AnimatedContainer, AnimatedIf } from '@/components/ui/animated-container'
import { motion } from 'framer-motion'
import { Bookmark, Clock, Code, Database, FileSearch, LayoutDashboard, Loader, RefreshCw, RotateCw } from 'lucide-react'

interface SwaggerPanelProps {
  swaggerUrl: string
}

export default function SwaggerPanel({ swaggerUrl }: SwaggerPanelProps) {
  const { fetchSpec, spec, isLoading, error, setSelectedEndpoint } = useSwaggerStore()
  const { theme, layout, fontSize, highlightColor } = useSettingsStore()
  const [activeTab, setActiveTab] = useState('endpoints')
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilters, setMethodFilters] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSpec(swaggerUrl)
    setRefreshing(false)
  }
  
  // 从spec中提取所有标签
  const allTags = useMemo(() => {
    if (!spec) return []
    
    const tags = new Set<string>()
    
    // 从定义的tags中获取
    if (spec.tags) {
      spec.tags.forEach((tag: any) => tags.add(tag.name))
    }
    
    // 从路径中获取
    Object.values(spec.paths || {}).forEach((pathItem: any) => {
      Object.values(pathItem).forEach((operation: any) => {
        if (operation.tags && Array.isArray(operation.tags)) {
          operation.tags.forEach((tag: string) => tags.add(tag))
        }
      })
    })
    
    return Array.from(tags)
  }, [spec])

  useEffect(() => {
    fetchSpec(swaggerUrl)
    
    // 设置主题
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // 根据系统设置
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    
    // 设置字体大小
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`)
    
    // 设置强调色
    document.documentElement.style.setProperty('--highlight-color', `var(--${highlightColor})`)
    
  }, [swaggerUrl, fetchSpec, theme, fontSize, highlightColor])

  if (isLoading && !spec) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">加载API文档中...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4 max-w-md">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <FileSearch className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold">加载失败</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => fetchSpec(swaggerUrl)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </div>
      </div>
    )
  }
  
  if (!spec) return null
  
  // 侧边栏内容
  const sidebarContent = (
    <AnimatedContainer animation="fadeIn">
      <div className="space-y-4">
        <SearchFilter 
          onSearch={setSearchQuery}
          onMethodFilter={setMethodFilters}
          onTagFilter={setTagFilters}
          availableTags={allTags}
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="endpoints" className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">接口</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-1">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">收藏</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">历史</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="endpoints" className="mt-4 space-y-4">
            <SwaggerEndpoints 
              searchQuery={searchQuery}
              methodFilters={methodFilters}
              tagFilters={tagFilters}
            />
          </TabsContent>
          
          <TabsContent value="favorites" className="mt-4">
            <Favorites />
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <RequestHistory />
          </TabsContent>
        </Tabs>
      </div>
    </AnimatedContainer>
  )
  
  // 主内容区域
  const mainContent = (
    <AnimatedContainer animation="fadeIn">
      <Card className="border-none sm:border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {spec.info.title}
              <Badge variant="outline">{spec.info.version}</Badge>
            </CardTitle>
            <CardDescription className="mt-1.5">
              {spec.info.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RotateCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <SettingsPanel />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="detail">
            <TabsList>
              <TabsTrigger value="detail" className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                端点详情
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                数据模型
              </TabsTrigger>
            </TabsList>
            <TabsContent value="detail" className="mt-4">
              <SwaggerEndpointDetail />
            </TabsContent>
            <TabsContent value="models" className="mt-4">
              <SwaggerModels />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AnimatedContainer>
  )

  return (
    <div className="w-full" style={{ fontSize: `${fontSize}px` }}>
      <ResponsiveLayout
        sidebar={sidebarContent}
        content={mainContent}
        className="gap-4"
      />
    </div>
  )
}