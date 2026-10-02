import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) throw new Error('Local Supabase URL and service-role key are required.');
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(url))
  throw new Error('This provisioner is local-only.');

const agentKey = process.argv[2] ?? 'meta-bridge-local';
const name = process.argv[3] ?? 'Local Meta Bridge';
if (!/^[a-z0-9][a-z0-9._-]{1,99}$/i.test(agentKey)) throw new Error('Invalid agent key.');

const db = createClient(url, service, { auth: { persistSession: false } });
const { data, error } = await db
  .from('automation_agents')
  .upsert(
    {
      agent_key: agentKey,
      name,
      enabled: true,
      status: 'OFFLINE',
      host: '127.0.0.1',
      capabilities: { channels: ['INTERNAL'], actions: ['NOOP'], executionModes: ['DRY_RUN_ONLY'] },
    },
    { onConflict: 'agent_key' },
  )
  .select('id,agent_key,name,enabled')
  .single();
if (error) throw error;

const keyId = 'local-' + new Date().toISOString().slice(0, 10);
const secret = randomBytes(32).toString('base64url');
process.stdout.write(
  JSON.stringify(
    {
      agent: data,
      note: 'Secret generated once and not stored in PostgreSQL. Put it only in server and bridge process environments.',
      server: {
        AUTOMATION_MACHINE_KEYS_JSON: JSON.stringify({
          [agentKey]: { current: { keyId, secret }, previous: [] },
        }),
      },
      bridge: {
        ZAVLIO_AGENT_KEY: agentKey,
        ZAVLIO_MACHINE_KEY_ID: keyId,
        ZAVLIO_MACHINE_HMAC_SECRET: secret,
      },
    },
    null,
    2,
  ) + '\n',
);
