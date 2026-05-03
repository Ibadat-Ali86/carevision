import React, { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ResultCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  actionButton?: ReactNode;
}

export default function ResultCard({ title, children, className, actionButton }: ResultCardProps) {
  return (
    <div className={cn("bg-white rounded-xl shadow-md overflow-hidden border border-slate-100", className)}>
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        {actionButton && <div>{actionButton}</div>}
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}
