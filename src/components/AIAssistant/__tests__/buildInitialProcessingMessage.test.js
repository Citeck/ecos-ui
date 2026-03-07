import { buildInitialProcessingMessage } from '../hooks/useUniversalChat';
import { MESSAGE_TYPES } from '../constants';

jest.mock('../utils', () => ({
  generateUUID: jest.fn(() => 'test-uuid')
}));

describe('buildInitialProcessingMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('agent progress (initialProgress.type starts with agent_)', () => {
    it('creates agent progress message for agent_planning', () => {
      const data = {
        initialProgress: {
          type: 'agent_planning',
          message: 'Analyzing request...'
        }
      };

      const result = buildInitialProcessingMessage(data);

      expect(result.isProcessing).toBe(true);
      expect(result.pollingIsUsed).toBe(true);
      expect(result.isAgentProgressContent).toBe(true);
      expect(result.messageData.type).toBe('agent_planning');
      expect(result.messageData.message).toBe('Analyzing request...');
      expect(result).not.toHaveProperty('isBusinessAppContent');
      expect(result).not.toHaveProperty('text');
    });

    it('creates agent progress message for agent_execution with step data', () => {
      const data = {
        initialProgress: {
          type: 'agent_execution',
          currentStepId: 'step-1',
          currentStepDescription: 'Generating data type',
          completedSteps: 0,
          totalSteps: 5,
          overallProgress: 10,
          message: 'Starting execution...'
        }
      };

      const result = buildInitialProcessingMessage(data);

      expect(result.isAgentProgressContent).toBe(true);
      expect(result.messageData.type).toBe('agent_execution');
      expect(result.messageData.currentStepId).toBe('step-1');
      expect(result.messageData.currentStepDescription).toBe('Generating data type');
      expect(result.messageData.completedSteps).toBe(0);
      expect(result.messageData.totalSteps).toBe(5);
      expect(result.messageData.overallProgress).toBe(10);
      expect(result.messageData.message).toBe('Starting execution...');
    });

    it('handles agent progress with minimal data', () => {
      const data = {
        initialProgress: {
          type: 'agent_planning'
        }
      };

      const result = buildInitialProcessingMessage(data);

      expect(result.isAgentProgressContent).toBe(true);
      expect(result.messageData.type).toBe('agent_planning');
      expect(result.messageData.message).toBeUndefined();
    });
  });

  describe('business app progress (backward compatibility)', () => {
    it('creates business app message when initialProgress.type is business_app_generation', () => {
      const data = {
        initialProgress: {
          type: 'business_app_generation',
          stage: 'ANALYZING',
          progress: 10,
          message: 'Analyzing request...'
        }
      };

      const result = buildInitialProcessingMessage(data);

      expect(result.isBusinessAppContent).toBe(true);
      expect(result.messageData.type).toBe(MESSAGE_TYPES.BUSINESS_APP_GENERATION);
      expect(result.messageData.stage).toBe('ANALYZING');
      expect(result.messageData.progress).toBe(10);
      expect(result.messageData.message).toBe('Analyzing request...');
      expect(result).not.toHaveProperty('isAgentProgressContent');
    });

    it('creates business app message with legacy detectedIntent fallback', () => {
      const data = {
        detectedIntent: 'BUSINESS_APP_GENERATION',
        initialProgress: {
          stage: 'ANALYZING',
          progress: 5,
          message: 'Starting...'
        }
      };

      const result = buildInitialProcessingMessage(data);

      expect(result.isBusinessAppContent).toBe(true);
      expect(result.messageData.type).toBe(MESSAGE_TYPES.BUSINESS_APP_GENERATION);
      expect(result.messageData.stage).toBe('ANALYZING');
    });
  });

  describe('generic processing message', () => {
    it('creates generic message when no initialProgress', () => {
      const data = {};

      const result = buildInitialProcessingMessage(data);

      expect(result.isProcessing).toBe(true);
      expect(result.pollingIsUsed).toBe(true);
      expect(result.text).toBe('Запрос обрабатывается. Это может занять некоторое время...');
      expect(result).not.toHaveProperty('isAgentProgressContent');
      expect(result).not.toHaveProperty('isBusinessAppContent');
    });

    it('creates generic message when initialProgress has no type and no detectedIntent', () => {
      const data = {
        initialProgress: {
          stage: 'PROCESSING'
        }
      };

      const result = buildInitialProcessingMessage(data);

      expect(result.text).toBe('Запрос обрабатывается. Это может занять некоторое время...');
    });

    it('creates generic message when detectedIntent is not BUSINESS_APP_GENERATION', () => {
      const data = {
        detectedIntent: 'GENERAL',
        initialProgress: {
          stage: 'PROCESSING'
        }
      };

      const result = buildInitialProcessingMessage(data);

      expect(result.text).toBe('Запрос обрабатывается. Это может занять некоторое время...');
    });
  });

  describe('common properties', () => {
    it('all messages have base properties', () => {
      const data = {};
      const result = buildInitialProcessingMessage(data);

      expect(result.id).toBe('test-uuid');
      expect(result.sender).toBe('ai');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.isProcessing).toBe(true);
      expect(result.pollingIsUsed).toBe(true);
    });
  });
});
