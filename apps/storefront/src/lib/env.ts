import 'server-only';

/**
 * Server-only settings. Read here, never with a NEXT_PUBLIC_ prefix, so they cannot
 * reach the browser. The V2 API settings (base URL, credentials) will be added here.
 */
export interface ServerEnv {
  dataSource: 'local';
}

/**
 * Reads and checks the server settings. Fails with a clear message instead of
 * starting with an unusable configuration.
 */
export function readServerEnv(
  env: Readonly<Record<string, string | undefined>> = process.env,
): ServerEnv {
  const value = env.DATA_SOURCE?.trim() || 'local';

  if (value === 'local') return { dataSource: 'local' };
  if (value === 'api') {
    throw new Error(
      'DATA_SOURCE=api is planned for V2 and is not available yet. Use DATA_SOURCE=local or leave it unset.',
    );
  }
  throw new Error(`Unknown DATA_SOURCE "${value}". Use "local" or leave it unset.`);
}
