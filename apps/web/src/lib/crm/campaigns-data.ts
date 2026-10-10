import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@zavlio/db/database.types';

export interface CampaignRow {
  id: string;
  name: string;
  type: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  audience_definition: Record<string, unknown>;
  member_count: number;
  suppressed_count: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignMemberRow {
  campaign_id: string;
  person_id: string;
  status: string;
  added_at: string;
  person_name: string;
  person_email: string | null;
  do_not_contact: boolean;
  lifecycle_stage: string;
}

export async function listCampaigns(
  db: SupabaseClient<Database>,
  status?: string,
  search?: string,
): Promise<{ count: number; rows: CampaignRow[] }> {
  let query = db.from('campaigns').select('*', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status.toUpperCase());
  }

  if (search && search.trim().length > 0) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  query = query.order('created_at', { ascending: false }).limit(100);

  const { data: campaigns, count, error } = await query;
  if (error) throw error;

  const campaignIds = (campaigns || []).map((c) => c.id);

  // Fetch member stats for these campaigns
  const memberCounts: Record<string, { total: number; suppressed: number }> = {};

  if (campaignIds.length > 0) {
    const { data: members } = await db
      .from('campaign_members')
      .select('campaign_id, person_id, people(do_not_contact)')
      .in('campaign_id', campaignIds);

    if (members) {
      for (const m of members) {
        const cid = m.campaign_id;
        if (!memberCounts[cid]) {
          memberCounts[cid] = { total: 0, suppressed: 0 };
        }
        memberCounts[cid].total += 1;
        const person = m.people as unknown as { do_not_contact?: boolean } | null;
        if (person?.do_not_contact) {
          memberCounts[cid].suppressed += 1;
        }
      }
    }
  }

  const rows: CampaignRow[] = (campaigns || []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    status: c.status,
    starts_at: c.starts_at,
    ends_at: c.ends_at,
    audience_definition: (c.audience_definition as Record<string, unknown>) || {},
    member_count: memberCounts[c.id]?.total ?? 0,
    suppressed_count: memberCounts[c.id]?.suppressed ?? 0,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));

  return {
    count: count ?? rows.length,
    rows,
  };
}

export async function getCampaignMembers(
  db: SupabaseClient<Database>,
  campaignId: string,
): Promise<CampaignMemberRow[]> {
  const { data, error } = await db
    .from('campaign_members')
    .select(
      `
      campaign_id,
      person_id,
      status,
      added_at,
      people!inner(id, display_name, primary_email, do_not_contact, lifecycle_stage)
    `,
    )
    .eq('campaign_id', campaignId)
    .order('added_at', { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data || []).map((row) => {
    const p = row.people as unknown as {
      display_name: string;
      primary_email: string | null;
      do_not_contact: boolean;
      lifecycle_stage: string;
    };
    return {
      campaign_id: row.campaign_id,
      person_id: row.person_id,
      status: row.status,
      added_at: row.added_at,
      person_name: p.display_name || 'Unnamed',
      person_email: p.primary_email || null,
      do_not_contact: Boolean(p.do_not_contact),
      lifecycle_stage: p.lifecycle_stage || 'IDENTIFIED',
    };
  });
}
