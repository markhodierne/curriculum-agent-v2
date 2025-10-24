/**
 * Home Page (/)
 *
 * Landing page for the Curriculum Query Agent where users configure their model preferences
 * before starting a chat session. Displays:
 * - Application description (what the agent does, how it learns)
 * - Model selector (GPT-4o, gpt-4o-mini, GPT-5)
 * - Advanced parameters (temperature, max tokens) - collapsible
 * - "Start Chat" button that saves config to sessionStorage and navigates to /chat
 *
 * @see FUNCTIONAL.md section 3.1 - First-Time User Experience
 * @see FUNCTIONAL.md section 4.1 - Home Page specifications
 * @see ARCHITECTURE.md section 3 - Project structure
 * @see TO-DO.md Task 15 - Home Page Main Page
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppDescription } from '@/components/home/app-description';
import { ModelSelector } from '@/components/home/model-selector';
import { ModelParams } from '@/components/home/model-params';
import { Button } from '@/components/ui/button';

/**
 * Configuration interface for chat session
 */
interface ChatConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Default configuration values per FUNCTIONAL.md section 4.1
 */
const DEFAULT_CONFIG: ChatConfig = {
  model: 'gpt-4o',
  temperature: 0.3,
  maxTokens: 2000,
};

/**
 * Home page component
 *
 * Allows users to configure their chat preferences before starting a conversation.
 * Configuration is saved to sessionStorage and read by the chat page.
 *
 * @returns {React.ReactElement} The home page
 */
export default function Home(): React.ReactElement {
  const router = useRouter();

  // State management for model configuration
  const [model, setModel] = useState<string>(DEFAULT_CONFIG.model);
  const [temperature, setTemperature] = useState<number>(DEFAULT_CONFIG.temperature);
  const [maxTokens, setMaxTokens] = useState<number>(DEFAULT_CONFIG.maxTokens);

  /**
   * Handles "Start Chat" button click
   * Saves configuration to sessionStorage and navigates to /chat
   */
  const handleStartChat = (): void => {
    // Build configuration object
    const config: ChatConfig = {
      model,
      temperature,
      maxTokens,
    };

    // Save to sessionStorage for chat page to read
    sessionStorage.setItem('chatConfig', JSON.stringify(config));

    // Navigate to chat page
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with title */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-xl font-semibold">Curriculum Query Agent</h1>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* App description */}
        <AppDescription />

        {/* Model selection */}
        <ModelSelector value={model} onChange={setModel} />

        {/* Advanced parameters (collapsible) */}
        <ModelParams
          temperature={temperature}
          maxTokens={maxTokens}
          onTemperatureChange={setTemperature}
          onMaxTokensChange={setMaxTokens}
        />

        {/* Start Chat button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleStartChat}
            size="lg"
            className="w-full max-w-md text-lg"
          >
            Start Chat
          </Button>
        </div>

        {/* Footer note */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>
            Your configuration will be saved for this session. You can return to this page
            at any time to change your settings.
          </p>
        </div>
      </main>
    </div>
  );
}
