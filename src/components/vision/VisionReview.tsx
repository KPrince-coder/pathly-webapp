'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { format, subMonths, isAfter } from 'date-fns';
import {
  FiCalendar,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

interface VisionReviewProps {
  goalId: string;
}

interface ReviewData {
  id: string;
  review_date: string;
  period: 'quarterly' | 'annual';
  achievements: string[];
  challenges: string[];
  adjustments: string[];
  next_steps: string[];
  confidence_level: number;
}

export function VisionReview({ goalId }: VisionReviewProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewReview, setShowNewReview] = useState(false);
  const [newReview, setNewReview] = useState<Partial<ReviewData>>({
    period: 'quarterly',
    achievements: [],
    challenges: [],
    adjustments: [],
    next_steps: [],
    confidence_level: 7,
  });
  const supabase = useSupabase();

  useEffect(() => {
    fetchReviews();
    checkReviewDue();
  }, [goalId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_reviews')
        .select('*')
        .eq('vision_goal_id', goalId)
        .order('review_date', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkReviewDue = () => {
    if (reviews.length === 0) {
      setShowNewReview(true);
      return;
    }

    const lastReview = reviews[0];
    const lastReviewDate = new Date(lastReview.review_date);
    const threeMonthsAgo = subMonths(new Date(), 3);

    if (isAfter(threeMonthsAgo, lastReviewDate)) {
      setShowNewReview(true);
    }
  };

  const handleAddItem = (
    field: 'achievements' | 'challenges' | 'adjustments' | 'next_steps',
    value: string
  ) => {
    setNewReview((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), value],
    }));
  };

  const handleRemoveItem = (
    field: 'achievements' | 'challenges' | 'adjustments' | 'next_steps',
    index: number
  ) => {
    setNewReview((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmitReview = async () => {
    try {
      const { error } = await supabase.from('vision_reviews').insert([
        {
          vision_goal_id: goalId,
          review_date: new Date().toISOString(),
          ...newReview,
        },
      ]);

      if (error) throw error;
      setShowNewReview(false);
      setNewReview({
        period: 'quarterly',
        achievements: [],
        challenges: [],
        adjustments: [],
        next_steps: [],
        confidence_level: 7,
      });
      await fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const renderReviewSection = (
    title: string,
    items: string[],
    field: 'achievements' | 'challenges' | 'adjustments' | 'next_steps'
  ) => (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-700">{title}</h4>
      {showNewReview ? (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Textarea
              placeholder={`Add ${title.toLowerCase()}`}
              value={''}
              onChange={(e) => handleAddItem(field, e.target.value)}
              rows={2}
            />
            <Button
              variant="outline"
              onClick={() => handleAddItem(field, '')}
              className="shrink-0"
            >
              Add
            </Button>
          </div>
          <ul className="space-y-2">
            {newReview[field]?.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <span>{item}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(field, index)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="list-disc list-inside space-y-1">
          {items.map((item, index) => (
            <li key={index} className="text-gray-600">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (loading) {
    return <div>Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Goal Reviews</h3>
        {!showNewReview && (
          <Button onClick={() => setShowNewReview(true)}>New Review</Button>
        )}
      </div>

      {showNewReview ? (
        <Card className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">New Goal Review</h4>
            <Select
              value={{ value: newReview.period!, label: newReview.period === 'quarterly' ? 'Quarterly' : 'Annual' }}
              onChange={(value) =>
                setNewReview((prev) => ({
                  ...prev,
                  period: value.value as 'quarterly' | 'annual',
                }))
              }
              options={[
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'annual', label: 'Annual' },
              ]}
            />
          </div>

          {renderReviewSection('Achievements', newReview.achievements || [], 'achievements')}
          {renderReviewSection('Challenges', newReview.challenges || [], 'challenges')}
          {renderReviewSection('Adjustments', newReview.adjustments || [], 'adjustments')}
          {renderReviewSection('Next Steps', newReview.next_steps || [], 'next_steps')}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidence Level ({newReview.confidence_level}/10)
            </label>
            <Progress
              value={(newReview.confidence_level || 0) * 10}
              className="mb-2"
            />
            <input
              type="range"
              min="0"
              max="10"
              value={newReview.confidence_level}
              onChange={(e) =>
                setNewReview((prev) => ({
                  ...prev,
                  confidence_level: parseInt(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setShowNewReview(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>Submit Review</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <FiCalendar className="text-gray-400" />
                  <span className="text-gray-600">
                    {format(new Date(review.review_date), 'MMM dd, yyyy')}
                  </span>
                  <Badge>
                    {review.period === 'quarterly' ? 'Quarterly' : 'Annual'} Review
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <FiTrendingUp className="text-gray-400" />
                  <span className="text-gray-600">
                    Confidence: {review.confidence_level}/10
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderReviewSection('Achievements', review.achievements, 'achievements')}
                {renderReviewSection('Challenges', review.challenges, 'challenges')}
                {renderReviewSection('Adjustments', review.adjustments, 'adjustments')}
                {renderReviewSection('Next Steps', review.next_steps, 'next_steps')}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
