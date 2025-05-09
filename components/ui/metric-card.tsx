import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-slate-100 p-5", className)}>
      <div className="flex items-center">
        <div className="mr-3 rounded-md bg-blue-50 p-2.5">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold mt-0.5">{value}</h3>
        </div>
        
        {trend && (
          <div className="ml-auto">
            <div className={cn(
              "flex items-center rounded-full px-2 py-1 text-xs font-medium",
              trend.positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            )}>
              <span>{trend.positive ? "+" : "-"}{Math.abs(trend.value)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 