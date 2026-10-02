import { parseBridgeEnv } from './env.js';
import { createBridgeRuntime } from './runtime.js';
try {
  const runtime = createBridgeRuntime({ env: parseBridgeEnv(process.env) });
  await runtime.start();
  let stopping: Promise<void> | undefined;
  const shutdown = () => {
    stopping ??= runtime.stop().finally(() => process.exit(0));
  };
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, shutdown);
  if (process.send)
    process.once('message', (message: unknown) => {
      if (
        message &&
        typeof message === 'object' &&
        'type' in message &&
        message.type === 'shutdown'
      )
        shutdown();
    });
} catch (error) {
  process.stderr.write(
    JSON.stringify({
      component: 'meta-bridge',
      event: 'BRIDGE_START_FAILED',
      code: error instanceof Error ? error.name : 'UNKNOWN',
    }) + '\n',
  );
  process.exitCode = 1;
}
