/**
 * API Client for AI Visibility Tracker Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============= API Response Types (match backend exactly) =============

export interface TopBrand {
  id: string;           // UUID as string from DB
  name: string;
  logo_url: string | null;
  visibility_score: number;  // DECIMAL(5,2) from DB
}

export interface Category {
  id: string;           // VARCHAR(100) from DB
  name: string;
  description: string | null;
  brand_count: number;  // COUNT from DB (bigint)
  prompt_count: number; // COUNT from DB (bigint)
  response_count: number; // COUNT from DB (bigint)
  top_brands: TopBrand[]; // JSONB array from DB
  created_at: string;   // TIMESTAMP as ISO string
}

export interface BrandDetails {
  id: string;           // UUID as string
  name: string;
  category_id: string;  // VARCHAR(100)
  category_name: string;
  logo_url: string | null;
  website: string | null;
  overall_visibility_score: number; // DECIMAL(5,2)
  total_mentions: number; // COUNT (bigint)
  total_responses: number; // COUNT (bigint)
  mention_rate: number; // DECIMAL(5,2)
}

export interface TimeSeriesData {
  brand_id: string;     // UUID as string
  brand_name: string;
  category_id: string;  // VARCHAR(100)
  date: string;         // DATE as string (YYYY-MM-DD)
  ai_source: string;    // 'chatgpt' | 'gemini' | 'perplexity'
  mention_count: number; // COUNT (bigint)
  total_responses: number; // COUNT (bigint)
  daily_visibility_score: number; // DECIMAL(5,2)
}

export interface PlatformScore {
  brand_id: string;     // UUID as string
  brand_name: string;
  category_id: string;  // VARCHAR(100)
  ai_source: string;    // 'chatgpt' | 'gemini' | 'perplexity'
  mention_count: number; // COUNT (bigint)
  total_responses: number; // COUNT (bigint)
  platform_visibility_score: number; // DECIMAL(5,2)
}

export interface LeaderboardBrand {
  id: string;           // UUID as string
  name: string;
  logo_url: string | null;
  overall_visibility_score: number; // DECIMAL(5,2)
  total_mentions: number; // COUNT (bigint)
}

// ============= LLM Extraction Types =============

export interface Citation {
  brand_id: string;     // UUID as string
  brand_name: string;
  url: string;
  title: string | null;
  domain: string | null;
  citation_count: number; // COUNT (bigint)
  avg_position: number; // AVG (numeric)
  response_count: number; // COUNT (bigint)
}

export interface BrandContext {
  id: string;           // UUID as string
  response_id: string;  // UUID as string
  brand_name: string;
  context: string;      // 2-3 sentence summary
  full_context: string | null; // Full paragraph
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];   // TEXT[] from DB
  created_at: string;   // TIMESTAMP as ISO string
  position: number;
}

export interface SentimentBreakdown {
  brand_id: string;     // UUID as string
  brand_name: string;
  category_id: string;  // VARCHAR(100)
  positive_count: number; // COUNT (bigint)
  neutral_count: number;  // COUNT (bigint)
  negative_count: number; // COUNT (bigint)
  total_mentions: number; // COUNT (bigint)
  positive_percentage: number; // DECIMAL(5,2)
  neutral_percentage: number;  // DECIMAL(5,2)
  negative_percentage: number; // DECIMAL(5,2)
}

export interface Keyword {
  keyword: string;
  count: number;
}

// ============= API Response Wrapper =============

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Ensure we're not caching during development
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const json: ApiResponse<T> = await response.json();
      
      if (!json.success) {
        throw new Error('API request failed');
      }
      
      return json.data;
    } catch (error) {
      console.error(`API fetch error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Category endpoints
  async getCategories(): Promise<Category[]> {
    return this.fetch<Category[]>('/categories');
  }

  async getCategory(categoryId: string): Promise<Category> {
    return this.fetch<Category>(`/categories/${categoryId}`);
  }

  async getCategoryLeaderboard(categoryId: string): Promise<LeaderboardBrand[]> {
    return this.fetch<LeaderboardBrand[]>(`/categories/${categoryId}/leaderboard`);
  }

  // Brand endpoints
  async getBrandDetails(brandId: string): Promise<BrandDetails> {
    return this.fetch<BrandDetails>(`/brands/${brandId}`);
  }

  async getBrandTimeseries(
    brandId: string,
    days: number = 30,
    aiSource?: string
  ): Promise<TimeSeriesData[]> {
    const params = new URLSearchParams({ days: days.toString() });
    if (aiSource) params.append('ai_source', aiSource);
    
    return this.fetch<TimeSeriesData[]>(`/brands/${brandId}/timeseries?${params}`);
  }

  async getBrandPlatformScores(brandId: string): Promise<PlatformScore[]> {
    return this.fetch<PlatformScore[]>(`/brands/${brandId}/platforms`);
  }

  // LLM Extraction endpoints
  async getBrandCitations(brandId: string, limit: number = 10): Promise<Citation[]> {
    return this.fetch<Citation[]>(`/brands/${brandId}/citations?limit=${limit}`);
  }

  async getBrandContexts(brandId: string, limit: number = 20): Promise<BrandContext[]> {
    return this.fetch<BrandContext[]>(`/brands/${brandId}/contexts?limit=${limit}`);
  }

  async getBrandSentiment(brandId: string): Promise<SentimentBreakdown> {
    return this.fetch<SentimentBreakdown>(`/brands/${brandId}/sentiment`);
  }

  async getBrandKeywords(brandId: string, limit: number = 20): Promise<Keyword[]> {
    return this.fetch<Keyword[]>(`/brands/${brandId}/keywords?limit=${limit}`);
  }
}

export const apiClient = new ApiClient();
