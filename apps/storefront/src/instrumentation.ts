// Runs once when the server starts. Invalid settings stop the server immediately
// instead of failing on the first request.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { readServerEnv } = await import('./lib/env');
    readServerEnv();
  }
}
