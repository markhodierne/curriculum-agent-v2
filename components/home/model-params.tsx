/**
 * ModelParams Component
 *
 * Provides collapsible advanced settings for model parameters:
 * - Temperature slider (0-1, default 0.3)
 * - Max tokens input (500-4000, default 2000)
 *
 * Settings are stored in React state and passed up to parent component.
 *
 * @component
 * @see FUNCTIONAL.md section 4.1 - Advanced Settings
 * @see CLAUDE.md - AI SDK v5 parameter handling
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'; // Used in Reset button

/**
 * Props for ModelParams component
 */
interface ModelParamsProps {
  /**
   * Temperature value (0.0-1.0)
   */
  temperature: number;

  /**
   * Max tokens value (500-4000)
   */
  maxTokens: number;

  /**
   * Callback when temperature changes
   */
  onTemperatureChange: (value: number) => void;

  /**
   * Callback when max tokens changes
   */
  onMaxTokensChange: (value: number) => void;
}

/**
 * ModelParams component for advanced model configuration
 *
 * Provides collapsible interface for adjusting temperature and max tokens.
 * Temperature controls creativity (0 = deterministic, 1 = creative).
 * Max tokens limits response length.
 *
 * @param {ModelParamsProps} props - Component props
 * @returns {React.ReactElement} The collapsible model parameters card
 *
 * @example
 * ```tsx
 * const [temperature, setTemperature] = useState(0.3);
 * const [maxTokens, setMaxTokens] = useState(2000);
 *
 * <ModelParams
 *   temperature={temperature}
 *   maxTokens={maxTokens}
 *   onTemperatureChange={setTemperature}
 *   onMaxTokensChange={setMaxTokens}
 * />
 * ```
 */
export function ModelParams({
  temperature,
  maxTokens,
  onTemperatureChange,
  onMaxTokensChange,
}: ModelParamsProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);

  /**
   * Handle temperature slider change
   * Converts slider array value to single number
   */
  const handleTemperatureChange = (values: number[]): void => {
    if (values.length > 0) {
      onTemperatureChange(values[0]);
    }
  };

  /**
   * Handle max tokens input change
   * Validates input is within allowed range (500-4000)
   */
  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 500 && value <= 4000) {
      onMaxTokensChange(value);
    }
  };

  /**
   * Reset parameters to default values
   */
  const handleReset = (): void => {
    onTemperatureChange(0.3);
    onMaxTokensChange(2000);
  };

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-70 transition-opacity">
            <div className="text-left">
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure model parameters (optional)
              </CardDescription>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-md text-lg">
              {isOpen ? '−' : '+'}
            </span>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Temperature Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="temperature-slider" className="text-sm font-medium">
                  Temperature
                </label>
                <span className="text-sm text-muted-foreground font-mono">
                  {temperature.toFixed(1)}
                </span>
              </div>
              <Slider
                id="temperature-slider"
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={handleTemperatureChange}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness: 0 = deterministic, 1 = creative
              </p>
            </div>

            {/* Max Tokens Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="max-tokens-input" className="text-sm font-medium">
                  Max Tokens
                </label>
                <span className="text-sm text-muted-foreground font-mono">
                  {maxTokens}
                </span>
              </div>
              <Input
                id="max-tokens-input"
                type="number"
                min={500}
                max={4000}
                step={100}
                value={maxTokens}
                onChange={handleMaxTokensChange}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Maximum response length (500-4000 tokens)
              </p>
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="w-full"
              >
                Reset to Defaults (0.3, 2000)
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
