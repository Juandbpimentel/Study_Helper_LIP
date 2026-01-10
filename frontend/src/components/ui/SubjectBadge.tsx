// src/components/ui/SubjectBadge.tsx
import React from "react";

interface SubjectBadgeProps {
  name: string;
  color: string;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  green: "bg-emerald-100 text-emerald-700 border-emerald-200",
  red: "bg-red-100 text-red-700 border-red-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
};

export function SubjectBadge({ name, color }: SubjectBadgeProps) {
  const style =
    colorMap[color] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-md border font-medium truncate w-full block text-center ${style}`}
    >
      {name}
    </span>
  );
}
