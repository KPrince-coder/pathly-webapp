'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare,
  FiBrain,
  FiTrendingUp,
  FiTarget,
  FiRefreshCw,
} from 'react-icons/fi';
import { colors } from '@/styles/colors';
import OpenAI from 'openai';

interface VisionAIAssistantProps {
  goalId: string;
  goalDetails: {
    title: string;
    description: string;
    category: string;
    target_date: string;
    specific_details?: any;
    measurable_metrics?: any;
    achievable_steps?: any;
  };
  onSuggestionApply?: (suggestion: any) => void;
}

export function VisionAIAssistant({
  goalId,
  goalDetails,
  onSuggestionApply,
}: VisionAIAssistantProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const supabase = useSupabase();
  const openai = new OpenAI();

  const analyzeGoal = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze this goal and provide suggestions:
      Title: ${goalDetails.title}
      Description: ${goalDetails.description}
      Category: ${goalDetails.category}
      Target Date: ${goalDetails.target_date}
      
      Please provide:
      1. SMART goal improvements
      2. Potential milestones
      3. Success metrics
      4. Risk factors
      5. Resource recommendations`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const analysis = response.choices[0].message.content;
      setSuggestions(parseAIResponse(analysis));
    } catch (error) {
      console.error('Error analyzing goal:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomPrompt = async () => {
    setIsAnalyzing(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a goal-setting and personal development AI assistant. Context about the goal:
            ${JSON.stringify(goalDetails, null, 2)}`,
          },
          { role: 'user', content: customPrompt },
        ],
        temperature: 0.7,
      });

      const analysis = response.choices[0].message.content;
      setSuggestions({ customResponse: analysis });
    } catch (error) {
      console.error('Error processing custom prompt:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseAIResponse = (response: string) => {
    // Simple parser for demonstration - enhance based on actual response format
    const sections = response.split('\n\n');
    return {
      smartImprovements: sections[0],
      milestones: sections[1],
      metrics: sections[2],
      risks: sections[3],
      resources: sections[4],
    };
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FiBrain className="h-6 w-6 text-primary-500" />
          <h3 className="text-lg font-medium text-gray-900">AI Goal Assistant</h3>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className="flex items-center space-x-2"
          >
            <FiMessageSquare className="h-4 w-4" />
            <span>Custom Prompt</span>
          </Button>
          <Button
            onClick={analyzeGoal}
            disabled={isAnalyzing}
            className="flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <FiRefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FiTarget className="h-4 w-4" />
            )}
            <span>Analyze Goal</span>
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showCustomPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ask anything about your goal..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleCustomPrompt}
                disabled={isAnalyzing || !customPrompt.trim()}
              >
                Ask AI Assistant
              </Button>
            </div>
          </motion.div>
        )}

        {suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {suggestions.customResponse ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="whitespace-pre-wrap">{suggestions.customResponse}</p>
              </div>
            ) : (
              <>
                <SuggestionSection
                  icon={<FiTarget className="h-5 w-5" />}
                  title="SMART Goal Improvements"
                  content={suggestions.smartImprovements}
                  onApply={() =>
                    onSuggestionApply?.({
                      type: 'smart',
                      content: suggestions.smartImprovements,
                    })
                  }
                />

                <SuggestionSection
                  icon={<FiTrendingUp className="h-5 w-5" />}
                  title="Suggested Milestones"
                  content={suggestions.milestones}
                  onApply={() =>
                    onSuggestionApply?.({
                      type: 'milestones',
                      content: suggestions.milestones,
                    })
                  }
                />

                <SuggestionSection
                  icon={<FiTarget className="h-5 w-5" />}
                  title="Success Metrics"
                  content={suggestions.metrics}
                  onApply={() =>
                    onSuggestionApply?.({
                      type: 'metrics',
                      content: suggestions.metrics,
                    })
                  }
                />

                <SuggestionSection
                  icon={<FiTarget className="h-5 w-5" />}
                  title="Risk Factors"
                  content={suggestions.risks}
                  onApply={() =>
                    onSuggestionApply?.({
                      type: 'risks',
                      content: suggestions.risks,
                    })
                  }
                />

                <SuggestionSection
                  icon={<FiTarget className="h-5 w-5" />}
                  title="Recommended Resources"
                  content={suggestions.resources}
                  onApply={() =>
                    onSuggestionApply?.({
                      type: 'resources',
                      content: suggestions.resources,
                    })
                  }
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function SuggestionSection({
  icon,
  title,
  content,
  onApply,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  onApply: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-gray-700">
          {icon}
          <h4 className="font-medium">{title}</h4>
        </div>
        <Button variant="outline" size="sm" onClick={onApply}>
          Apply
        </Button>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
