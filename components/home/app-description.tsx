/**
 * AppDescription Component
 *
 * Displays the application title and description on the home page.
 * Explains what the Oak Curriculum Agent does and how it learns from interactions.
 *
 * @component
 * @see FUNCTIONAL.md section 4.1 - Home Page specifications
 * @see ARCHITECTURE.md section 3 - Project structure
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * AppDescription component that shows the agent's capabilities and learning mechanism
 *
 * @returns {React.ReactElement} The app description card
 */
export function AppDescription(): React.ReactElement {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Oak Curriculum Agent - Self-Learning AI Assistant
        </CardTitle>
        <CardDescription className="text-base">
          An intelligent curriculum assistant that gets smarter with every conversation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">What This Agent Does</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Answers curriculum questions</strong> using a Neo4j knowledge graph of the UK National Curriculum
            </li>
            <li>
              <strong>Grounds all answers in evidence</strong> with confidence-scored citations from the graph
            </li>
            <li>
              <strong>Shows its reasoning</strong> through transparent agent traces and evidence panels
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">How It Learns</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Three-agent learning loop</strong>: Query → Reflection → Learning
            </li>
            <li>
              <strong>Evaluates every interaction</strong> on grounding, accuracy, completeness, pedagogy, and clarity
            </li>
            <li>
              <strong>Creates memories</strong> of successful interactions to improve future responses
            </li>
            <li>
              <strong>Retrieves similar past queries</strong> using vector similarity for few-shot learning
            </li>
            <li>
              <strong>Demonstrates improvement</strong> within 50 conversations (track progress in the dashboard)
            </li>
          </ul>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground italic">
            Configure your model preferences below, then click "Start Chat" to begin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
