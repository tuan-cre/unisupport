import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface CsatSurveyProps {
  ticketId: string;
  rating?: { rating: number; feedback: string | null };
  onSuccess?: () => void;
}

export default function CsatSurvey({ ticketId, rating: existing, onSuccess }: CsatSurveyProps) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [feedback, setFeedback] = useState(existing?.feedback ?? '');
  const [submitted, setSubmitted] = useState(!!existing);

  const mutation = useMutation({
    mutationFn: async ({ rating, feedback }: { rating: number; feedback: string }) => {
      await api.post(`/tickets/${ticketId}/rate`, { rating, feedback });
    },
    onSuccess: () => {
      setSubmitted(true);
      onSuccess?.();
    },
  });

  if (submitted) {
    return (
      <Card className="mt-4 border-green-200 bg-green-50">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-green-700">
            Thank you for your feedback! You rated this ticket {existing?.rating ?? rating}/5.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent className="py-4">
        <p className="mb-2 text-sm font-medium text-foreground">
          How would you rate your experience?
        </p>
        <div className="mb-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`h-8 w-8 rounded-md text-lg transition-colors ${
                star <= rating ? 'bg-yellow-400 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          placeholder="Any additional feedback? (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="mb-3 w-full rounded-lg border border-border p-2 text-sm"
          rows={2}
        />
        <Button
          size="sm"
          disabled={rating === 0 || mutation.isPending}
          onClick={() => mutation.mutate({ rating, feedback })}
        >
          {mutation.isPending ? 'Submitting...' : 'Submit feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}
