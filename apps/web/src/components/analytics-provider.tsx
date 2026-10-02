'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createAnalyticsClient, type AnalyticsClient, type ConsentState } from '@zavlio/analytics';

const AnalyticsContext = createContext<AnalyticsClient | null>(null);

export function useAnalytics(): AnalyticsClient | null {
  return useContext(AnalyticsContext);
}

function ConsentControls({
  tracker,
  consent,
}: {
  tracker: AnalyticsClient;
  consent: ConsentState;
}) {
  const [managing, setManaging] = useState(false);
  const [busy, setBusy] = useState(false);
  const choose = async (state: 'ANALYTICS_ALLOWED' | 'ANALYTICS_DENIED' | 'WITHDRAWN') => {
    setBusy(true);
    await tracker.setConsent(state);
    setBusy(false);
    setManaging(false);
  };
  if (consent === 'ANALYTICS_ALLOWED' && !managing) return null;
  return (
    <aside aria-label="Cookie preferences" className="zavlio-consent" aria-live="polite">
      <strong>Privacy choices</strong>
      <p>
        Essential functionality is always on. Optional analytics helps us understand which pages are
        useful.
      </p>
      {managing && (
        <fieldset>
          <legend>Optional categories</legend>
          <label>
            <input type="checkbox" checked readOnly /> Analytics
          </label>
          <p>Marketing and personalization are not active in this packet.</p>
        </fieldset>
      )}
      <div className="zavlio-consent-actions">
        <button type="button" disabled={busy} onClick={() => void choose('ANALYTICS_ALLOWED')}>
          Accept analytics
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void choose(consent === 'ANALYTICS_ALLOWED' ? 'WITHDRAWN' : 'ANALYTICS_DENIED')
          }
        >
          {consent === 'ANALYTICS_ALLOWED' ? 'Withdraw analytics' : 'Reject non-essential'}
        </button>
        {!managing && (
          <button type="button" disabled={busy} onClick={() => setManaging(true)}>
            Manage preferences
          </button>
        )}
      </div>
    </aside>
  );
}

export function AnalyticsProvider({
  children,
  enabled,
  debug,
}: {
  children: ReactNode;
  enabled: boolean;
  debug: boolean;
}) {
  const pathname = usePathname();
  const tracker = useMemo(() => createAnalyticsClient({ enabled, debug }), [enabled, debug]);
  const [consent, setConsent] = useState<ConsentState>(() => tracker.getConsent());
  useEffect(() => {
    return tracker.subscribe(() => setConsent(tracker.getConsent()));
  }, [tracker]);
  useEffect(() => {
    if (pathname) tracker.page(pathname);
  }, [pathname, tracker]);
  useEffect(() => () => tracker.destroy(), [tracker]);
  return (
    <AnalyticsContext.Provider value={tracker}>
      <>{children}</>
      <ConsentControls tracker={tracker} consent={consent} />
    </AnalyticsContext.Provider>
  );
}
