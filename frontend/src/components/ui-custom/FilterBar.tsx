import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Sparkles, Globe, SlidersHorizontal, ChevronDown } from 'lucide-react';
import type { FilterState } from '@/types';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

type DateRangeOption = {
  value: FilterState['dateRange'];
  label: string;
};

const dateRangeOptions: DateRangeOption[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
];

type PlatformOption = {
  value: 'chatgpt' | 'perplexity' | 'claude' | 'gemini';
  label: string;
  color: string;
};

const platformOptions: PlatformOption[] = [
  { value: 'chatgpt', label: 'ChatGPT', color: '#10a37f' },
  { value: 'perplexity', label: 'Perplexity', color: '#20808d' },
  { value: 'claude', label: 'Claude', color: '#d97757' },
  { value: 'gemini', label: 'Gemini', color: '#4285f4' },
];

const regions = [
  { value: 'global', label: 'Global' },
  { value: 'us', label: 'United States' },
  { value: 'eu', label: 'Europe' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
];

export function FilterBar({ filters, onFiltersChange, className }: FilterBarProps) {
  const handleDateRangeChange = (value: FilterState['dateRange']) => {
    onFiltersChange({ ...filters, dateRange: value });
  };

  const handlePlatformToggle = (platform: PlatformOption['value']) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter((p) => p !== platform)
      : [...filters.platforms, platform];
    onFiltersChange({ ...filters, platforms: newPlatforms });
  };

  const handleRegionChange = (region: string) => {
    onFiltersChange({ ...filters, region });
  };

  const activeDateLabel = dateRangeOptions.find((o) => o.value === filters.dateRange)?.label;
  const activeRegionLabel = regions.find((r) => r.value === filters.region)?.label;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Date Range Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 h-9 px-3',
              'bg-card border-border hover:bg-muted transition-colors',
              'text-sm font-medium'
            )}
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{activeDateLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          {dateRangeOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.dateRange === option.value}
              onCheckedChange={() => handleDateRangeChange(option.value)}
              className="cursor-pointer"
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Platform Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 h-9 px-3',
              'bg-card border-border hover:bg-muted transition-colors',
              'text-sm font-medium'
            )}
          >
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span>
              {filters.platforms.length === 0
                ? 'All models'
                : filters.platforms.length === 1
                ? platformOptions.find((p) => p.value === filters.platforms[0])?.label
                : `${filters.platforms.length} models`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          {platformOptions.map((platform) => (
            <DropdownMenuCheckboxItem
              key={platform.value}
              checked={filters.platforms.includes(platform.value)}
              onCheckedChange={() => handlePlatformToggle(platform.value)}
              className="cursor-pointer"
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: platform.color }}
              />
              {platform.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Region Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 h-9 px-3',
              'bg-card border-border hover:bg-muted transition-colors',
              'text-sm font-medium'
            )}
          >
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span>{activeRegionLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          {regions.map((region) => (
            <DropdownMenuCheckboxItem
              key={region.value}
              checked={filters.region === region.value}
              onCheckedChange={() => handleRegionChange(region.value)}
              className="cursor-pointer"
            >
              {region.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* More Filters */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'gap-2 h-9 px-3',
          'bg-card border-border hover:bg-muted transition-colors',
          'text-sm font-medium'
        )}
      >
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        <span>Filter</span>
      </Button>
    </div>
  );
}
