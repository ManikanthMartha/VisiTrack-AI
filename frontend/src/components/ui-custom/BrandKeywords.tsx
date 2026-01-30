'use client';

import { Keyword } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash } from 'lucide-react';

interface BrandKeywordsProps {
  keywords: Keyword[];
  isLoading?: boolean;
  onKeywordClick?: (keyword: string) => void;
}

export function BrandKeywords({ keywords, isLoading, onKeywordClick }: BrandKeywordsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Keywords</CardTitle>
          <CardDescription>Loading keywords...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse h-7 w-20 bg-muted rounded-full"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!keywords || keywords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Keywords</CardTitle>
          <CardDescription>No keywords found yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keywords will appear here once brand mentions are analyzed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate max count for sizing
  const maxCount = Math.max(...keywords.map(k => k.count));
  
  // Get size class based on count
  const getSizeClass = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-lg';
    if (ratio > 0.4) return 'text-base';
    return 'text-sm';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Keywords</CardTitle>
        <CardDescription>
          Most common themes and topics associated with this brand
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tag cloud */}
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge
                key={keyword.keyword}
                variant="secondary"
                className={`${getSizeClass(keyword.count)} cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors`}
                onClick={() => onKeywordClick?.(keyword.keyword)}
              >
                <Hash className="w-3 h-3 mr-1" />
                {keyword.keyword}
                <span className="ml-1.5 text-xs opacity-70">
                  {keyword.count}
                </span>
              </Badge>
            ))}
          </div>

          {/* Top 5 list */}
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Top 5 Keywords
            </h4>
            {keywords.slice(0, 5).map((keyword, index) => (
              <div
                key={keyword.keyword}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <span className="font-medium">{keyword.keyword}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${(keyword.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground min-w-[2rem] text-right">
                    {keyword.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
