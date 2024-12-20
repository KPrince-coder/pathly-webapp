'use client';

import { useEffect, useState } from 'react';
import { useFeatureStore } from '@/store/features';
import { FiStar } from 'react-icons/fi';

const ContentRecommendations: React.FC<{ noteId: string }> = ({ noteId }) => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const { openaiApiKey } = useFeatureStore();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch(`/api/recommendations/${noteId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
          },
        });

        const data = await response.json();
        setRecommendations(data.recommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchRecommendations();
  }, [noteId, openaiApiKey]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Content Recommendations</h3>
      <ul className="mt-2 space-y-2">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex items-center gap-2">
            <FiStar className="text-yellow-500" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContentRecommendations;
