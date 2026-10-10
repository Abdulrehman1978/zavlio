'use client';

import { useState } from 'react';
import { Button, Card, Badge } from '@zavlio/ui';
import { useAnalytics } from './analytics-provider';

export function CookieManager() {
  const analytics = useAnalytics();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const consentState = analytics?.getConsent() || 'UNKNOWN';

  const handleUpdate = async (state: 'ANALYTICS_ALLOWED' | 'ANALYTICS_DENIED' | 'WITHDRAWN') => {
    if (!analytics) return;
    setBusy(true);
    setFeedback(null);
    try {
      await analytics.setConsent(state);
      setFeedback(
        state === 'ANALYTICS_ALLOWED'
          ? 'Analytics cookies accepted.'
          : state === 'WITHDRAWN'
            ? 'Analytics consent withdrawn and historical cookies cleared.'
            : 'Non-essential analytics rejected.',
      );
    } catch {
      setFeedback('Failed to update preferences. Please retry.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card hover={false} className="p-8 sm:p-10 space-y-6 bg-[#FFFFFF]">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D8D4CA]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#646059] block">
            Current Consent State
          </span>
          <strong className="font-mono text-base text-[#0D0D0D]">{consentState}</strong>
        </div>
        <Badge variant={consentState === 'ANALYTICS_ALLOWED' ? 'accent' : 'default'}>
          {consentState === 'ANALYTICS_ALLOWED' ? 'ANALYTICS ACTIVE' : 'ANALYTICS BLOCKED'}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-[#FAF8F4] border border-[#D8D4CA]/80 space-y-1">
          <strong className="text-sm font-sans text-[#0D0D0D] block">
            Category 1: Strictly Essential Cookies
          </strong>
          <p className="text-xs text-[#646059]">
            Required for secure navigation, CSRF protection, and storing your consent preference (
            <code className="font-mono">zv_consent</code>). Always active. Cannot be disabled.
          </p>
        </div>

        <div className="p-4 bg-[#FAF8F4] border border-[#D8D4CA]/80 space-y-1">
          <strong className="text-sm font-sans text-[#0D0D0D] block">
            Category 2: First-Party Anonymous Analytics
          </strong>
          <p className="text-xs text-[#646059]">
            Helps us understand which case studies and capabilities are read (
            <code className="font-mono">zv_vid</code>, <code className="font-mono">zv_sid</code>).
            No third-party sharing, no advertising networks.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          variant="primary"
          size="default"
          disabled={busy || consentState === 'ANALYTICS_ALLOWED'}
          onClick={() => void handleUpdate('ANALYTICS_ALLOWED')}
        >
          Accept Analytics
        </Button>
        <Button
          variant="secondary"
          size="default"
          disabled={busy || consentState === 'ANALYTICS_DENIED'}
          onClick={() => void handleUpdate('ANALYTICS_DENIED')}
        >
          Reject Non-Essential
        </Button>
        <Button
          variant="outline"
          size="default"
          disabled={busy || consentState !== 'ANALYTICS_ALLOWED'}
          onClick={() => void handleUpdate('WITHDRAWN')}
        >
          Withdraw Consent
        </Button>
      </div>

      {feedback && (
        <p
          className="font-mono text-xs text-[#0D0D0D] p-3 bg-[#F0EDE4] border border-[#D8D4CA]"
          role="status"
        >
          {feedback}
        </p>
      )}
    </Card>
  );
}
