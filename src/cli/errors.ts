export function formatCliError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (isGoogleReauthError(message)) {
    return [
      'Google Cloud authentication needs reauthorization (invalid_rapt).',
      'Run: gcloud auth application-default login',
      'If your org blocks local reauth, set GOOGLE_APPLICATION_CREDENTIALS to a service account key.',
      `Original error: ${message}`,
    ].join('\n');
  }
  return message;
}

function isGoogleReauthError(message: string): boolean {
  return message.includes('invalid_rapt') || (message.includes('invalid_grant') && message.includes('reauth'));
}
