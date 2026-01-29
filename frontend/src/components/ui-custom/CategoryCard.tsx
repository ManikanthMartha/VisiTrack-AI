import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkline } from './Sparkline';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Kanban, CreditCard, Mail, BarChart3, Cloud } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Users,
  Kanban,
  CreditCard,
  Mail,
  BarChart3,
  Cloud,
};

export function CategoryCard({ category, onClick, className }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || Users;
  const topBrand = category.topBrands[0];
  const isPositive = topBrand?.changePercent >= 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left card-glow p-5',
        'hover:shadow-elevated transition-shadow duration-300',
        'focus-ring',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground tracking-tight">
              {category.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {category.brandCount} brands tracked
            </p>
          </div>
        </div>
        
        {/* Sparkline */}
        <Sparkline
          data={category.sparklineData}
          width={70}
          height={28}
          showArea={false}
          strokeWidth={1.5}
        />
      </div>

      {/* Top Brand Pill */}
      {topBrand && (
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={cn(
              'gap-2 px-2.5 py-1.5 font-normal',
              'bg-muted hover:bg-muted/80 transition-colors'
            )}
          >
            <span className="w-5 h-5 rounded bg-accent/20 text-accent text-xs font-semibold flex items-center justify-center">
              {topBrand.logo}
            </span>
            <span className="text-sm text-foreground">{topBrand.name}</span>
            <span className="text-sm font-mono-numbers font-medium text-foreground">
              {topBrand.visibilityScore.toFixed(1)}%
            </span>
          </Badge>
          
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            isPositive ? 'text-chart-positive' : 'text-chart-negative'
          )}>
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{Math.abs(topBrand.changePercent)}%</span>
          </div>
        </div>
      )}

      {/* Mini Leaderboard Preview */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          {category.topBrands.slice(0, 5).map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold',
                index === 0
                  ? 'bg-accent/20 text-accent'
                  : 'bg-muted text-muted-foreground'
              )}
              title={`${brand.name}: ${brand.visibilityScore.toFixed(1)}%`}
            >
              {brand.logo}
            </motion.div>
          ))}
          {category.topBrands.length > 5 && (
            <span className="text-xs text-muted-foreground ml-1">
              +{category.topBrands.length - 5}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
