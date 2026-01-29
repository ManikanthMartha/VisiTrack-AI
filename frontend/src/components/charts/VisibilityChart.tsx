import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TimeSeriesPoint } from '@/types';

interface VisibilityChartProps {
  data: TimeSeriesPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
  showGrid?: boolean;
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: TimeSeriesPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  
  return (
    <div className="bg-popover border border-border rounded-lg shadow-elevated p-3 min-w-[180px]">
      <p className="text-xs text-muted-foreground mb-2">
        {new Date(label || '').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Visibility Score</span>
          <span className="text-sm font-semibold font-mono-numbers text-accent">
            {data.score.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Mentions</span>
          <span className="text-sm font-medium font-mono-numbers">
            {data.mentions}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Prompt Coverage</span>
          <span className="text-sm font-medium font-mono-numbers">
            {data.promptCoverage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function VisibilityChart({
  data,
  title = 'Visibility Score',
  subtitle,
  className,
  showGrid = true,
  height = 320,
}: VisibilityChartProps) {
  const currentScore = data[data.length - 1]?.score || 0;
  const previousScore = data[data.length - 8]?.score || 0;
  const changePercent = ((currentScore - previousScore) / previousScore) * 100;
  const isPositive = changePercent >= 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={cn('card-glow p-5', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Current Score */}
          <div className="text-right">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold font-mono-numbers text-foreground"
            >
              {currentScore.toFixed(1)}%
            </motion.div>
            
            {/* Change Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'flex items-center justify-end gap-1 text-xs font-medium mt-1',
                isPositive ? 'text-chart-positive' : 'text-chart-negative'
              )}
            >
              <span className={cn(
                'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full',
                isPositive ? 'bg-chart-positive/10' : 'bg-chart-negative/10'
              )}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(changePercent).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs last week</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="visibilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(82 78% 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(82 78% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(220 10% 15%)"
                vertical={false}
              />
            )}
            
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: 'hsl(220 8% 55%)' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(220 10% 15%)' }}
              minTickGap={30}
            />
            
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(220 8% 55%)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine
              y={75}
              stroke="hsl(220 10% 20%)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(82 78% 55%)"
              strokeWidth={2}
              fill="url(#visibilityGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
