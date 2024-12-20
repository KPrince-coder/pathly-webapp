'use client';

import { useState } from 'react';
import { useFeatureStore } from '@/store/features';
import { FiEdit3, FiLoader } from 'react-icons/fi';

const WritingAssistant: React.FC<{ text: string }> = ({ text }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { openaiApiKey } = useFeatureStore();

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/writing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error getting writing suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Writing Assistant</h3>
      <button
        onClick={getSuggestions}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2"
      >
        {loading ? <FiLoader className="animate-spin" /> : <FiEdit3 />}
        Get Suggestions
      </button>
      {suggestions.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium">Suggestions:</h4>
          <ul className="list-disc pl-5">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WritingAssistant;
