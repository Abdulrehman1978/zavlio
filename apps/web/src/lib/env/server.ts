import 'server-only';
import { parseServerEnv } from '@zavlio/validation/env';

export const serverEnv = parseServerEnv(process.env);
