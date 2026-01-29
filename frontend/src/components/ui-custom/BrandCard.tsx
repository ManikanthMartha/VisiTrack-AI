import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Link2, MessageSquare, Target } from 'lucide-react';
import type { Brand } from '@/types';

interface BrandCardProps {
  brand: Brand;
  className?: string;
  isCompact?: boolean;
}

export function BrandCard({ brand, className, isCompact = false }: BrandCardProps) {
  const isPositive = brand.changePercent >= 0;

  if (isCompact) {
    return (
      <div className={cn('card-glow p-4', className)}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-xl font-bold text-accent">
            {brand.logo}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{brand.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{brand.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono-numbers text-foreground">
              {brand.visibilityScore.toFixed(1)}%
            </div>
            <div className={cn(
              'flex items-center justify-end gap-1 text-xs',
              isPositive ? 'text-chart-positive' : 'text-chart-negative'
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(brand.changePercent)}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('card-glow p-6', className)}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent flex-shrink-0">
          {brand.logo}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold text-foreground">{brand.name}</h2>
            <Badge variant="secondary" className="text-xs">
              Rank #{brand.rank}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{brand.description}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Visibility Score */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Visibility</span>
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-foreground">
            {brand.visibilityScore.toFixed(1)}%
          </div>
          <div className={cn(
            'flex items-center gap-1 text-xs mt-1',
            isPositive ? 'text-chart-positive' : 'text-chart-negative'
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(brand.changePercent)}% vs last week
          </div>
        </div>

        {/* Citation Share */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link2 className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Citation Share</span>
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-foreground">
            {brand.citationShare.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Of all brand mentions
          </div>
        </div>

        {/* Prompt Coverage */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Prompt Coverage</span>
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-foreground">
            {brand.promptCoverage.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Of tracked prompts
          </div>
        </div>
      </div>
    </motion.div>
  );
}
