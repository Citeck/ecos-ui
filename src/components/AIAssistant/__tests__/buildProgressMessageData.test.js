import { buildProgressMessageData } from '../hooks/useUniversalChat';
import { MESSAGE_TYPES } from '../constants';

describe('buildProgressMessageData', () => {
  describe('agent progress types', () => {
    it('returns agent progress fields for agent_planning type', () => {
      const progress = {
        type: 'agent_planning'
      };

      const result = buildProgressMessageData(progress);

      expect(result.isAgent).toBe(true);
      expect(result.messageFields.isAgentProgressContent).toBe(true);
      expect(result.messageFields.messageData.type).toBe('agent_planning');
      expect(result.messageFields).not.toHaveProperty('isBusinessAppContent');
    });

    it('returns agent progress fields for agent_execution type with step data', () => {
      const steps = [
        { id: 'step-1', description: 'Create data type', status: 'COMPLETED' },
        { id: 'step-2', description: 'Create form', status: 'IN_PROGRESS' },
        { id: 'step-3', description: 'Deploy', status: 'PENDING' }
      ];
      const progress = {
        type: 'agent_execution',
        currentStepId: 'step-2',
        currentStepDescription: 'Create form',
        completedSteps: 1,
        totalSteps: 3,
        overallProgress: 33,
        steps
      };

      const result = buildProgressMessageData(progress);

      expect(result.isAgent).toBe(true);
      expect(result.messageFields.isAgentProgressContent).toBe(true);
      expect(result.messageFields.messageData).toEqual({
        type: 'agent_execution',
        currentStepId: 'step-2',
        currentStepDescription: 'Create form',
        completedSteps: 1,
        totalSteps: 3,
        overallProgress: 33,
        steps
      });
    });

    it('handles agent_execution with minimal data', () => {
      const progress = {
        type: 'agent_execution'
      };

      const result = buildProgressMessageData(progress);

      expect(result.isAgent).toBe(true);
      expect(result.messageFields.isAgentProgressContent).toBe(true);
      expect(result.messageFields.messageData.type).toBe('agent_execution');
      expect(result.messageFields.messageData.currentStepId).toBeUndefined();
      expect(result.messageFields.messageData.steps).toBeUndefined();
    });
  });

  describe('business app progress (backward compatibility)', () => {
    it('returns business app fields for progress without type', () => {
      const progress = {
        stage: 'GENERATING_DATA_TYPES',
        progress: 30,
        message: 'Generating data types...',
        detailedStatus: 'Processing 2 of 5',
        stageMetadata: { current: 2, total: 5 },
        currentAttempt: 1,
        maxAttempts: 3
      };

      const result = buildProgressMessageData(progress);

      expect(result.isAgent).toBe(false);
      expect(result.messageFields.isBusinessAppContent).toBe(true);
      expect(result.messageFields.messageData).toEqual({
        type: MESSAGE_TYPES.BUSINESS_APP_GENERATION,
        stage: 'GENERATING_DATA_TYPES',
        progress: 30,
        message: 'Generating data types...',
        detailedStatus: 'Processing 2 of 5',
        stageMetadata: { current: 2, total: 5 },
        currentAttempt: 1,
        maxAttempts: 3
      });
      expect(result.messageFields).not.toHaveProperty('isAgentProgressContent');
    });

    it('returns business app fields for non-agent type', () => {
      const progress = {
        type: 'business_app_generation',
        stage: 'COMPLETED',
        progress: 100,
        message: 'Done'
      };

      const result = buildProgressMessageData(progress);

      expect(result.isAgent).toBe(false);
      expect(result.messageFields.isBusinessAppContent).toBe(true);
    });

    it('returns business app fields for empty progress', () => {
      const progress = {};

      const result = buildProgressMessageData(progress);

      expect(result.isAgent).toBe(false);
      expect(result.messageFields.isBusinessAppContent).toBe(true);
    });
  });
});
