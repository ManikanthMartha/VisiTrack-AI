import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PlatformScores {
  chatgpt: number;
  perplexity: number;
  claude: number;
  gemini: number;
}

interface PlatformBreakdownProps {
  scores: PlatformScores;
  competitorScores?: PlatformScores;
  className?: string;
}

const platforms = [
  { key: 'chatgpt', label: 'ChatGPT', color: '#10a37f', bgColor: 'bg-[#10a37f]/10', textColor: 'text-[#10a37f]' },
  { key: 'perplexity', label: 'Perplexity', color: '#20808d', bgColor: 'bg-[#20808d]/10', textColor: 'text-[#20808d]' },
  { key: 'claude', label: 'Claude', color: '#d97757', bgColor: 'bg-[#d97757]/10', textColor: 'text-[#d97757]' },
  { key: 'gemini', label: 'Gemini', color: '#4285f4', bgColor: 'bg-[#4285f4]/10', textColor: 'text-[#4285f4]' },
] as const;

export function PlatformBreakdown({ scores, className }: PlatformBreakdownProps) {
  const maxScore = Math.max(...Object.values(scores));
  const bestPlatform = platforms.find(p => scores[p.key as keyof PlatformScores] === maxScore);

  return (
    <div className={cn('card-glow p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          AI Platform Performance
        </h3>
        {bestPlatform && (
          <span className="text-xs text-muted-foreground">
            Best on <span className={cn('font-medium', bestPlatform.textColor)}>{bestPlatform.label}</span>
          </span>
        )}
      </div>

      <div className="space-y-4">
        {platforms.map((platform, index) => {
          const score = scores[platform.key as keyof PlatformScores];
          const percentage = (score / 100) * 100;
          
          return (
            <motion.div
              key={platform.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="text-sm text-foreground">{platform.label}</span>
                </div>
                <span className="text-sm font-mono-numbers font-semibold text-foreground">
                  {score.toFixed(1)}%
                </span>
              </div>
              
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-5 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-muted-foreground">Average Score</span>
          <p className="text-lg font-mono-numbers font-semibold text-foreground">
            {(Object.values(scores).reduce((a, b) => a + b, 0) / 4).toFixed(1)}%
          </p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Platform Range</span>
          <p className="text-lg font-mono-numbers font-semibold text-foreground">
            {(Math.max(...Object.values(scores)) - Math.min(...Object.values(scores))).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
