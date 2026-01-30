"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { FilterBar } from '@/components/ui-custom/FilterBar';
import { VisibilityChart } from '@/components/charts/VisibilityChart';
import { Leaderboard } from '@/components/ui-custom/Leaderboard';
import { BrandCard } from '@/components/ui-custom/BrandCard';
import { CompetitorToggle } from '@/components/ui-custom/CompetitorToggle';
import { PlatformBreakdown } from '@/components/ui-custom/PlatformBreakdown';
import { BrandCitations } from '@/components/ui-custom/BrandCitations';
import { BrandSentiment } from '@/components/ui-custom/BrandSentiment';
import { BrandKeywords } from '@/components/ui-custom/BrandKeywords';
import { BrandContexts } from '@/components/ui-custom/BrandContexts';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { apiClient, type BrandDetails, type LeaderboardBrand, type TimeSeriesData, type PlatformScore, type Citation, type SentimentBreakdown, type Keyword, type BrandContext } from '@/lib/api';
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

  const [leaderboard, setLeaderboard] = useState<LeaderboardBrand[]>([]);
  const [brandDetails, setBrandDetails] = useState<BrandDetails | null>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesData[]>([]);
  const [platformScores, setPlatformScores] = useState<PlatformScore[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [sentiment, setSentiment] = useState<SentimentBreakdown | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [contexts, setContexts] = useState<BrandContext[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard on mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getCategoryLeaderboard(categoryId);
        setLeaderboard(data);
        
        // Auto-select first brand
        if (data.length > 0 && !selectedBrandId) {
          setSelectedBrandId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load category data. Please check if the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [categoryId, selectedBrandId]);

  // Fetch brand details when selection changes
  useEffect(() => {
    if (!selectedBrandId) return;

    const fetchBrandData = async () => {
      try {
        setError(null);
        
        // Fetch all brand data in parallel
        const [details, timeseriesData, platforms, cit, sent, key, ctx] = await Promise.all([
          apiClient.getBrandDetails(selectedBrandId),
          apiClient.getBrandTimeseries(selectedBrandId, 30),
          apiClient.getBrandPlatformScores(selectedBrandId),
          apiClient.getBrandCitations(selectedBrandId, 10),
          apiClient.getBrandSentiment(selectedBrandId),
          apiClient.getBrandKeywords(selectedBrandId, 20),
          apiClient.getBrandContexts(selectedBrandId, 20)
        ]);

        setBrandDetails(details);
        setTimeseries(timeseriesData);
        setPlatformScores(platforms);
        setCitations(cit);
        setSentiment(sent);
        setKeywords(key);
        setContexts(ctx);
      } catch (err) {
        console.error('Error fetching brand data:', err);
        setError('Failed to load brand details.');
      }
    };

    fetchBrandData();
  }, [selectedBrandId]);

  if (loading) {
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

  if (!brandDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Brand not found</p>
      </div>
    );
  }

  // Transform data for components
  const transformedLeaderboard = leaderboard.map((b, index) => ({
    id: b.id,
    name: b.name,
    logo: b.logo_url || b.name.charAt(0), // Use first letter if no logo
    visibilityScore: b.overall_visibility_score,
    changePercent: 0, // TODO: Calculate from historical data
    rank: index + 1
  }));

  // Transform timeseries for chart (aggregate by date across platforms)
  const chartData = timeseries.reduce((acc, item) => {
    const existing = acc.find(d => d.date === item.date);
    if (existing) {
      existing.score = Math.max(existing.score, item.daily_visibility_score);
      existing.mentions += item.mention_count;
    } else {
      acc.push({
        date: item.date,
        score: item.daily_visibility_score,
        mentions: item.mention_count,
        promptCoverage: 0 // TODO: Calculate actual prompt coverage
      });
    }
    return acc;
  }, [] as { date: string; score: number; mentions: number; promptCoverage: number }[])
    .sort((a, b) => a.date.localeCompare(b.date));

  // Transform platform scores to object format expected by PlatformBreakdown
  const transformedPlatformScores = platformScores.reduce((acc, p) => {
    acc[p.ai_source as 'chatgpt' | 'gemini' | 'perplexity'] = p.platform_visibility_score;
    return acc;
  }, {
    chatgpt: 0,
    perplexity: 0,
    claude: 0, // Not in our data yet
    gemini: 0
  } as { chatgpt: number; perplexity: number; claude: number; gemini: number });

  // Transform citations to Source format for BrandCard
  const topSources = citations.slice(0, 3).map(c => ({
    id: c.brand_id,
    url: c.url,
    title: c.title || c.domain || 'Untitled',
    snippet: `Cited ${c.citation_count} times across ${c.response_count} responses`,
    favicon: `https://www.google.com/s2/favicons?domain=${c.domain || c.url}`,
    mentionCount: c.citation_count,
    lastMentioned: new Date().toISOString() // TODO: Add last_mentioned to DB
  }));

  // Create complete brand object for BrandCard
  const brandForCard = {
    id: brandDetails.id,
    name: brandDetails.name,
    logo: brandDetails.logo_url || brandDetails.name.charAt(0),
    description: `${brandDetails.category_name} solution`, // TODO: Add description field to DB
    categoryId: brandDetails.category_id,
    visibilityScore: brandDetails.overall_visibility_score,
    citationShare: brandDetails.mention_rate, // Using mention_rate as citation share
    promptCoverage: (brandDetails.total_mentions / Math.max(brandDetails.total_responses, 1)) * 100,
    changePercent: 0, // TODO: Calculate from historical data
    rank: transformedLeaderboard.findIndex(b => b.id === brandDetails.id) + 1,
    topSources: topSources,
    timeSeriesData: chartData,
    promptBreakdown: [], // TODO: Add prompt breakdown
    rawResponses: [] // Not needed for display
  };

  const breadcrumbs = [{ label: brandDetails.category_name, href: `/category/${categoryId}` }];

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

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FilterBar filters={filters} onFiltersChange={setFilters} />

              <CompetitorToggle
                brands={transformedLeaderboard}
                selectedBrandId={selectedBrandId || ''}
                onBrandChange={setSelectedBrandId}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <BrandCard brand={brandForCard} />

                  <VisibilityChart
                    data={chartData}
                    title="Brand visibility"
                    subtitle={`Percentage of AI answers about ${brandDetails.category_name} that mention ${brandDetails.name}`}
                  />

                  {/* LLM Extraction: Sentiment Analysis */}
                  <BrandSentiment sentiment={sentiment} />

                  {/* LLM Extraction: Brand Contexts */}
                  <BrandContexts 
                    contexts={contexts} 
                    selectedKeyword={selectedKeyword}
                  />
                </div>

                <div className="space-y-6">
                  <Leaderboard
                    brands={transformedLeaderboard}
                    selectedBrandId={selectedBrandId || ''}
                    onBrandClick={setSelectedBrandId}
                  />

                  {Object.keys(transformedPlatformScores).some(k => transformedPlatformScores[k as keyof typeof transformedPlatformScores] > 0) && (
                    <PlatformBreakdown scores={transformedPlatformScores} />
                  )}

                  {/* LLM Extraction: Top Citations */}
                  <BrandCitations citations={citations} />

                  {/* LLM Extraction: Keywords */}
                  <BrandKeywords 
                    keywords={keywords}
                    onKeywordClick={setSelectedKeyword}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
