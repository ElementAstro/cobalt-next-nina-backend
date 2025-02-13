"use client";

import * as React from "react";
import { ChevronLeft, Menu, LucideIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

// 类型定义
export interface SettingsItem {
  name: string;
  icon: LucideIcon;
  component?: React.ComponentType;
  disabled?: boolean;
  description?: string;
}

export interface SettingsDialogProps {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  items: SettingsItem[];
  defaultActive?: string;
  className?: string;
  onSettingChange?: (setting: string) => void;
}

export function SettingsDialog({
  trigger,
  title = "设置",
  description = "自定义你的设置",
  items,
  defaultActive,
  className = "",
  onSettingChange,
}: SettingsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [activeSetting, setActiveSetting] = React.useState(
    defaultActive || items[0]?.name
  );
  const [showMobileNav, setShowMobileNav] = React.useState(false);

  const ActiveComponent = items.find(
    (item) => item.name === activeSetting
  )?.component;

  const handleSettingChange = (name: string) => {
    setActiveSetting(name);
    setShowMobileNav(false);
    onSettingChange?.(name);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm">打开设置</Button>}
      </DialogTrigger>
      <DialogContent
        className={`overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[90vw] md:max-w-[700px] lg:max-w-[800px] ${className}`}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar
            collapsible="none"
            className={`${showMobileNav ? "flex" : "hidden"} md:flex`}
          >
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.name === activeSetting}
                          onClick={() => handleSettingChange(item.name)}
                          disabled={item.disabled}
                          title={item.description}
                        >
                          <a href="#" className="group">
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                            {item.disabled && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (禁用)
                              </span>
                            )}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[80vh] sm:h-[70vh] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setShowMobileNav(!showMobileNav)}
              >
                {showMobileNav ? <ChevronLeft /> : <Menu />}
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">{title}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeSetting}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
