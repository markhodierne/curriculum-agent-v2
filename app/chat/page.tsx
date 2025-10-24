/**
 * Chat Page (/chat)
 *
 * Main chat interface for the Oak Curriculum Agent. Users interact with the Query Agent
 * through streaming responses, view evidence citations, agent reasoning traces, and provide
 * feedback on answers.
 *
 * Features:
 * - Streaming chat interface with ChatAssistant component
 * - Back to Home button for configuration changes
 * - Full-height layout optimized for conversation
 * - Reads model configuration from sessionStorage (set by home page)
 *
 * @see FUNCTIONAL.md section 3.2 - Chat Interaction Details
 * @see FUNCTIONAL.md section 4.2 - Chat Interface specifications
 * @see ARCHITECTURE.md section 3 - Project structure
 * @see TO-DO.md Task 20 - Chat Page - Create Chat Route
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ChatAssistant from '@/components/chat/chat-assistant';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Trash2 } from 'lucide-react';

/**
 * Chat page component
 *
 * Provides the main chat interface with:
 * - Header with app title and back button
 * - Full-height ChatAssistant component
 * - Responsive layout
 *
 * @returns {React.ReactElement} The chat page
 */
export default function ChatPage(): React.ReactElement {
  const router = useRouter();

  /**
   * Handles "Back to Home" button click
   * Returns user to configuration page
   */
  const handleBackToHome = (): void => {
    router.push('/');
  };

  /**
   * Handles "Dashboard" button click
   * Navigates to analytics/learning dashboard
   */
  const handleGoToDashboard = (): void => {
    router.push('/dashboard');
  };

  /**
   * Handles "Clear Conversation" button click
   * Triggers a custom event that ChatAssistant component listens for
   */
  const handleClearConversation = (): void => {
    // Emit custom event that ChatAssistant will listen for
    window.dispatchEvent(new CustomEvent('clearConversation'));
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with logo, title, and back button */}
      <header className="border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <h1 className="text-xl font-semibold">Curriculum Query Agent</h1>

            {/* Right: Navigation buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleClearConversation}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Conversation
              </Button>
              <Button
                onClick={handleGoToDashboard}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                onClick={handleBackToHome}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main chat area - fills remaining height */}
      <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full">
        <ChatAssistant />
      </main>
    </div>
  );
}
