import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronDown, Check, Eye } from 'lucide-react';
import type { BrandSummary } from '@/types';

interface CompetitorToggleProps {
  brands: BrandSummary[];
  selectedBrandId: string;
  onBrandChange: (brandId: string) => void;
  className?: string;
}

export function CompetitorToggle({
  brands,
  selectedBrandId,
  onBrandChange,
  className,
}: CompetitorToggleProps) {
  const selectedBrand = brands.find((b) => b.id === selectedBrandId);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="w-4 h-4" />
        <span>Viewing as:</span>
      </div>
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'gap-2 h-9 px-3',
              'bg-accent/10 border-accent/30 hover:bg-accent/20',
              'text-sm font-medium transition-all duration-200'
            )}
          >
            <span className="w-5 h-5 rounded bg-accent/20 text-accent text-xs font-semibold flex items-center justify-center">
              {selectedBrand?.logo}
            </span>
            <span className="text-accent">{selectedBrand?.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-accent/70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Switch primary brand
          </div>
          {brands.map((brand) => (
            <DropdownMenuItem
              key={brand.id}
              onClick={() => {
                onBrandChange(brand.id);
                setIsOpen(false);
              }}
              className={cn(
                'gap-2 cursor-pointer',
                selectedBrandId === brand.id && 'bg-accent/10'
              )}
            >
              <span className="w-5 h-5 rounded bg-muted text-foreground text-xs font-semibold flex items-center justify-center">
                {brand.logo}
              </span>
              <span className="flex-1">{brand.name}</span>
              <span className="text-xs font-mono-numbers text-muted-foreground">
                {brand.visibilityScore.toFixed(1)}%
              </span>
              {selectedBrandId === brand.id && (
                <Check className="w-3.5 h-3.5 text-accent" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AnimatePresence mode="wait">
        {selectedBrandId !== brands[0]?.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Badge
              variant="outline"
              className="gap-1.5 text-xs border-chart-positive/30 text-chart-positive bg-chart-positive/10"
            >
              <Users className="w-3 h-3" />
              Competitor Mode
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
