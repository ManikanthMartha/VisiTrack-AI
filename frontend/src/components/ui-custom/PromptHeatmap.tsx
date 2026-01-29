import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, X, ExternalLink } from 'lucide-react';
import type { PromptBreakdown } from '@/types';

interface PromptHeatmapProps {
  prompts: PromptBreakdown[];
  className?: string;
}

const models = [
  { key: 'chatgpt', label: 'ChatGPT', color: '#10a37f' },
  { key: 'perplexity', label: 'Perplexity', color: '#20808d' },
  { key: 'claude', label: 'Claude', color: '#d97757' },
  { key: 'gemini', label: 'Gemini', color: '#4285f4' },
] as const;

export function PromptHeatmap({ prompts, className }: PromptHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{
    prompt: PromptBreakdown;
    model: typeof models[number];
  } | null>(null);

  return (
    <div className={cn('card-glow p-5', className)}>
      <h3 className="text-sm font-semibold text-foreground mb-4 tracking-tight">
        Prompt Breakdown
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">
                Prompt
              </th>
              {models.map((model) => (
                <th
                  key={model.key}
                  className="text-center text-xs font-medium text-muted-foreground pb-3 px-2"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: model.color }}
                    />
                    <span>{model.label}</span>
                  </div>
                </th>
              ))}
              <th className="text-right text-xs font-medium text-muted-foreground pb-3 pl-4">
                Mentions
              </th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt, index) => (
              <motion.tr
                key={prompt.prompt}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-t border-border/50"
              >
                <td className="py-3 pr-4">
                  <p className="text-sm text-foreground line-clamp-1" title={prompt.prompt}>
                    {prompt.prompt}
                  </p>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    {prompt.category}
                  </Badge>
                </td>
                {models.map((model) => {
                  const isMentioned = prompt.models[model.key];
                  return (
                    <td key={model.key} className="px-2">
                      <button
                        onClick={() => isMentioned && setSelectedCell({ prompt, model })}
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center mx-auto',
                          'transition-all duration-200',
                          isMentioned
                            ? 'bg-accent/20 hover:bg-accent/30 cursor-pointer'
                            : 'bg-muted/50 cursor-default'
                        )}
                        disabled={!isMentioned}
                      >
                        {isMentioned ? (
                          <Check className="w-4 h-4 text-accent" />
                        ) : (
                          <X className="w-3 h-3 text-muted-foreground/30" />
                        )}
                      </button>
                    </td>
                  );
                })}
                <td className="py-3 pl-4 text-right">
                  <span className="text-sm font-mono-numbers font-medium text-foreground">
                    {prompt.mentionCount}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Prompt Response Detail</DialogTitle>
          </DialogHeader>
          {selectedCell && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                <p className="text-sm text-foreground">{selectedCell.prompt.prompt}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Model</p>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedCell.model.color }}
                  />
                  <span className="text-sm text-foreground">{selectedCell.model.label}</span>
                </div>
              </div>
              {selectedCell.prompt.sampleResponse && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sample Response</p>
                  <div className="bg-muted rounded-lg p-3 text-sm text-foreground leading-relaxed">
                    {selectedCell.prompt.sampleResponse}
                  </div>
                </div>
              )}
              {selectedCell.prompt.topCitedPages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Top Cited Pages</p>
                  <div className="space-y-2">
                    {selectedCell.prompt.topCitedPages.map((page) => (
                      <a
                        key={page.id}
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors group"
                      >
                        <span className="w-6 h-6 rounded bg-accent/10 text-accent text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {page.favicon}
                        </span>
                        <span className="text-sm text-foreground truncate flex-1">
                          {page.title}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
