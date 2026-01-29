"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { FilterBar } from '@/components/ui-custom/FilterBar';
import { VisibilityChart } from '@/components/charts/VisibilityChart';
import { Leaderboard } from '@/components/ui-custom/Leaderboard';
import { BrandCard } from '@/components/ui-custom/BrandCard';
import { PromptHeatmap } from '@/components/ui-custom/PromptHeatmap';
import { SourcesList } from '@/components/ui-custom/SourcesList';
import { CompetitorToggle } from '@/components/ui-custom/CompetitorToggle';
import { PlatformBreakdown } from '@/components/ui-custom/PlatformBreakdown';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { mockApi } from '@/data/seed';
import type { FilterState } from '@/types';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '7d',
    platforms: [],
    region: 'global',
  });

  const currentCategory = mockApi.getCategoryById(categoryId);
  const categoryBrands = currentCategory ? mockApi.getBrandsByCategory(categoryId) : [];
  const selectedBrand = selectedBrandId
    ? mockApi.getBrandById(selectedBrandId)
    : categoryBrands[0];

  if (!currentCategory || !selectedBrand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Category not found</p>
      </div>
    );
  }

  const breadcrumbs = [{ label: currentCategory.name, href: `/category/${currentCategory.id}` }];

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grain-overlay" />
      <div className="vignette" />
      <Sidebar />

      <main className="ml-[72px] lg:ml-[240px] min-h-screen transition-all duration-300">
        <Topbar breadcrumbs={breadcrumbs} />

        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="category"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>

              <FilterBar filters={filters} onFiltersChange={setFilters} />

              <CompetitorToggle
                brands={currentCategory.topBrands}
                selectedBrandId={selectedBrand.id}
                onBrandChange={setSelectedBrandId}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <BrandCard brand={selectedBrand} />

                  <VisibilityChart
                    data={selectedBrand.timeSeriesData}
                    title="Brand visibility"
                    subtitle={`Percentage of AI answers about ${currentCategory.name} that mention ${selectedBrand.name}`}
                  />

                  {selectedBrand.promptBreakdown.length > 0 && (
                    <PromptHeatmap prompts={selectedBrand.promptBreakdown} />
                  )}
                </div>

                <div className="space-y-6">
                  <Leaderboard
                    brands={currentCategory.topBrands}
                    selectedBrandId={selectedBrand.id}
                    onBrandClick={setSelectedBrandId}
                  />

                  {currentCategory.topBrands.find(b => b.id === selectedBrand.id)?.platformScores && (
                    <PlatformBreakdown 
                      scores={currentCategory.topBrands.find(b => b.id === selectedBrand.id)!.platformScores!} 
                    />
                  )}

                  {selectedBrand.topSources.length > 0 && (
                    <SourcesList sources={selectedBrand.topSources} />
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
