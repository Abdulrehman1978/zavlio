import { cookies } from 'next/headers';
import { contactPayloadSchema } from '@zavlio/validation';
import { intakeLeadSubmission } from '../../../../lib/intake/orchestration';
import { verifyTurnstile } from '../../../../lib/intake/turnstile';
import { readFormBody, rejectJson, successJson } from '../../../../lib/intake/http';

export async function POST(request: Request) {
  const parsedBody = await readFormBody(request);
  if (parsedBody.response) return parsedBody.response;
  const parsed = contactPayloadSchema.safeParse(parsedBody.body);
  if (!parsed.success) return rejectJson(400, 'Please check the highlighted form fields.');
  if (parsed.data.honeypot) return successJson({ ok: true }, 202);
  if (!(await verifyTurnstile(parsed.data.turnstileToken)))
    return rejectJson(403, 'We could not verify this submission.');
  try {
    const cookieStore = await cookies();
    const result = await intakeLeadSubmission({
      payload: parsed.data,
      visitorCookie: cookieStore.get('zv_vid')?.value,
      consentCookie: cookieStore.get('zv_consent')?.value,
      referer: request.headers.get('referer') ?? undefined,
    });
    return successJson(
      { ok: true, submissionId: result.submissionId },
      result.duplicate ? 200 : 201,
    );
  } catch {
    return rejectJson(500, "We couldn't submit your enquiry. Please try again.");
  }
}
