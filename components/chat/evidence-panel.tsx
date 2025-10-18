/**
 * Evidence Panel Component
 *
 * Displays citations with confidence scores in a collapsible panel.
 * Shows overall confidence score, star ratings, and detailed citation information.
 *
 * @module components/chat/evidence-panel
 * @see FUNCTIONAL.md section 3.2 for UI specifications
 * @see CLAUDE.md for component standards
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Citation } from '@/lib/types/agent';

/**
 * Props for the EvidencePanel component
 */
interface EvidencePanelProps {
  /** Array of citations supporting the answer */
  citations: Citation[];
}

/**
 * Converts a confidence score (0.0-1.0) to a star rating string
 *
 * Star rating tiers:
 * - ★★★★★ = 0.90-1.00 (Direct graph match)
 * - ★★★★☆ = 0.75-0.89 (Inferred from traversal)
 * - ★★★☆☆ = 0.60-0.74 (Synthesized from multiple nodes)
 * - ★★☆☆☆ = 0.40-0.59 (Weak support)
 * - ★☆☆☆☆ = 0.00-0.39 (No clear support)
 *
 * @param score - Confidence score between 0.0 and 1.0
 * @returns Star rating string
 */
function getStarRating(score: number): string {
  if (score >= 0.90) return '★★★★★';
  if (score >= 0.75) return '★★★★☆';
  if (score >= 0.60) return '★★★☆☆';
  if (score >= 0.40) return '★★☆☆☆';
  return '★☆☆☆☆';
}

/**
 * Calculates the overall confidence score from an array of citations
 *
 * @param citations - Array of citations with confidence scores
 * @returns Average confidence score (0.0-1.0), or 0 if no citations
 */
function calculateOverallConfidence(citations: Citation[]): number {
  if (citations.length === 0) return 0;

  const sum = citations.reduce((acc, citation) => acc + citation.confidence, 0);
  return sum / citations.length;
}

/**
 * Evidence Panel Component
 *
 * Displays citations with confidence scores in a collapsible panel.
 * Default state is collapsed with a summary showing citation count and overall confidence.
 * When expanded, shows detailed information for each citation.
 *
 * @example
 * ```tsx
 * const citations = [
 *   {
 *     nodeId: 'Y3-F-001',
 *     nodeType: 'Objective',
 *     text: 'Recognise, find and write fractions of a discrete set of objects',
 *     confidence: 0.97,
 *     reason: 'Direct graph match'
 *   }
 * ];
 *
 * <EvidencePanel citations={citations} />
 * ```
 */
export function EvidencePanel({ citations }: EvidencePanelProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const overallConfidence = calculateOverallConfidence(citations);
  const overallStars = getStarRating(overallConfidence);

  // Handle case with no citations
  if (citations.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Evidence (0 citations)</span>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-muted">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">
                  Evidence ({citations.length} citation{citations.length !== 1 ? 's' : ''})
                </span>
                <span className="text-muted-foreground">-</span>
                <span className="text-muted-foreground">
                  Overall confidence: {overallStars} {overallConfidence.toFixed(2)}
                </span>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-2 space-y-3">
            {citations.map((citation, index) => (
              <div
                key={`${citation.nodeId}-${index}`}
                className="border-l-2 border-primary/20 pl-3 py-2 space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-primary">[{citation.nodeId}]</span>
                    <span className="text-muted-foreground text-xs">
                      {citation.nodeType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm shrink-0">
                    <span className="text-amber-500">
                      {getStarRating(citation.confidence)}
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {citation.confidence.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-foreground leading-relaxed">
                  "{citation.text}"
                </p>

                <p className="text-xs text-muted-foreground italic">
                  Confidence: {citation.reason}
                </p>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
