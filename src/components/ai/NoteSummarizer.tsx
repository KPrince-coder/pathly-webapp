'use client';

import { useState } from 'react';
import { useFeatureStore } from '@/store/features';
import { FiEdit3, FiLoader } from 'react-icons/fi';

const NoteSummarizer: React.FC<{ note: string }> = ({ note }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { openaiApiKey } = useFeatureStore();

  const summarizeNote = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({ text: note }),
      });

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error summarizing note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Note Summarization</h3>
      <button
        onClick={summarizeNote}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2"
      >
        {loading ? <FiLoader className="animate-spin" /> : <FiEdit3 />}
        Summarize
      </button>
      {summary && (
        <div className="mt-4">
          <h4 className="font-medium">Summary:</h4>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default NoteSummarizer;
