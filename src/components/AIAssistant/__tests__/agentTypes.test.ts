import { MESSAGE_TYPES } from '../constants';
import { AGENT_STATUSES } from '../types';

describe('Agent mode constants and types', () => {
  describe('MESSAGE_TYPES', () => {
    it('contains AGENT_PLANNING type', () => {
      expect(MESSAGE_TYPES.AGENT_PLANNING).toBe('agent_planning');
    });

    it('contains AGENT_EXECUTION type', () => {
      expect(MESSAGE_TYPES.AGENT_EXECUTION).toBe('agent_execution');
    });

    it('preserves existing message types', () => {
      expect(MESSAGE_TYPES.TEXT).toBe('text');
      expect(MESSAGE_TYPES.EMAIL).toBe('email');
      expect(MESSAGE_TYPES.TEXT_EDITING).toBe('text_editing');
      expect(MESSAGE_TYPES.SCRIPT_WRITING).toBe('script_writing');
      expect(MESSAGE_TYPES.BUSINESS_APP_GENERATION).toBe('business_app_generation');
    });
  });

  describe('AGENT_STATUSES', () => {
    it('contains all agent status values', () => {
      expect(AGENT_STATUSES.PLANNING).toBe('PLANNING');
      expect(AGENT_STATUSES.WAITING_PLAN_APPROVAL).toBe('WAITING_PLAN_APPROVAL');
      expect(AGENT_STATUSES.EXECUTING).toBe('EXECUTING');
      expect(AGENT_STATUSES.WAITING_STEP_APPROVAL).toBe('WAITING_STEP_APPROVAL');
      expect(AGENT_STATUSES.COMPLETED).toBe('COMPLETED');
      expect(AGENT_STATUSES.FAILED).toBe('FAILED');
    });

    it('has exactly 6 status values', () => {
      expect(Object.keys(AGENT_STATUSES)).toHaveLength(6);
    });
  });
});
