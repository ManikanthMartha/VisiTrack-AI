import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BrandSummary } from '@/types';

interface LeaderboardProps {
  brands: BrandSummary[];
  selectedBrandId?: string;
  onBrandClick?: (brandId: string) => void;
  className?: string;
  title?: string;
  showRank?: boolean;
}

export function Leaderboard({
  brands,
  selectedBrandId,
  onBrandClick,
  className,
  title = 'Brand Industry Ranking',
  showRank = true,
}: LeaderboardProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3.5 h-3.5 text-chart-positive" />;
    if (change < 0) return <TrendingDown className="w-3.5 h-3.5 text-chart-negative" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-chart-positive';
    if (change < 0) return 'text-chart-negative';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn('card-glow p-5', className)}>
      <h3 className="text-sm font-semibold text-foreground mb-4 tracking-tight">
        {title}
      </h3>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-1"
      >
        {brands.map((brand, index) => (
          <motion.button
            key={brand.id}
            variants={itemVariants}
            onClick={() => onBrandClick?.(brand.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'transition-all duration-200',
              'focus-ring',
              selectedBrandId === brand.id
                ? 'bg-accent/10 ring-1 ring-accent/30'
                : 'hover:bg-muted/50'
            )}
          >
            {/* Rank */}
            {showRank && (
              <span className={cn(
                'w-5 text-xs font-medium text-center',
                index < 3 ? 'text-accent' : 'text-muted-foreground'
              )}>
                {brand.rank}
              </span>
            )}
            
            {/* Logo */}
            <div className={cn(
              'w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0',
              selectedBrandId === brand.id
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {brand.logo}
            </div>
            
            {/* Name */}
            <span className={cn(
              'flex-1 text-sm text-left font-medium truncate',
              selectedBrandId === brand.id ? 'text-accent' : 'text-foreground'
            )}>
              {brand.name}
            </span>
            
            {/* Change */}
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              getTrendColor(brand.changePercent)
            )}>
              {getTrendIcon(brand.changePercent)}
              <span>{Math.abs(brand.changePercent)}%</span>
            </div>
            
            {/* Score */}
            <span className="text-sm font-semibold font-mono-numbers text-foreground w-12 text-right">
              {brand.visibilityScore.toFixed(1)}%
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
