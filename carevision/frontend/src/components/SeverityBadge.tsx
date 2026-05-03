import React from 'react';
import { cn } from '@/utils/cn';

interface SeverityBadgeProps {
  level: number;
  className?: string;
}

export default function SeverityBadge({ level, className }: SeverityBadgeProps) {
  // Ensure level is between 1 and 5
  const normalizedLevel = Math.max(1, Math.min(5, Math.floor(level)));
  
  const severityConfig: Record<number, { label: string; colorClass: string }> = {
    1: { label: 'Normal / Minimal', colorClass: 'bg-severity-1 text-white' },
    2: { label: 'Mild', colorClass: 'bg-severity-2 text-white' },
    3: { label: 'Moderate', colorClass: 'bg-severity-3 text-white' },
    4: { label: 'Severe', colorClass: 'bg-severity-4 text-white' },
    5: { label: 'Critical', colorClass: 'bg-severity-5 text-white' },
  };

  const config = severityConfig[normalizedLevel];

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
      config.colorClass,
      className
    )}>
      Level {normalizedLevel}: {config.label}
    </span>
  );
}
