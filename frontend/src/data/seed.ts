import type { Category, Brand, BrandSummary, Prompt } from '@/types';

// Generate sparkline data (7 days)
const generateSparkline = (baseValue: number, variance: number = 10): number[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const trend = Math.sin(i * 0.5) * variance * 0.5;
    const noise = (Math.random() - 0.5) * variance;
    return Math.max(0, Math.min(100, baseValue + trend + noise));
  });
};

// Generate time series data
const generateTimeSeries = (days: number, baseScore: number): { date: string; score: number; mentions: number; promptCoverage: number }[] => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const trend = Math.sin(i * 0.3) * 8;
    const noise = (Math.random() - 0.5) * 6;
    const score = Math.max(0, Math.min(100, baseScore + trend + noise));
    data.push({
      date: date.toISOString().split('T')[0],
      score: Math.round(score * 10) / 10,
      mentions: Math.floor(score * 1.5 + Math.random() * 20),
      promptCoverage: Math.round((score * 0.8 + Math.random() * 15) * 10) / 10,
    });
  }
  return data;
};

export const categories: Category[] = [
  {
    id: 'crm-software',
    name: 'CRM Software',
    description: 'Customer relationship management platforms and tools',
    icon: 'Users',
    brandCount: 24,
    topBrands: [
      { id: 'salesforce', name: 'Salesforce', logo: 'S', visibilityScore: 94.2, changePercent: 2.3, rank: 1, platformScores: { chatgpt: 96.5, perplexity: 93.2, claude: 94.8, gemini: 92.1 } },
      { id: 'hubspot', name: 'HubSpot', logo: 'H', visibilityScore: 89.7, changePercent: 1.5, rank: 2, platformScores: { chatgpt: 91.2, perplexity: 88.5, claude: 90.3, gemini: 87.9 } },
      { id: 'zoho', name: 'Zoho CRM', logo: 'Z', visibilityScore: 76.4, changePercent: -0.8, rank: 3, platformScores: { chatgpt: 78.2, perplexity: 75.1, claude: 77.5, gemini: 74.3 } },
      { id: 'pipedrive', name: 'Pipedrive', logo: 'P', visibilityScore: 68.9, changePercent: 3.2, rank: 4, platformScores: { chatgpt: 71.5, perplexity: 67.8, claude: 69.4, gemini: 66.2 } },
      { id: 'freshsales', name: 'Freshsales', logo: 'F', visibilityScore: 54.3, changePercent: -1.2, rank: 5, platformScores: { chatgpt: 56.8, perplexity: 53.2, claude: 55.1, gemini: 52.4 } },
    ],
    sparklineData: generateSparkline(75),
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Tools for team collaboration and project tracking',
    icon: 'Kanban',
    brandCount: 31,
    topBrands: [
      { id: 'asana', name: 'Asana', logo: 'A', visibilityScore: 91.5, changePercent: 4.1, rank: 1, platformScores: { chatgpt: 93.2, perplexity: 90.5, claude: 92.1, gemini: 89.8 } },
      { id: 'monday', name: 'Monday.com', logo: 'M', visibilityScore: 87.3, changePercent: 2.8, rank: 2, platformScores: { chatgpt: 89.1, perplexity: 86.4, claude: 88.2, gemini: 85.1 } },
      { id: 'notion', name: 'Notion', logo: 'N', visibilityScore: 85.6, changePercent: 5.5, rank: 3, platformScores: { chatgpt: 87.5, perplexity: 84.2, claude: 86.3, gemini: 83.9 } },
      { id: 'clickup', name: 'ClickUp', logo: 'C', visibilityScore: 72.1, changePercent: -2.1, rank: 4, platformScores: { chatgpt: 74.8, perplexity: 71.2, claude: 73.5, gemini: 69.8 } },
      { id: 'trello', name: 'Trello', logo: 'T', visibilityScore: 68.4, changePercent: -3.5, rank: 5, platformScores: { chatgpt: 70.5, perplexity: 67.1, claude: 69.2, gemini: 66.4 } },
    ],
    sparklineData: generateSparkline(80),
  },
  {
    id: 'business-credit-cards',
    name: 'Business Credit Cards',
    description: 'Corporate and small business credit card offerings',
    icon: 'CreditCard',
    brandCount: 18,
    topBrands: [
      { id: 'chase', name: 'Chase', logo: 'C', visibilityScore: 92.0, changePercent: 5.0, rank: 1, platformScores: { chatgpt: 94.5, perplexity: 91.2, claude: 93.1, gemini: 89.8 } },
      { id: 'rho', name: 'Rho', logo: 'R', visibilityScore: 89.8, changePercent: 1.0, rank: 2, platformScores: { chatgpt: 91.8, perplexity: 88.5, claude: 90.4, gemini: 87.2 } },
      { id: 'amex', name: 'American Express', logo: 'A', visibilityScore: 85.2, changePercent: -1.0, rank: 3, platformScores: { chatgpt: 87.5, perplexity: 84.1, claude: 86.3, gemini: 82.8 } },
      { id: 'capital-on-tap', name: 'Capital on Tap', logo: 'C', visibilityScore: 78.0, changePercent: 5.0, rank: 4, platformScores: { chatgpt: 80.5, perplexity: 76.8, claude: 79.2, gemini: 75.4 } },
      { id: 'us-bank', name: 'US Bank', logo: 'U', visibilityScore: 76.9, changePercent: -2.0, rank: 5, platformScores: { chatgpt: 79.2, perplexity: 75.5, claude: 78.1, gemini: 74.8 } },
    ],
    sparklineData: generateSparkline(85),
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing',
    description: 'Email campaign and automation platforms',
    icon: 'Mail',
    brandCount: 22,
    topBrands: [
      { id: 'mailchimp', name: 'Mailchimp', logo: 'M', visibilityScore: 93.5, changePercent: 1.8, rank: 1, platformScores: { chatgpt: 95.2, perplexity: 92.4, claude: 94.1, gemini: 91.8 } },
      { id: 'klaviyo', name: 'Klaviyo', logo: 'K', visibilityScore: 88.2, changePercent: 6.2, rank: 2, platformScores: { chatgpt: 90.5, perplexity: 87.1, claude: 89.3, gemini: 86.2 } },
      { id: 'sendgrid', name: 'SendGrid', logo: 'S', visibilityScore: 74.6, changePercent: -1.5, rank: 3, platformScores: { chatgpt: 76.8, perplexity: 73.2, claude: 75.5, gemini: 72.4 } },
      { id: 'convertkit', name: 'ConvertKit', logo: 'C', visibilityScore: 65.3, changePercent: 2.9, rank: 4, platformScores: { chatgpt: 67.5, perplexity: 64.1, claude: 66.2, gemini: 63.1 } },
      { id: 'activecampaign', name: 'ActiveCampaign', logo: 'A', visibilityScore: 61.8, changePercent: -0.7, rank: 5, platformScores: { chatgpt: 64.2, perplexity: 60.8, claude: 62.9, gemini: 59.5 } },
    ],
    sparklineData: generateSparkline(78),
  },
  {
    id: 'analytics-platforms',
    name: 'Analytics Platforms',
    description: 'Web and product analytics solutions',
    icon: 'BarChart3',
    brandCount: 19,
    topBrands: [
      { id: 'google-analytics', name: 'Google Analytics', logo: 'G', visibilityScore: 96.8, changePercent: 0.5, rank: 1, platformScores: { chatgpt: 98.2, perplexity: 95.8, claude: 97.1, gemini: 95.2 } },
      { id: 'mixpanel', name: 'Mixpanel', logo: 'M', visibilityScore: 82.4, changePercent: 3.8, rank: 2, platformScores: { chatgpt: 84.5, perplexity: 81.2, claude: 83.1, gemini: 80.5 } },
      { id: 'amplitude', name: 'Amplitude', logo: 'A', visibilityScore: 79.1, changePercent: 4.5, rank: 3, platformScores: { chatgpt: 81.2, perplexity: 77.8, claude: 79.5, gemini: 76.8 } },
      { id: 'heap', name: 'Heap', logo: 'H', visibilityScore: 58.7, changePercent: -2.3, rank: 4, platformScores: { chatgpt: 60.5, perplexity: 57.2, claude: 59.1, gemini: 56.8 } },
      { id: 'plausible', name: 'Plausible', logo: 'P', visibilityScore: 45.2, changePercent: 8.1, rank: 5, platformScores: { chatgpt: 47.5, perplexity: 44.1, claude: 46.2, gemini: 43.5 } },
    ],
    sparklineData: generateSparkline(72),
  },
  {
    id: 'cloud-storage',
    name: 'Cloud Storage',
    description: 'File storage and synchronization services',
    icon: 'Cloud',
    brandCount: 15,
    topBrands: [
      { id: 'google-drive', name: 'Google Drive', logo: 'G', visibilityScore: 95.3, changePercent: 1.2, rank: 1, platformScores: { chatgpt: 96.8, perplexity: 94.2, claude: 95.5, gemini: 93.8 } },
      { id: 'dropbox', name: 'Dropbox', logo: 'D', visibilityScore: 88.9, changePercent: -0.5, rank: 2, platformScores: { chatgpt: 90.5, perplexity: 87.8, claude: 89.2, gemini: 86.5 } },
      { id: 'onedrive', name: 'OneDrive', logo: 'O', visibilityScore: 81.5, changePercent: 2.1, rank: 3, platformScores: { chatgpt: 83.2, perplexity: 80.5, claude: 82.1, gemini: 79.8 } },
      { id: 'box', name: 'Box', logo: 'B', visibilityScore: 62.3, changePercent: 1.8, rank: 4, platformScores: { chatgpt: 64.5, perplexity: 61.2, claude: 63.1, gemini: 60.5 } },
      { id: 'pcloud', name: 'pCloud', logo: 'P', visibilityScore: 38.7, changePercent: 4.2, rank: 5, platformScores: { chatgpt: 41.2, perplexity: 37.8, claude: 39.5, gemini: 36.8 } },
    ],
    sparklineData: generateSparkline(73),
  },
];

export const brands: Brand[] = [
  // Business Credit Cards (from reference image)
  {
    id: 'chase',
    name: 'Chase',
    logo: 'C',
    description: 'Chase offers comprehensive business credit card solutions with rewards, travel benefits, and expense management tools for businesses of all sizes.',
    categoryId: 'business-credit-cards',
    visibilityScore: 92.0,
    citationShare: 28.5,
    promptCoverage: 87.3,
    changePercent: 5.0,
    rank: 1,
    topSources: [
      { id: 's1', url: 'https://www.chase.com/business-credit-cards', title: 'Chase Business Credit Cards', snippet: 'Compare Chase business credit cards and find the right card for your business needs.', favicon: 'C', mentionCount: 342, lastMentioned: '2024-01-28' },
      { id: 's2', url: 'https://www.nerdwallet.com/article/small-business/chase-ink-business-preferred', title: 'Chase Ink Business Preferred Review', snippet: 'The Chase Ink Business Preferred offers 3x points on travel and select business categories.', favicon: 'N', mentionCount: 189, lastMentioned: '2024-01-27' },
      { id: 's3', url: 'https://www.creditkarma.com/credit-cards/business/chase', title: 'Chase Business Cards - Credit Karma', snippet: 'Explore Chase business credit card options with detailed reviews and comparisons.', favicon: 'K', mentionCount: 156, lastMentioned: '2024-01-26' },
    ],
    timeSeriesData: generateTimeSeries(30, 92),
    promptBreakdown: [
      { prompt: 'Best business credit cards for startups', category: 'Recommendations', models: { chatgpt: true, perplexity: true, claude: true, gemini: true }, mentionCount: 89, sampleResponse: 'Chase Ink Business Preferred is frequently recommended for startups...', topCitedPages: [] },
      { prompt: 'Business credit card with travel rewards', category: 'Features', models: { chatgpt: true, perplexity: true, claude: false, gemini: true }, mentionCount: 67, sampleResponse: 'Chase offers excellent travel rewards through their Ultimate Rewards program...', topCitedPages: [] },
      { prompt: 'Best business credit cards 2024', category: 'Recommendations', models: { chatgpt: true, perplexity: true, claude: true, gemini: false }, mentionCount: 54, sampleResponse: 'Chase Ink Business Cash and Preferred are top recommendations...', topCitedPages: [] },
    ],
    rawResponses: [],
  },
  {
    id: 'rho',
    name: 'Rho',
    logo: 'R',
    description: 'Rho provides modern financial solutions including business credit cards, banking, and expense management in one integrated platform.',
    categoryId: 'business-credit-cards',
    visibilityScore: 89.8,
    citationShare: 24.2,
    promptCoverage: 84.1,
    changePercent: 1.0,
    rank: 2,
    topSources: [
      { id: 's4', url: 'https://www.rho.co/business-credit-card', title: 'Rho Business Credit Card', snippet: 'The Rho Card offers unlimited 1.5% cash back with no annual fee and seamless expense management.', favicon: 'R', mentionCount: 298, lastMentioned: '2024-01-28' },
      { id: 's5', url: 'https://techcrunch.com/2023/11/rho-funding', title: 'Rho raises Series B for business banking', snippet: 'Rho continues to disrupt the business banking space with integrated credit solutions.', favicon: 'T', mentionCount: 134, lastMentioned: '2024-01-25' },
      { id: 's6', url: 'https://www.forbes.com/advisor/business/credit-cards/rho-review', title: 'Rho Business Credit Card Review 2024', snippet: 'Forbes Advisor reviews the Rho Card as a top choice for modern businesses.', favicon: 'F', mentionCount: 112, lastMentioned: '2024-01-24' },
    ],
    timeSeriesData: generateTimeSeries(30, 89.8),
    promptBreakdown: [
      { prompt: 'Best business credit cards for startups', category: 'Recommendations', models: { chatgpt: true, perplexity: true, claude: true, gemini: true }, mentionCount: 76, sampleResponse: 'Rho is increasingly mentioned as a top choice for startups...', topCitedPages: [] },
      { prompt: 'Modern business banking with credit card', category: 'Features', models: { chatgpt: true, perplexity: true, claude: true, gemini: false }, mentionCount: 58, sampleResponse: 'Rho combines banking and credit in one platform...', topCitedPages: [] },
    ],
    rawResponses: [],
  },
  {
    id: 'amex',
    name: 'American Express',
    logo: 'A',
    description: 'American Express Business Cards offer premium rewards, travel benefits, and comprehensive expense management tools.',
    categoryId: 'business-credit-cards',
    visibilityScore: 85.2,
    citationShare: 22.1,
    promptCoverage: 79.8,
    changePercent: -1.0,
    rank: 3,
    topSources: [
      { id: 's7', url: 'https://www.americanexpress.com/business-credit-cards', title: 'American Express Business Cards', snippet: 'Explore Amex business cards with rewards, cashback, and travel benefits.', favicon: 'A', mentionCount: 267, lastMentioned: '2024-01-27' },
      { id: 's8', url: 'https://www.businessinsider.com/personal-finance/best-american-express-business-credit-cards', title: 'Best Amex Business Cards', snippet: 'Business Insider ranks the top American Express business credit cards.', favicon: 'B', mentionCount: 145, lastMentioned: '2024-01-26' },
    ],
    timeSeriesData: generateTimeSeries(30, 85.2),
    promptBreakdown: [
      { prompt: 'Best business credit cards for travel', category: 'Features', models: { chatgpt: true, perplexity: true, claude: true, gemini: true }, mentionCount: 82, sampleResponse: 'American Express Business Platinum is a top travel card...', topCitedPages: [] },
    ],
    rawResponses: [],
  },
  {
    id: 'capital-on-tap',
    name: 'Capital on Tap',
    logo: 'C',
    description: 'Capital on Tap provides simple business credit cards designed for small businesses with straightforward rewards.',
    categoryId: 'business-credit-cards',
    visibilityScore: 78.0,
    citationShare: 15.8,
    promptCoverage: 71.2,
    changePercent: 5.0,
    rank: 4,
    topSources: [
      { id: 's9', url: 'https://www.capitalontap.com/business-credit-card', title: 'Capital on Tap Business Card', snippet: '1% cashback on all purchases with no annual fee for small businesses.', favicon: 'C', mentionCount: 198, lastMentioned: '2024-01-28' },
    ],
    timeSeriesData: generateTimeSeries(30, 78),
    promptBreakdown: [],
    rawResponses: [],
  },
  {
    id: 'us-bank',
    name: 'US Bank',
    logo: 'U',
    description: 'US Bank offers a range of business credit cards with competitive rates and rewards programs.',
    categoryId: 'business-credit-cards',
    visibilityScore: 76.9,
    citationShare: 14.3,
    promptCoverage: 69.5,
    changePercent: -2.0,
    rank: 5,
    topSources: [
      { id: 's10', url: 'https://www.usbank.com/business/credit-cards.html', title: 'US Bank Business Credit Cards', snippet: 'Find the right business credit card with US Bank.', favicon: 'U', mentionCount: 176, lastMentioned: '2024-01-27' },
    ],
    timeSeriesData: generateTimeSeries(30, 76.9),
    promptBreakdown: [],
    rawResponses: [],
  },
  // Add more brands for other categories
  {
    id: 'salesforce',
    name: 'Salesforce',
    logo: 'S',
    description: 'Salesforce is the world\'s leading CRM platform, helping businesses connect with customers through cloud-based solutions.',
    categoryId: 'crm-software',
    visibilityScore: 94.2,
    citationShare: 32.1,
    promptCoverage: 91.5,
    changePercent: 2.3,
    rank: 1,
    topSources: [
      { id: 's11', url: 'https://www.salesforce.com/products/sales-cloud', title: 'Salesforce Sales Cloud', snippet: 'The world\'s #1 CRM platform for sales teams.', favicon: 'S', mentionCount: 412, lastMentioned: '2024-01-28' },
    ],
    timeSeriesData: generateTimeSeries(30, 94.2),
    promptBreakdown: [],
    rawResponses: [],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    logo: 'H',
    description: 'HubSpot offers a full platform of marketing, sales, customer service, and CRM software for growing businesses.',
    categoryId: 'crm-software',
    visibilityScore: 89.7,
    citationShare: 28.4,
    promptCoverage: 86.2,
    changePercent: 1.5,
    rank: 2,
    topSources: [
      { id: 's12', url: 'https://www.hubspot.com/products/crm', title: 'HubSpot CRM', snippet: 'Free CRM software with everything you need to organize and nurture leads.', favicon: 'H', mentionCount: 356, lastMentioned: '2024-01-28' },
    ],
    timeSeriesData: generateTimeSeries(30, 89.7),
    promptBreakdown: [],
    rawResponses: [],
  },
  {
    id: 'asana',
    name: 'Asana',
    logo: 'A',
    description: 'Asana helps teams organize work, from daily tasks to strategic initiatives, in one collaborative platform.',
    categoryId: 'project-management',
    visibilityScore: 91.5,
    citationShare: 29.8,
    promptCoverage: 88.7,
    changePercent: 4.1,
    rank: 1,
    topSources: [
      { id: 's13', url: 'https://asana.com', title: 'Asana - Work Management Platform', snippet: 'Manage your team\'s work and projects in one place.', favicon: 'A', mentionCount: 387, lastMentioned: '2024-01-28' },
    ],
    timeSeriesData: generateTimeSeries(30, 91.5),
    promptBreakdown: [],
    rawResponses: [],
  },
  {
    id: 'monday',
    name: 'Monday.com',
    logo: 'M',
    description: 'Monday.com is a work operating system that powers teams to run processes and workflows with confidence.',
    categoryId: 'project-management',
    visibilityScore: 87.3,
    citationShare: 26.5,
    promptCoverage: 84.1,
    changePercent: 2.8,
    rank: 2,
    topSources: [
      { id: 's14', url: 'https://monday.com', title: 'Monday.com Work OS', snippet: 'A platform for teams to manage work and collaborate.', favicon: 'M', mentionCount: 334, lastMentioned: '2024-01-27' },
    ],
    timeSeriesData: generateTimeSeries(30, 87.3),
    promptBreakdown: [],
    rawResponses: [],
  },
];

export const prompts: Prompt[] = [
  { id: 'p1', text: 'Best business credit cards for startups', category: 'Recommendations', frequency: 892 },
  { id: 'p2', text: 'Business credit card with travel rewards', category: 'Features', frequency: 756 },
  { id: 'p3', text: 'Best business credit cards 2024', category: 'Recommendations', frequency: 687 },
  { id: 'p4', text: 'Business credit card no annual fee', category: 'Features', frequency: 543 },
  { id: 'p5', text: 'Best CRM software for small business', category: 'Recommendations', frequency: 923 },
  { id: 'p6', text: 'CRM vs spreadsheet for sales tracking', category: 'Comparisons', frequency: 445 },
  { id: 'p7', text: 'Best project management software', category: 'Recommendations', frequency: 1056 },
  { id: 'p8', text: 'Asana vs Monday vs ClickUp', category: 'Comparisons', frequency: 678 },
  { id: 'p9', text: 'Email marketing platform for ecommerce', category: 'Recommendations', frequency: 567 },
  { id: 'p10', text: 'Best analytics tool for SaaS', category: 'Recommendations', frequency: 434 },
];

// Mock API functions
export const mockApi = {
  getCategories: (): Category[] => categories,
  
  getCategoryById: (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  },
  
  getBrandsByCategory: (categoryId: string): Brand[] => {
    return brands.filter(b => b.categoryId === categoryId);
  },
  
  getBrandById: (id: string): Brand | undefined => {
    return brands.find(b => b.id === id);
  },
  
  getTopBrands: (limit: number = 5): BrandSummary[] => {
    return brands
      .map(b => ({ id: b.id, name: b.name, logo: b.logo, visibilityScore: b.visibilityScore, changePercent: b.changePercent, rank: b.rank }))
      .sort((a, b) => b.visibilityScore - a.visibilityScore)
      .slice(0, limit);
  },
  
  searchCategories: (query: string): Category[] => {
    const lowerQuery = query.toLowerCase();
    return categories.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      c.description.toLowerCase().includes(lowerQuery)
    );
  },
  
  getPrompts: (): Prompt[] => prompts,
};

export default mockApi;
