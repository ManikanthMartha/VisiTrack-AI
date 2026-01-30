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
import type { FilterState, TimeSeriesPoint } from '@/types';

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

  const [leaderboard, setLeaderboard] = useState<(LeaderboardBrand & { changePercent: number })[]>([]);
  const [brandDetails, setBrandDetails] = useState<BrandDetails | null>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesData[]>([]);
  const [platformScores, setPlatformScores] = useState<PlatformScore[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [sentiment, setSentiment] = useState<SentimentBreakdown | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [contexts, setContexts] = useState<BrandContext[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [brandLoading, setBrandLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User data (rank #1 brand)
  const [userTimeseries, setUserTimeseries] = useState<TimeSeriesData[]>([]);
  const [userPlatformScores, setUserPlatformScores] = useState<PlatformScore[]>([]);

  // Calculate day-over-day change for any brand's timeseries data
  const calculateDayChangeForBrand = (timeseriesData: TimeSeriesData[]): number => {
    if (timeseriesData.length < 2) return 0;
    
    // Sort by date descending
    const sorted = [...timeseriesData].sort((a, b) => b.date.localeCompare(a.date));
    
    // Get unique dates
    const uniqueDates = Array.from(new Set(sorted.map(d => d.date))).sort((a, b) => b.localeCompare(a));
    
    if (uniqueDates.length < 2) return 0;
    
    // Get today's and yesterday's scores (aggregate across platforms)
    const todayData = sorted.filter(d => d.date === uniqueDates[0]);
    const yesterdayData = sorted.filter(d => d.date === uniqueDates[1]);
    
    const todayScore = todayData.reduce((sum, d) => sum + d.daily_visibility_score, 0) / todayData.length;
    const yesterdayScore = yesterdayData.reduce((sum, d) => sum + d.daily_visibility_score, 0) / yesterdayData.length;
    
    if (yesterdayScore === 0) return 0;
    
    return ((todayScore - yesterdayScore) / yesterdayScore) * 100;
  };

  // Fetch leaderboard on mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getCategoryLeaderboard(categoryId);
        
        // Fetch timeseries for all brands to calculate daily changes
        const brandsWithChanges = await Promise.all(
          data.map(async (brand) => {
            try {
              const brandTimeseries = await apiClient.getBrandTimeseries(brand.id, 7); // Last 7 days
              const dayChange = calculateDayChangeForBrand(brandTimeseries);
              return {
                ...brand,
                changePercent: dayChange
              };
            } catch (err) {
              console.error(`Error fetching timeseries for ${brand.name}:`, err);
              return {
                ...brand,
                changePercent: 0
              };
            }
          })
        );
        
        setLeaderboard(brandsWithChanges);
        
        // Auto-select first brand
        if (brandsWithChanges.length > 0 && !selectedBrandId) {
          setSelectedBrandId(brandsWithChanges[0].id);
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
        setBrandLoading(true);
        setError(null);
        
        // Get the user brand (rank #1)
        const userBrandId = leaderboard[0]?.id;
        const isViewingUser = selectedBrandId === userBrandId;
        
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
        
        // If viewing a competitor, also fetch user's data for comparison
        if (!isViewingUser && userBrandId) {
          const [userTimeseriesData, userPlatforms] = await Promise.all([
            apiClient.getBrandTimeseries(userBrandId, 30),
            apiClient.getBrandPlatformScores(userBrandId)
          ]);
          setUserTimeseries(userTimeseriesData);
          setUserPlatformScores(userPlatforms);
        } else {
          // Clear user comparison data when viewing user's own brand
          setUserTimeseries([]);
          setUserPlatformScores([]);
        }
      } catch (err) {
        console.error('Error fetching brand data:', err);
        setError('Failed to load brand details.');
      } finally {
        setBrandLoading(false);
      }
    };

    fetchBrandData();
  }, [selectedBrandId, leaderboard]);

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

  // Show loading skeleton while brand data is being fetched
  if (brandLoading || !brandDetails) {
    return (
      <div className="min-h-screen bg-background">
        <div className="grain-overlay" />
        <div className="vignette" />
        <Sidebar />

        <main className="ml-[72px] transition-all duration-300">
          <Topbar breadcrumbs={[]} />

          <div className="p-4 lg:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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

              {/* Loading skeleton */}
              <div className="space-y-6">
                <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse" />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="h-64 bg-card border border-border rounded-lg animate-pulse" />
                    <div className="h-96 bg-card border border-border rounded-lg animate-pulse" />
                    <div className="h-48 bg-card border border-border rounded-lg animate-pulse" />
                  </div>

                  <div className="space-y-6">
                    <div className="h-96 bg-card border border-border rounded-lg animate-pulse" />
                    <div className="h-48 bg-card border border-border rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // Determine if viewing user or competitor
  const userBrand = leaderboard[0]; // Rank #1 is always the user
  const isViewingUser = selectedBrandId === userBrand?.id;

  // Prepare user comparison data (when viewing competitor)
  let userChartData: TimeSeriesPoint[] = [];
  let userPlatformScoresTransformed: { chatgpt: number; perplexity: number; claude: number; gemini: number } | undefined;

  if (!isViewingUser && userTimeseries.length > 0) {
    // Transform user timeseries for chart
    userChartData = userTimeseries.reduce((acc, item) => {
      const existing = acc.find(d => d.date === item.date);
      if (existing) {
        existing.score = Math.max(existing.score, item.daily_visibility_score);
        existing.mentions += item.mention_count;
      } else {
        acc.push({
          date: item.date,
          score: item.daily_visibility_score,
          mentions: item.mention_count,
          promptCoverage: 0
        });
      }
      return acc;
    }, [] as { date: string; score: number; mentions: number; promptCoverage: number }[])
      .sort((a, b) => a.date.localeCompare(b.date));

    // Transform user platform scores
    userPlatformScoresTransformed = userPlatformScores.reduce((acc, p) => {
      acc[p.ai_source as 'chatgpt' | 'gemini' | 'perplexity'] = p.platform_visibility_score;
      return acc;
    }, {
      chatgpt: 0,
      perplexity: 0,
      claude: 0,
      gemini: 0
    } as { chatgpt: number; perplexity: number; claude: number; gemini: number });
  }

  // Transform data for components
  const transformedLeaderboard = leaderboard.map((b, index) => ({
    id: b.id,
    name: b.name,
    logo: b.logo_url || b.name.charAt(0), // Use first letter if no logo
    visibilityScore: b.overall_visibility_score,
    changePercent: b.changePercent, // Already calculated from timeseries
    rank: index + 1
  }));

  // Calculate day-over-day change for selected brand
  const dayChange = calculateDayChangeForBrand(timeseries);

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
        promptCoverage: 0 // Will be calculated below
      });
    }
    return acc;
  }, [] as { date: string; score: number; mentions: number; promptCoverage: number }[])
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate prompt coverage for each day
  chartData.forEach(day => {
    const dayData = timeseries.filter(t => t.date === day.date);
    const totalResponses = dayData.reduce((sum, d) => sum + d.total_responses, 0);
    day.promptCoverage = totalResponses > 0 ? (day.mentions / totalResponses) * 100 : 0;
  });

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
    lastMentioned: new Date().toISOString() // Using current date as fallback
  }));

  // Generate brand description based on category and sentiment
  const generateBrandDescription = (): string => {
    const category = brandDetails.category_name;
    const sentimentText = sentiment && sentiment.positive_percentage > 60 
      ? 'highly regarded' 
      : sentiment && sentiment.positive_percentage > 40 
      ? 'well-known' 
      : 'recognized';
    
    return `A ${sentimentText} ${category.toLowerCase()} solution with ${brandDetails.total_mentions} mentions across ${brandDetails.total_responses} AI responses.`;
  };

  // Create complete brand object for BrandCard
  const brandForCard = {
    id: brandDetails.id,
    name: brandDetails.name,
    logo: brandDetails.logo_url || brandDetails.name.charAt(0),
    description: generateBrandDescription(),
    categoryId: brandDetails.category_id,
    visibilityScore: brandDetails.overall_visibility_score,
    citationShare: brandDetails.mention_rate,
    promptCoverage: (brandDetails.total_mentions / Math.max(brandDetails.total_responses, 1)) * 100,
    changePercent: dayChange, // Day-over-day change
    rank: transformedLeaderboard.findIndex(b => b.id === brandDetails.id) + 1,
    topSources: topSources,
    timeSeriesData: chartData,
    promptBreakdown: [], // Prompt breakdown not yet implemented
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

      <main className="ml-[72px] transition-all duration-300">
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
                    data={isViewingUser ? chartData : chartData}
                    competitorData={isViewingUser ? undefined : userChartData}
                    title={isViewingUser ? "Your Brand Visibility" : "Competitor vs You"}
                    subtitle={isViewingUser 
                      ? `Percentage of AI answers about ${brandDetails.category_name} that mention ${brandDetails.name}`
                      : `Comparing ${brandDetails.name} (Competitor) with ${userBrand?.name} (You)`
                    }
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
                    <PlatformBreakdown 
                      scores={transformedPlatformScores}
                      competitorScores={isViewingUser ? undefined : userPlatformScoresTransformed}
                    />
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
