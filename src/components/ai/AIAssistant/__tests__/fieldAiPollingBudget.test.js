import fs from 'fs';
import path from 'path';

import {
  FIELD_AI_POLL_INTERVAL_MAX_MS,
  FIELD_AI_POLL_INTERVAL_MIN_MS,
  FIELD_AI_POLL_RAMP_MS,
  FIELD_AI_TIMEOUT_MS,
  getFieldAiPollDelay
} from '../constants';

// D-G-FE-TIMEOUT (cases G1–G14). The three field services poll their own request rather than going
// through `usePolling`, and each held a private `MAX_POLLING_ATTEMPTS = 120` — two minutes against
// the backend's thirty. They gave up on requests that were running perfectly well, and the answer
// that arrived afterwards was kept by the server for another hour with nobody left to collect it.
describe('field AI polling budget', () => {
  it('matches the limit that actually decides the outcome', () => {
    // `REQUEST_TIMEOUT_MINUTES` in citeck-ai.
    expect(FIELD_AI_TIMEOUT_MS).toBe(30 * 60 * 1000);
  });

  describe('getFieldAiPollDelay', () => {
    it('starts at the minimum interval', () => {
      expect(getFieldAiPollDelay(0)).toBe(FIELD_AI_POLL_INTERVAL_MIN_MS);
    });

    it('reaches the maximum at the end of the ramp and stays there', () => {
      expect(getFieldAiPollDelay(FIELD_AI_POLL_RAMP_MS)).toBe(FIELD_AI_POLL_INTERVAL_MAX_MS);
      expect(getFieldAiPollDelay(FIELD_AI_POLL_RAMP_MS * 10)).toBe(FIELD_AI_POLL_INTERVAL_MAX_MS);
      expect(getFieldAiPollDelay(FIELD_AI_TIMEOUT_MS)).toBe(FIELD_AI_POLL_INTERVAL_MAX_MS);
    });

    it('grows monotonically in between', () => {
      const delays = [0, 5000, 10000, 20000, 30000].map(getFieldAiPollDelay);

      delays.forEach((delay, index) => {
        if (index > 0) {
          expect(delay).toBeGreaterThanOrEqual(delays[index - 1]);
        }
        expect(delay).toBeGreaterThanOrEqual(FIELD_AI_POLL_INTERVAL_MIN_MS);
        expect(delay).toBeLessThanOrEqual(FIELD_AI_POLL_INTERVAL_MAX_MS);
      });
    });

    it('never returns less than the minimum for a nonsensical input', () => {
      expect(getFieldAiPollDelay(-1000)).toBe(FIELD_AI_POLL_INTERVAL_MIN_MS);
    });

    // The point of the ramp: thirty minutes must not become eighteen hundred requests. A flat
    // one-second interval would; ramped to five, the whole budget costs about 364 polls — a fifth
    // of that, and a fifth of the rate the two-minute window used to run at.
    it('spends the whole budget at a fraction of the flat rate', () => {
      let waited = 0;
      let polls = 0;

      while (waited < FIELD_AI_TIMEOUT_MS) {
        waited += getFieldAiPollDelay(waited);
        polls++;
      }

      const flatRatePolls = FIELD_AI_TIMEOUT_MS / FIELD_AI_POLL_INTERVAL_MIN_MS;

      expect(polls).toBeLessThan(400);
      expect(polls).toBeLessThan(flatRatePolls / 4);
    });
  });

  // Structural, and deliberately so: the defect was three copies of one number drifting apart from
  // the limit that decides the outcome. A new copy is what this catches.
  it('is not open-coded in any of the three services', () => {
    const services = ['TextAIService.ts', 'ScriptAIService.ts', 'AIContentService.js'];

    services.forEach(file => {
      const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');

      expect(source).not.toMatch(/MAX_POLLING_ATTEMPTS\s*=/);
      expect(source).toContain('FIELD_AI_TIMEOUT_MS');
      expect(source).toContain('getFieldAiPollDelay');
    });
  });
});
