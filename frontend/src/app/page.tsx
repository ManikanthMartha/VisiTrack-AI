"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CategoryCard } from '@/components/ui-custom/CategoryCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Grid3X3, List, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { apiClient, type Category } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'brands' | 'score'>('score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from API
  useEffect(() => {
    // Only fetch if we have a session and we're on the client
    if (!session || typeof window === 'undefined') return;
    
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching categories from:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
        const data = await apiClient.getCategories();
        console.log('Categories fetched:', data.length);
        
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load categories: ${errorMessage}. Please check if the backend is running on http://localhost:8000`);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [session]);

  // Show loading state while session is being fetched
  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Middleware handles redirect, but show loading if somehow no session
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Transform API data to match CategoryCard component expectations
  const transformedCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description || '',
    icon: 'Users', // Default icon, could be mapped based on category
    brandCount: cat.brand_count,
    sparklineData: [65, 68, 70, 72, 75, 78, 80], // Dummy sparkline data for now
    topBrands: (cat.top_brands || []).map((b, index) => ({
      id: b.id,
      name: b.name,
      logo: b.logo_url || b.name.charAt(0), // Use first letter if no logo
      visibilityScore: b.visibility_score,
      changePercent: 0, // TODO: Calculate from historical data
      rank: index + 1
    }))
  }));

  const filteredCategories = transformedCategories
    .filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'brands') return b.brandCount - a.brandCount;
      return (b.topBrands[0]?.visibilityScore || 0) - (a.topBrands[0]?.visibilityScore || 0);
    });

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/category/${categoryId}`);
  };

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

      <main className="ml-[72px] transition-all duration-300">
        <Topbar breadcrumbs={[]} />

        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <span className="text-sm text-accent font-medium">AI Visibility Tracker</span>
                  </div>
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                    Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track AI visibility across {categories.length} categories
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card border-border"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="w-[140px] bg-card border-border">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Top Score</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="brands">Brand Count</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center bg-card rounded-md border border-border p-0.5">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className={cn(
                'grid gap-4',
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              )}>
                {filteredCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <CategoryCard
                      category={category}
                      onClick={() => handleCategoryClick(category.id)}
                    />
                  </motion.div>
                ))}
              </div>

              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No categories found</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
