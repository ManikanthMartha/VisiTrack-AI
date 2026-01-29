import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ExternalLink, Link2 } from 'lucide-react';
import type { Source } from '@/types';

interface SourcesListProps {
  sources: Source[];
  className?: string;
  title?: string;
  maxItems?: number;
}

export function SourcesList({
  sources,
  className,
  title = 'Top Cited Pages',
  maxItems = 5,
}: SourcesListProps) {
  const displaySources = sources.slice(0, maxItems);

  return (
    <div className={cn('card-glow p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="w-3.5 h-3.5" />
          <span>{sources.length} sources</span>
        </div>
      </div>

      <div className="space-y-2">
        {displaySources.map((source, index) => (
          <motion.a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'group flex items-start gap-3 p-3 rounded-xl',
              'bg-muted/50 hover:bg-muted transition-colors duration-200',
              'focus-ring'
            )}
          >
            {/* Favicon */}
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent text-sm font-semibold flex items-center justify-center flex-shrink-0">
              {source.favicon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                  {source.title}
                </h4>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {source.snippet}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono-numbers font-medium text-foreground">
                    {source.mentionCount}
                  </span>{' '}
                  mentions
                </span>
                <span className="text-xs text-muted-foreground">
                  Last: {new Date(source.lastMentioned).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      {sources.length > maxItems && (
        <button className="w-full mt-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          View all {sources.length} sources
        </button>
      )}
    </div>
  );
}
