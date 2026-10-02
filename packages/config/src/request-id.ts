const requestIdPattern = /^[a-zA-Z0-9._:-]{8,128}$/;

export function createRequestId(candidate?: string): string {
  return candidate && requestIdPattern.test(candidate) ? candidate : crypto.randomUUID();
}
