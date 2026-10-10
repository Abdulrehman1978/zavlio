import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const crmPersonPatchSchema = z.object({
  displayName: optionalText(120),
  jobTitle: optionalText(160),
  primaryPhone: optionalText(60),
  organizationId: z.uuid().nullable().optional(),
});

export const crmOrganizationPatchSchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: optionalText(500),
  industry: optionalText(120),
  sizeRange: optionalText(80),
  country: optionalText(80),
  notes: optionalText(5000),
});

export const crmNoteSchema = z.object({
  body: z.string().trim().min(1).max(10000),
  visibility: z.literal('INTERNAL').default('INTERNAL'),
});

export const crmDncSchema = z.object({ reason: z.string().trim().min(1).max(500) });

export const identityCandidateRejectSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const personMergeSchema = z.object({
  targetPersonId: z.uuid(),
  candidateId: z.uuid().optional(),
  reason: z.string().trim().min(1).max(500),
});

export const opportunityPatchSchema = z.object({
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  title: z.string().trim().min(1).max(200),
  estimatedValue: z
    .string()
    .regex(/^\d{1,12}(\.\d{1,2})?$/)
    .nullable(),
  currency: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Za-z]{3}$/),
  probability: z.number().min(0).max(100).nullable(),
  serviceInterests: z.array(z.string().trim().min(1).max(80)).max(20),
  ownerId: z.uuid().nullable(),
  expectedCloseDate: z.iso.date().nullable(),
});

export const opportunityTransitionSchema = z.object({
  targetStageId: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  reason: z.string().trim().max(500).optional(),
  lostReason: z
    .enum(['BUDGET', 'TIMING', 'NO_RESPONSE', 'COMPETITOR', 'NOT_FIT', 'INTERNAL', 'OTHER'])
    .optional(),
});

export const taskCreateSchema = z.object({
  personId: z.uuid().nullable(),
  opportunityId: z.uuid().nullable(),
  assignedTo: z.uuid().nullable(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10000).nullable(),
  dueAt: z.iso.datetime({ offset: true }).nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
});

export const taskUpdateSchema = taskCreateSchema
  .omit({ personId: true, opportunityId: true })
  .extend({
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  });

export const contentItemCreateSchema = z.object({
  type: z.enum(['services', 'projects', 'lab_projects', 'insights']),
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  summary: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  visibility: z.enum(['PUBLIC', 'INTERNAL']).default('PUBLIC'),
  claimStatus: z.enum(['DEMO', 'UNVERIFIED', 'VERIFIED', 'RETIRED']).optional().nullable(),
  demoContent: z.boolean().default(false),
  seoTitle: z.string().trim().max(160).optional().nullable(),
  seoDescription: z.string().trim().max(300).optional().nullable(),
});

export const contentItemUpdateSchema = contentItemCreateSchema.extend({
  id: z.uuid(),
});

export const campaignCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum([
    'OUTREACH_MANUAL',
    'CONTENT_PROMOTION',
    'RESEARCH_COHORT',
    'EVENT_INVITATION',
    'PARTNERSHIP',
  ]),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).default('DRAFT'),
  startsAt: z.iso.datetime({ offset: true }).optional().nullable(),
  endsAt: z.iso.datetime({ offset: true }).optional().nullable(),
  audienceDefinition: z.record(z.string(), z.unknown()).default({}),
});

export const campaignUpdateSchema = campaignCreateSchema.extend({
  id: z.uuid(),
});

export const campaignMemberAddSchema = z.object({
  campaignId: z.uuid(),
  personId: z.uuid(),
  status: z
    .enum(['ADDED', 'CONTACTED', 'RESPONDED', 'QUALIFIED', 'OPTED_OUT', 'EXCLUDED'])
    .default('ADDED'),
});

export const privacyRequestCreateSchema = z.object({
  personId: z.uuid(),
  requestType: z.enum(['EXPORT', 'CORRECTION', 'ANONYMIZATION']),
  verifiedIdentity: z
    .boolean()
    .refine(
      (val) => val === true,
      'Identity verification is required before initiating a privacy request',
    ),
  notes: z.string().trim().max(1000).optional().nullable(),
});
