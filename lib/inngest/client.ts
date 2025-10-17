/**
 * Inngest Client Singleton
 *
 * Provides a single reusable instance of the Inngest client for event-driven
 * async workflows. Used by:
 * - Query Agent: Emit `interaction.complete` events
 * - Reflection Agent: Receive events, emit `reflection.complete`
 * - Learning Agent: Receive events, create memories
 *
 * Singleton pattern ensures consistent connection reuse and avoids creating
 * multiple client instances.
 *
 * @see ARCHITECTURE.md Section 2.4 (Async Processing)
 * @see CLAUDE.md (Inngest Integration)
 * @see https://www.inngest.com/docs
 */

import { Inngest } from 'inngest';
import type { InteractionCompleteEvent, ReflectionCompleteEvent } from './events';

/**
 * Type definition for events schema
 *
 * Defines the shape of events that can be sent and received by this Inngest client.
 * Maps event names to their payload types for type safety.
 *
 * Note: Inngest generic parameter format uses event schemas, but for basic usage
 * we can let TypeScript infer types from event data structures.
 */
export type Events = {
  'interaction.complete': InteractionCompleteEvent['data'];
  'reflection.complete': ReflectionCompleteEvent['data'];
};

/**
 * Singleton Inngest client instance
 *
 * Initialized lazily on first call to `getInngestClient()`.
 * Subsequent calls return the same instance.
 */
let inngestClientInstance: Inngest | null = null;

/**
 * Get the singleton Inngest client instance
 *
 * Creates a new client on first call, then returns the same instance
 * for all subsequent calls. Validates required environment variables.
 *
 * @returns Inngest client configured for this application
 * @throws Error if INNGEST_EVENT_KEY environment variable is not set
 *
 * @example
 * ```typescript
 * // In Query Agent API route
 * const inngest = getInngestClient();
 * await inngest.send({
 *   name: 'interaction.complete',
 *   data: { interactionId, query, answer, ... }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // In Inngest function definition
 * import { inngest } from '@/lib/inngest/client';
 *
 * export const reflectionFunction = inngest.createFunction(
 *   { id: 'reflection-agent' },
 *   { event: 'interaction.complete' },
 *   async ({ event }) => { ... }
 * );
 * ```
 */
export function getInngestClient(): Inngest {
  if (!inngestClientInstance) {
    // Validate environment variables
    if (!process.env.INNGEST_EVENT_KEY) {
      throw new Error(
        'INNGEST_EVENT_KEY environment variable is not set. ' +
          'Please add it to your .env.local file. ' +
          'See .env.example for setup instructions.'
      );
    }

    // Create new Inngest client instance
    inngestClientInstance = new Inngest({
      id: 'curriculum-agent-v2',
      name: 'Oak Curriculum Agent',
      eventKey: process.env.INNGEST_EVENT_KEY,
    });
  }

  return inngestClientInstance;
}

/**
 * Named export for convenience (common pattern in Inngest docs)
 *
 * Allows importing like: `import { inngest } from '@/lib/inngest/client'`
 * instead of: `import { getInngestClient } from '@/lib/inngest/client'`
 *
 * @example
 * ```typescript
 * import { inngest } from '@/lib/inngest/client';
 *
 * // Emit event
 * await inngest.send({ name: 'interaction.complete', data: { ... } });
 *
 * // Define function
 * export const myFunction = inngest.createFunction(...);
 * ```
 */
export const inngest = getInngestClient();
