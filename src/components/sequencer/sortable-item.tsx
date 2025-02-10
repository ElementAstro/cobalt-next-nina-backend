"use client";
import React from "react";
import { motion } from "framer-motion";

interface SortableItemProps {
  children: React.ReactNode;
  value: string;
}

export function SortableItem({ value, children }: SortableItemProps) {
  return (
    <motion.div
      layout
      className="p-2 bg-gray-800 rounded border border-gray-700"
      id={value}
    >
      {children}
    </motion.div>
  );
}
