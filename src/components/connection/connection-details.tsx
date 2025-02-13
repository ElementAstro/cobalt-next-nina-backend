"use client";

import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { Server } from "lucide-react";
import { ConnectionFormData } from "@/app/connection/page";

interface ConnectionDetailsProps {
  form: UseFormReturn<ConnectionFormData>;
  isSSL: boolean;
  setIsSSL: (value: boolean) => void;
}

export function ConnectionDetails({
  form,
  isSSL,
  setIsSSL,
}: ConnectionDetailsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <FormField
        control={form.control}
        name="ip"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-sm flex items-center gap-1">
              <Server className="w-3 h-3" />
              IP / Hostname
            </FormLabel>
            <FormControl>
              <Input placeholder="服务器地址" {...field} className="h-8" />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="port"
        render={({ field: { onChange, ...field } }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-sm flex items-center gap-1">
              <Server className="w-3 h-3" />
              端口
            </FormLabel>
            <div className="flex items-center gap-2">
              <FormControl>
                <Input
                  type="number"
                  className="w-24 h-8"
                  onChange={(e) => onChange(Number(e.target.value))}
                  {...field}
                  placeholder="端口"
                />
              </FormControl>
              <div className="flex items-center gap-1">
                <Checkbox
                  id="ssl"
                  checked={isSSL}
                  onCheckedChange={setIsSSL}
                  className="h-3 w-3"
                />
                <Label htmlFor="ssl" className="text-xs">
                  SSL
                </Label>
              </div>
            </div>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </div>
  );
}
