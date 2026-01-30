'use client';

import { useState } from 'react';
import { BrandContext } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smile, Meh, Frown, ChevronDown, ChevronUp } from 'lucide-react';

interface BrandContextsProps {
  contexts: BrandContext[];
  isLoading?: boolean;
  selectedKeyword?: string;
}

export function BrandContexts({ contexts, isLoading, selectedKeyword }: BrandContextsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand Mentions</CardTitle>
          <CardDescription>Loading contexts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contexts || contexts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand Mentions</CardTitle>
          <CardDescription>No contexts found yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Example mentions will appear here once brand contexts are analyzed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="w-4 h-4" />;
      case 'negative':
        return <Frown className="w-4 h-4" />;
      default:
        return <Meh className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Filter contexts
  let filteredContexts = contexts;
  if (filterSentiment) {
    filteredContexts = contexts.filter(c => c.sentiment === filterSentiment);
  }
  if (selectedKeyword) {
    filteredContexts = filteredContexts.filter(c => 
      c.keywords.some(k => k.toLowerCase().includes(selectedKeyword.toLowerCase()))
    );
  }

  const sentimentCounts = {
    positive: contexts.filter(c => c.sentiment === 'positive').length,
    neutral: contexts.filter(c => c.sentiment === 'neutral').length,
    negative: contexts.filter(c => c.sentiment === 'negative').length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Mentions</CardTitle>
        <CardDescription>
          Example contexts showing how this brand is mentioned
          {selectedKeyword && ` (filtered by "${selectedKeyword}")`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Sentiment filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Button
              variant={filterSentiment === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSentiment(null)}
            >
              All ({contexts.length})
            </Button>
            <Button
              variant={filterSentiment === 'positive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSentiment('positive')}
              className="gap-1"
            >
              <Smile className="w-3 h-3" />
              Positive ({sentimentCounts.positive})
            </Button>
            <Button
              variant={filterSentiment === 'neutral' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSentiment('neutral')}
              className="gap-1"
            >
              <Meh className="w-3 h-3" />
              Neutral ({sentimentCounts.neutral})
            </Button>
            <Button
              variant={filterSentiment === 'negative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSentiment('negative')}
              className="gap-1"
            >
              <Frown className="w-3 h-3" />
              Negative ({sentimentCounts.negative})
            </Button>
          </div>

          {/* Contexts list */}
          <div className="space-y-3">
            {filteredContexts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No mentions found with selected filters
              </p>
            ) : (
              filteredContexts.map((context) => {
                const isExpanded = expandedIds.has(context.id);
                return (
                  <div
                    key={context.id}
                    className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <Badge
                        variant="outline"
                        className={`${getSentimentColor(context.sentiment)} gap-1`}
                      >
                        {getSentimentIcon(context.sentiment)}
                        {context.sentiment}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(context.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Context */}
                    <p className="text-sm leading-relaxed mb-3">
                      {context.context}
                    </p>

                    {/* Keywords */}
                    {context.keywords && context.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {context.keywords.map((keyword, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Expand button */}
                    {context.full_context && context.full_context !== context.context && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(context.id)}
                        className="gap-1 text-xs"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Show full context
                          </>
                        )}
                      </Button>
                    )}

                    {/* Full context (expanded) */}
                    {isExpanded && context.full_context && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {context.full_context}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Show more button (if needed) */}
          {filteredContexts.length >= 20 && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {filteredContexts.length} mentions
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
