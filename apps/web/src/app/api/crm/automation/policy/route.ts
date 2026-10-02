import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';
const schema = z.object({ name: z.string().trim().min(3).max(120), enabled: z.boolean() });
export async function POST(request: Request) {
  try {
    await requireRole('OWNER');
    const b = schema.parse(await request.json());
    const db = await createServerSupabaseClient();
    const configuration = {
      enabled: b.enabled,
      dryRun: true,
      approvalRequired: true,
      allowedChannels: ['EMAIL', 'INSTAGRAM', 'THREADS', 'FACEBOOK', 'LINKEDIN', 'INTERNAL'],
      allowedActions: [
        'SEND_EMAIL',
        'DM',
        'REPLY',
        'COMMENT',
        'LIKE',
        'FOLLOW',
        'CONNECT',
        'PUBLISH',
        'CREATE_TASK',
        'FLAG_FOR_REVIEW',
        'NOOP',
      ],
      allowedPurposes: [
        'MARKETING',
        'SALES_FOLLOW_UP',
        'INBOUND_REPLY',
        'TRANSACTIONAL',
        'RELATIONSHIP',
        'INTERNAL',
      ],
      workingHours: {
        enabled: true,
        timezone: 'Asia/Kolkata',
        weekdays: [1, 2, 3, 4, 5],
        start: '09:00',
        end: '18:00',
      },
      cooldownMinutes: 4320,
      personDailyCap: 1,
      personWeeklyCap: 3,
      channelHourlyCaps: {},
      actionHourlyCaps: {},
      duplicateWindowMinutes: 4320,
      approvalValidityMinutes: 1440,
      leaseSeconds: 300,
      maxAttempts: 3,
      retryBackoffSeconds: [60, 300, 1800],
    };
    const { data, error } = await db.rpc('activate_automation_policy', {
      p_configuration: configuration,
      p_name: b.name,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, policy: data[0] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Policy activation failed.' },
      { status: 400 },
    );
  }
}
