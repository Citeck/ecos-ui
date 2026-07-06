import { buildProgressMessageData, mergeToolSteps } from '../hooks/useUniversalChat';
import { MESSAGE_TYPES, AGENT_TOOL_STEP_PROGRESS_TYPE } from '@/components/ai/AIAssistant/constants';

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
        progress: 33,
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

  describe('config-agent tool-loop (agent_tool_step, contract #2)', () => {
    it('recognises agent_tool_step and flags it as a tool step', () => {
      const progress = {
        type: AGENT_TOOL_STEP_PROGRESS_TYPE,
        tool: 'generateForm',
        label: 'Генерация формы',
        status: 'RUNNING',
        stepIndex: 2,
        totalHint: 4,
        toolSteps: [
          { tool: 'findArtifact', label: 'Поиск артефакта', status: 'DONE', stepIndex: 1 },
          { tool: 'generateForm', label: 'Генерация формы', status: 'RUNNING', stepIndex: 2 }
        ]
      };

      const result = buildProgressMessageData(progress);

      expect(result.isAgent).toBe(true);
      expect(result.isToolStep).toBe(true);
      expect(result.messageFields.isAgentProgressContent).toBe(true);
      expect(result.messageFields).not.toHaveProperty('isBusinessAppContent');

      const md = result.messageFields.messageData;
      expect(md.type).toBe(AGENT_TOOL_STEP_PROGRESS_TYPE);
      expect(md.tool).toBe('generateForm');
      expect(md.status).toBe('RUNNING');
      expect(md.stepIndex).toBe(2);
      expect(md.totalHint).toBe(4);
      expect(md.toolSteps).toHaveLength(2);
      expect(md.toolSteps[0].stepIndex).toBe(1);
      expect(md.toolSteps[1].stepIndex).toBe(2);
    });

    it('builds a tool-step feed sorted by stepIndex from an out-of-order snapshot', () => {
      const progress = {
        type: AGENT_TOOL_STEP_PROGRESS_TYPE,
        toolSteps: [
          { tool: 'b', label: 'B', status: 'RUNNING', stepIndex: 2 },
          { tool: 'a', label: 'A', status: 'DONE', stepIndex: 1 }
        ]
      };

      const md = buildProgressMessageData(progress).messageFields.messageData;
      expect(md.toolSteps.map(s => s.stepIndex)).toEqual([1, 2]);
    });

    it('tolerates a missing toolSteps array', () => {
      const progress = { type: AGENT_TOOL_STEP_PROGRESS_TYPE, tool: 'findArtifact', stepIndex: 1, status: 'RUNNING' };
      const md = buildProgressMessageData(progress).messageFields.messageData;
      expect(md.toolSteps).toEqual([]);
    });
  });

  describe('mergeToolSteps (cumulative feed accumulation)', () => {
    it('upserts by stepIndex so later status wins (RUNNING -> DONE)', () => {
      const prev = [
        { tool: 'findArtifact', label: 'Поиск артефакта', status: 'DONE', stepIndex: 1 },
        { tool: 'generateForm', label: 'Генерация формы', status: 'RUNNING', stepIndex: 2 }
      ];
      const incoming = [{ tool: 'generateForm', label: 'Генерация формы', status: 'DONE', stepIndex: 2 }];

      const merged = mergeToolSteps(prev, incoming);

      expect(merged).toHaveLength(2);
      expect(merged.find(s => s.stepIndex === 2).status).toBe('DONE');
      expect(merged.find(s => s.stepIndex === 1).status).toBe('DONE');
    });

    it('appends a new step that the previous feed had not yet seen', () => {
      const prev = [{ tool: 'findArtifact', label: 'Поиск артефакта', status: 'DONE', stepIndex: 1 }];
      const incoming = [
        { tool: 'findArtifact', label: 'Поиск артефакта', status: 'DONE', stepIndex: 1 },
        { tool: 'validateArtifact', label: 'Валидация артефакта', status: 'RUNNING', stepIndex: 2 }
      ];

      const merged = mergeToolSteps(prev, incoming);

      expect(merged.map(s => s.stepIndex)).toEqual([1, 2]);
      expect(merged[1].tool).toBe('validateArtifact');
    });

    it('keeps steps from the previous feed that are absent from the latest snapshot', () => {
      // The controller retains only the latest snapshot; a step that completed between polls
      // must survive even if a sparse incoming snapshot omits it.
      const prev = [
        { tool: 'findArtifact', status: 'DONE', stepIndex: 1 },
        { tool: 'validateArtifact', status: 'DONE', stepIndex: 2 }
      ];
      const incoming = [{ tool: 'deployArtifact', status: 'RUNNING', stepIndex: 3 }];

      const merged = mergeToolSteps(prev, incoming);

      expect(merged.map(s => s.stepIndex)).toEqual([1, 2, 3]);
    });

    it('defaults both arguments to empty arrays', () => {
      expect(mergeToolSteps()).toEqual([]);
      expect(mergeToolSteps(undefined, [{ tool: 'a', status: 'RUNNING', stepIndex: 1 }])).toHaveLength(1);
    });

    it('ignores steps without a numeric stepIndex', () => {
      const merged = mergeToolSteps([], [{ tool: 'a', status: 'RUNNING' }, { tool: 'b', status: 'RUNNING', stepIndex: 1 }]);
      expect(merged).toHaveLength(1);
      expect(merged[0].tool).toBe('b');
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
