import { describe, expect, it } from 'vitest';
import { formatCliError } from './errors.js';

describe('formatCliError', () => {
  it('explains Google ADC invalid_rapt reauthorization errors', () => {
    const message = '{"error":"invalid_grant","error_description":"reauth related error (invalid_rapt)","error_subtype":"invalid_rapt"}';

    expect(formatCliError(new Error(message))).toContain('gcloud auth application-default login');
    expect(formatCliError(new Error(message))).toContain('Google Cloud authentication needs reauthorization');
  });
});
