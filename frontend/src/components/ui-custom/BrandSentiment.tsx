'use client';

import { SentimentBreakdown } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile, Meh, Frown } from 'lucide-react';

interface BrandSentimentProps {
  sentiment: SentimentBreakdown | null;
  isLoading?: boolean;
}

export function BrandSentiment({ sentiment, isLoading }: BrandSentimentProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription>Loading sentiment data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="animate-pulse h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sentiment || sentiment.total_mentions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription>No sentiment data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sentiment analysis will appear here once brand mentions are analyzed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sentiments = [
    {
      label: 'Positive',
      count: sentiment.positive_count,
      percentage: sentiment.positive_percentage,
      color: 'bg-green-500',
      lightColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: Smile,
    },
    {
      label: 'Neutral',
      count: sentiment.neutral_count,
      percentage: sentiment.neutral_percentage,
      color: 'bg-gray-500',
      lightColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      icon: Meh,
    },
    {
      label: 'Negative',
      count: sentiment.negative_count,
      percentage: sentiment.negative_percentage,
      color: 'bg-red-500',
      lightColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: Frown,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Analysis</CardTitle>
        <CardDescription>
          How this brand is described across {sentiment.total_mentions} mentions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Sentiment bars */}
          {sentiments.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${item.textColor}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.count}</span>
                    <span className="font-semibold min-w-[3rem] text-right">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Mentions</span>
              <span className="font-semibold">{sentiment.total_mentions}</span>
            </div>
          </div>

          {/* Dominant sentiment badge */}
          <div className="pt-2">
            {sentiment.positive_percentage > 50 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                <Smile className="w-4 h-4" />
                Predominantly Positive
              </div>
            )}
            {sentiment.neutral_percentage > 50 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                <Meh className="w-4 h-4" />
                Mostly Neutral
              </div>
            )}
            {sentiment.negative_percentage > 30 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                <Frown className="w-4 h-4" />
                Some Negative Mentions
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
