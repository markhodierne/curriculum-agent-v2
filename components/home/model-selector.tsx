/**
 * ModelSelector Component
 *
 * Provides a dropdown selector for choosing the LLM model to use in the chat.
 * Supports GPT-4o (recommended), gpt-4o-mini (fastest), and GPT-5 (experimental).
 *
 * @component
 * @see FUNCTIONAL.md section 4.1 - Model Selector Options
 * @see CLAUDE.md - AI SDK patterns and model naming
 */

'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Available model options with metadata
 */
const MODEL_OPTIONS = [
  {
    value: 'gpt-4o',
    label: 'GPT-4o',
    description: 'Recommended - Fast, high quality',
  },
  {
    value: 'gpt-4o-mini',
    label: 'gpt-4o-mini',
    description: 'Fastest, cost-effective',
  },
  {
    value: 'gpt-5',
    label: 'GPT-5',
    description: 'Experimental - if available',
  },
] as const;

/**
 * Props for ModelSelector component
 */
interface ModelSelectorProps {
  /**
   * Currently selected model value
   */
  value: string;

  /**
   * Callback when model selection changes
   */
  onChange: (value: string) => void;
}

/**
 * ModelSelector component that allows users to choose their preferred LLM
 *
 * @param {ModelSelectorProps} props - Component props
 * @returns {React.ReactElement} The model selector card
 *
 * @example
 * ```tsx
 * const [model, setModel] = useState('gpt-4o');
 * <ModelSelector value={model} onChange={setModel} />
 * ```
 */
export function ModelSelector({ value, onChange }: ModelSelectorProps): React.ReactElement {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Model Selection</CardTitle>
        <CardDescription>
          Choose the AI model for your conversation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {MODEL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Display selected model info */}
        {value && (
          <div className="mt-3 text-sm text-muted-foreground">
            Selected: <strong>{MODEL_OPTIONS.find((m) => m.value === value)?.label}</strong>
            {' - '}
            {MODEL_OPTIONS.find((m) => m.value === value)?.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
