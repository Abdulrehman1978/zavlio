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
