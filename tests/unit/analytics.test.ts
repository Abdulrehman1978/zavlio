import { describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_BATCH_MAX,
  createAnalyticsClient,
  createEventId,
  isUuid,
  normalizeSource,
  sanitizeContext,
  sanitizeMetadata,
  sanitizePagePath,
  sanitizeReferrer,
  validateEvent,
} from '@zavlio/analytics';

describe('Packet 08 analytics contracts', () => {
  it('creates random UUID event identifiers and validates UUIDs', () => {
    const id = createEventId();
    expect(isUuid(id)).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
  });

  it('normalizes attribution without retaining query secrets', () => {
    expect(normalizeSource(undefined, 'https://l.instagram.com/?token=secret')).toBe('instagram');
    expect(normalizeSource('Google', undefined)).toBe('google');
    expect(normalizeSource(undefined, undefined)).toBe('direct');
    expect(sanitizeReferrer('https://example.test/work?email=person@example.test')).toBe(
      'https://example.test/work',
    );
    expect(sanitizePagePath('/work/nova?token=secret#section')).toBe('/work/nova');
    expect(sanitizePagePath('/crm')).toBeUndefined();
  });

  it('sanitizes context and enforces event metadata allowlists', () => {
    expect(
      sanitizeContext({
        pagePath: '/services',
        utmSource: ' Instagram ',
        deviceCategory: 'mobile',
      }),
    ).toEqual({
      pagePath: '/services',
      referrer: undefined,
      utmSource: 'instagram',
      utmMedium: undefined,
      utmCampaign: undefined,
      utmTerm: undefined,
      utmContent: undefined,
      deviceCategory: 'mobile',
      country: undefined,
    });
    expect(sanitizeMetadata('cta_clicked', { ctaId: 'hero', destination: '/contact' })).toEqual({
      ctaId: 'hero',
      destination: '/contact',
    });
    expect(() => sanitizeMetadata('cta_clicked', { email: 'person@example.test' })).toThrow();
    expect(() =>
      validateEvent({
        id: createEventId(),
        name: 'unknown_event',
        occurredAt: new Date().toISOString(),
        metadata: {},
      }),
    ).toThrow();
  });

  it('does not queue before consent and uses a bounded consent-gated client queue', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createAnalyticsClient({ batchMax: ANALYTICS_BATCH_MAX });
    expect(client.track('page_viewed', {}, '/')).toBe(false);
    expect(await client.setConsent('ANALYTICS_ALLOWED')).toBe(true);
    expect(client.track('page_viewed', {}, '/')).toBe(true);
    await client.flush();
    expect(fetchMock).toHaveBeenCalled();
    await client.setConsent('WITHDRAWN');
    expect(client.track('page_viewed', {}, '/')).toBe(false);
    client.destroy();
  });
});
