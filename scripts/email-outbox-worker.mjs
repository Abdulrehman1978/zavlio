import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('[outbox-worker] SUPABASE_SERVICE_ROLE_KEY is required.');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const isDaemon = args.includes('--daemon');
const isDryRun = args.includes('--dry-run');
const limit = Number(args[args.indexOf('--limit') + 1]) || 50;

console.log(
  JSON.stringify({
    event: 'outbox_worker_started',
    mode: isDaemon ? 'daemon' : 'single_batch',
    dryRun: isDryRun,
    limit,
    time: new Date().toISOString(),
  }),
);

async function processBatch() {
  const now = new Date().toISOString();

  // Find eligible outbox messages
  const { data: rows, error } = await db
    .from('email_outbox')
    .select('*')
    .in('status', ['PENDING', 'RETRY_WAIT'])
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error(JSON.stringify({ error: error.message }));
    return 0;
  }

  if (!rows || rows.length === 0) {
    return 0;
  }

  let processed = 0;

  for (const row of rows) {
    console.log(
      JSON.stringify({
        event: 'processing_outbox_item',
        id: row.id,
        recipient: row.recipient,
        template: row.template,
        attempt: row.attempt_count + 1,
      }),
    );

    if (isDryRun) {
      processed += 1;
      continue;
    }

    try {
      // In local/test development, simulate successful delivery to Mailpit or synthetic provider
      const providerMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const { error: updateError } = await db
        .from('email_outbox')
        .update({
          status: 'SENT',
          provider_message_id: providerMessageId,
          attempt_count: row.attempt_count + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      if (updateError) throw updateError;
      processed += 1;
    } catch (deliveryError) {
      const nextAttempt = row.attempt_count + 1;
      const isFinalFailure = nextAttempt >= 5;
      const backoffSeconds = nextAttempt * 60;
      const nextScheduled = new Date(Date.now() + backoffSeconds * 1000).toISOString();

      await db
        .from('email_outbox')
        .update({
          status: isFinalFailure ? 'FAILED' : 'RETRY_WAIT',
          attempt_count: nextAttempt,
          scheduled_at: isFinalFailure ? row.scheduled_at : nextScheduled,
          last_attempted_at: new Date().toISOString(),
          error: deliveryError instanceof Error ? deliveryError.message : 'Delivery error',
        })
        .eq('id', row.id);

      console.error(
        JSON.stringify({
          event: 'outbox_delivery_failed',
          id: row.id,
          attempt: nextAttempt,
          status: isFinalFailure ? 'FAILED' : 'RETRY_WAIT',
        }),
      );
    }
  }

  return processed;
}

if (isDaemon) {
  while (true) {
    const count = await processBatch();
    const sleepMs = count > 0 ? 1000 : 5000;
    await new Promise((r) => setTimeout(r, sleepMs));
  }
} else {
  const count = await processBatch();
  console.log(
    JSON.stringify({
      event: 'outbox_worker_completed',
      processed: count,
      time: new Date().toISOString(),
    }),
  );
  process.exit(0);
}
