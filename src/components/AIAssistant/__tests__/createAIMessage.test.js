import { createAIMessage } from '../hooks/useUniversalChat';
import { AGENT_STATUSES } from '../types';
import { MESSAGE_TYPES } from '../constants';

jest.mock('../utils', () => ({
  generateUUID: jest.fn(() => 'test-uuid')
}));

describe('createAIMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('agent mode messages', () => {
    it('creates agent plan message for WAITING_PLAN_APPROVAL', () => {
      const responseData = {
        message: '## Plan\nStep 1...',
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentPlanContent).toBe(true);
      expect(result.sender).toBe('ai');
      expect(result.messageData.agentStatus).toBe('WAITING_PLAN_APPROVAL');
      expect(result.messageData.message).toBe('## Plan\nStep 1...');
      expect(result).not.toHaveProperty('isAgentProgressContent');
    });

    it('creates agent plan message for WAITING_STEP_APPROVAL', () => {
      const responseData = {
        message: 'Confirm step?',
        agentStatus: AGENT_STATUSES.WAITING_STEP_APPROVAL
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentPlanContent).toBe(true);
      expect(result.messageData.agentStatus).toBe('WAITING_STEP_APPROVAL');
    });

    it('creates agent plan message for COMPLETED with artifacts', () => {
      const artifacts = [
        { name: 'DataType', url: '/v2/dashboard?ref=...', type: { displayName: 'Тип данных', icon: 'fa-database' } }
      ];
      const responseData = {
        message: '## Done\nAll artifacts created.',
        agentStatus: AGENT_STATUSES.COMPLETED,
        artifacts
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentPlanContent).toBe(true);
      expect(result.messageData.agentStatus).toBe('COMPLETED');
      expect(result.messageData.artifacts).toEqual(artifacts);
    });

    it('creates agent plan message for COMPLETED without artifacts', () => {
      const responseData = {
        message: 'Completed.',
        agentStatus: AGENT_STATUSES.COMPLETED
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentPlanContent).toBe(true);
      expect(result.messageData.artifacts).toBeUndefined();
    });

    it('creates agent plan message for FAILED', () => {
      const responseData = {
        message: 'Error occurred during execution.',
        agentStatus: AGENT_STATUSES.FAILED
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentPlanContent).toBe(true);
      expect(result.messageData.agentStatus).toBe('FAILED');
      expect(result.messageData.message).toBe('Error occurred during execution.');
    });

    it('creates agent progress message for PLANNING', () => {
      const responseData = {
        message: 'Analyzing request...',
        agentStatus: AGENT_STATUSES.PLANNING
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentProgressContent).toBe(true);
      expect(result.sender).toBe('ai');
      expect(result.messageData.agentStatus).toBe('PLANNING');
      expect(result).not.toHaveProperty('isAgentPlanContent');
    });

    it('creates agent progress message for EXECUTING', () => {
      const responseData = {
        message: 'Executing step 2 of 5...',
        agentStatus: AGENT_STATUSES.EXECUTING
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentProgressContent).toBe(true);
      expect(result.messageData.agentStatus).toBe('EXECUTING');
    });

    it('handles object message format for agent status', () => {
      const responseData = {
        message: { message: 'Plan text', plan: { steps: [] } },
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentPlanContent).toBe(true);
      expect(result.messageData.message).toBe('Plan text');
      expect(result.messageData.plan).toEqual({ steps: [] });
      expect(result.text).toBe('Plan text');
    });

    it('uses fallback text for progress without message', () => {
      const responseData = {
        agentStatus: AGENT_STATUSES.EXECUTING
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentProgressContent).toBe(true);
      expect(result.text).toBe('Обрабатывается...');
    });
  });

  describe('existing message types (backward compatibility)', () => {
    it('creates email message', () => {
      const responseData = {
        message: { type: MESSAGE_TYPES.EMAIL, body: 'Email body' }
      };

      const result = createAIMessage(responseData);

      expect(result.isEmailContent).toBe(true);
      expect(result.text).toBe('Email body');
    });

    it('creates text diff message', () => {
      const responseData = {
        message: { type: MESSAGE_TYPES.TEXT_EDITING, description: 'Changes' }
      };

      const result = createAIMessage(responseData);

      expect(result.isTextDiffContent).toBe(true);
    });

    it('creates script diff message', () => {
      const responseData = {
        message: { type: MESSAGE_TYPES.SCRIPT_WRITING, explanation: 'Script changes' }
      };

      const result = createAIMessage(responseData);

      expect(result.isScriptDiffContent).toBe(true);
    });

    it('creates business app message', () => {
      const responseData = {
        message: { type: MESSAGE_TYPES.BUSINESS_APP_GENERATION, message: 'Generating...' }
      };

      const result = createAIMessage(responseData);

      expect(result.isBusinessAppContent).toBe(true);
    });

    it('creates default text message', () => {
      const responseData = {
        message: 'Simple text response'
      };

      const result = createAIMessage(responseData);

      expect(result.text).toBe('Simple text response');
      expect(result).not.toHaveProperty('isEmailContent');
      expect(result).not.toHaveProperty('isAgentPlanContent');
      expect(result).not.toHaveProperty('isAgentProgressContent');
    });
  });

  describe('contextArtifacts', () => {
    it('includes contextArtifacts in agent plan message', () => {
      const contextArtifacts = [
        { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' },
        { ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }
      ];
      const responseData = {
        message: '## Plan\nStep 1...',
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL,
        contextArtifacts
      };

      const result = createAIMessage(responseData);

      expect(result.isAgentPlanContent).toBe(true);
      expect(result.messageData.contextArtifacts).toEqual(contextArtifacts);
    });

    it('includes contextArtifacts in COMPLETED agent message', () => {
      const contextArtifacts = [
        { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }
      ];
      const responseData = {
        message: 'Done.',
        agentStatus: AGENT_STATUSES.COMPLETED,
        contextArtifacts
      };

      const result = createAIMessage(responseData);

      expect(result.messageData.contextArtifacts).toEqual(contextArtifacts);
    });

    it('sets contextArtifacts undefined when not present in agent plan', () => {
      const responseData = {
        message: '## Plan',
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL
      };

      const result = createAIMessage(responseData);

      expect(result.messageData.contextArtifacts).toBeUndefined();
    });

    it('includes contextArtifacts in default text message', () => {
      const contextArtifacts = [
        { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }
      ];
      const responseData = {
        message: 'Here is some info',
        contextArtifacts
      };

      const result = createAIMessage(responseData);

      expect(result.text).toBe('Here is some info');
      expect(result.messageData).toEqual({ contextArtifacts });
    });

    it('does not add messageData for default message without contextArtifacts', () => {
      const responseData = {
        message: 'Simple text'
      };

      const result = createAIMessage(responseData);

      expect(result).not.toHaveProperty('messageData');
    });

    it('does not add messageData for default message with empty contextArtifacts', () => {
      const responseData = {
        message: 'Simple text',
        contextArtifacts: []
      };

      const result = createAIMessage(responseData);

      expect(result).not.toHaveProperty('messageData');
    });
  });
});
