export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  brandCount: number;
  topBrands: BrandSummary[];
  sparklineData: number[];
}

export interface BrandSummary {
  id: string;
  name: string;
  logo: string;
  visibilityScore: number;
  changePercent: number;
  rank: number;
  platformScores?: {
    chatgpt: number;
    perplexity: number;
    claude: number;
    gemini: number;
  };
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  categoryId: string;
  visibilityScore: number;
  citationShare: number;
  promptCoverage: number;
  changePercent: number;
  rank: number;
  topSources: Source[];
  timeSeriesData: TimeSeriesPoint[];
  promptBreakdown: PromptBreakdown[];
  rawResponses: RawResponse[];
}

export interface Source {
  id: string;
  url: string;
  title: string;
  snippet: string;
  favicon: string;
  mentionCount: number;
  lastMentioned: string;
}

export interface TimeSeriesPoint {
  date: string;
  score: number;
  mentions: number;
  promptCoverage: number;
}

export interface PromptBreakdown {
  prompt: string;
  category: string;
  models: {
    chatgpt: boolean;
    perplexity: boolean;
    claude: boolean;
    gemini: boolean;
  };
  mentionCount: number;
  sampleResponse?: string;
  topCitedPages: Source[];
}

export interface RawResponse {
  id: string;
  model: 'chatgpt' | 'perplexity' | 'claude' | 'gemini';
  prompt: string;
  response: string;
  timestamp: string;
  mentionsBrand: boolean;
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
  frequency: number;
}

export interface FilterState {
  dateRange: '24h' | '7d' | '30d' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  platforms: ('chatgpt' | 'perplexity' | 'claude' | 'gemini')[];
  region: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  organization?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}
