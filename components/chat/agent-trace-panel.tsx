/**
 * Agent Trace Panel Component
 *
 * Displays agent reasoning steps in a collapsible panel.
 * Shows the step-by-step process the agent took to answer the user's query.
 *
 * @module components/chat/agent-trace-panel
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

/**
 * Props for the AgentTracePanel component
 */
interface AgentTracePanelProps {
  /** Array of step descriptions showing the agent's reasoning process */
  steps: string[];
}

/**
 * Agent Trace Panel Component
 *
 * Displays the agent's reasoning steps in a collapsible panel.
 * Default state is collapsed with a summary showing the total number of steps.
 * When expanded, shows each step in order with numbering.
 *
 * This provides transparency into the agent's decision-making process,
 * showing how it retrieved memories, generated Cypher queries, and synthesized answers.
 *
 * @example
 * ```tsx
 * const steps = [
 *   'Memory Retrieval: Retrieved 3 similar high-quality memories',
 *   'Cypher Generation: Generated query using pattern "objectives_by_year"',
 *   'Graph Query Execution: Found 12 objectives in 0.3s',
 *   'Answer Synthesis: Generated answer with 3 claims, all grounded'
 * ];
 *
 * <AgentTracePanel steps={steps} />
 * ```
 */
export function AgentTracePanel({ steps }: AgentTracePanelProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  // Handle case with no steps
  if (steps.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Agent Trace (0 steps)</span>
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
                  Agent Trace ({steps.length} step{steps.length !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-2 space-y-3">
            {steps.map((step, index) => (
              <div
                key={`step-${index}`}
                className="border-l-2 border-blue-500/20 pl-3 py-2 space-y-1"
              >
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-medium text-xs shrink-0">
                    Step {index + 1}
                  </span>
                </div>

                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {step}
                </p>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
