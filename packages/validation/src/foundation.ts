import { z } from 'zod';
export const requestIdSchema = z.string().regex(/^[a-zA-Z0-9._:-]{8,128}$/);
