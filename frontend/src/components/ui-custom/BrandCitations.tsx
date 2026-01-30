'use client';

import { Citation } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface BrandCitationsProps {
  citations: Citation[];
  isLoading?: boolean;
}

export function BrandCitations({ citations, isLoading }: BrandCitationsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Cited Sources</CardTitle>
          <CardDescription>Loading citations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!citations || citations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Cited Sources</CardTitle>
          <CardDescription>No citations found yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Citations will appear here once AI responses include source URLs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Cited Sources</CardTitle>
        <CardDescription>
          Most frequently cited URLs when this brand is mentioned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {citations.map((citation, index) => (
            <div
              key={`${citation.url}-${index}`}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 hover:underline"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {citation.title || citation.domain || 'Untitled'}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {citation.domain || new URL(citation.url).hostname}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5" />
                </a>
                
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {citation.citation_count} {citation.citation_count === 1 ? 'mention' : 'mentions'}
                  </span>
                  <span className="text-muted-foreground">
                    in {citation.response_count} {citation.response_count === 1 ? 'response' : 'responses'}
                  </span>
                  <span className="text-muted-foreground">
                    Avg position: <span className="font-medium text-foreground">{citation.avg_position.toFixed(1)}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
