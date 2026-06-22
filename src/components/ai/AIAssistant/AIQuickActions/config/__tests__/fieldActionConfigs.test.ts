import { isActionVisible, getAvailableActions, QuickAction, ACTION_ICONS, FIELD_TYPES } from '../fieldActionConfigs';

// Mock action for testing
const createMockAction = (overrides: Partial<QuickAction> = {}): QuickAction => ({
  id: 'test-action',
  icon: ACTION_ICONS.generate,
  getLabel: () => 'Test Action',
  requiresContent: false,
  ...overrides
});

describe('isActionVisible', () => {
  describe('custom predicate (isVisible)', () => {
    it('returns true when predicate returns true', () => {
      const action = createMockAction({
        isVisible: ({ contextType }) => contextType === 'computed_attribute'
      });

      expect(isActionVisible(action, 'computed_attribute', '', 'code')).toBe(true);
    });

    it('returns false when predicate returns false', () => {
      const action = createMockAction({
        isVisible: ({ contextType }) => contextType === 'computed_attribute'
      });

      expect(isActionVisible(action, 'ui_action', '', 'code')).toBe(false);
    });

    it('passes all context parameters to predicate', () => {
      const predicateMock = jest.fn().mockReturnValue(true);
      const action = createMockAction({ isVisible: predicateMock });

      isActionVisible(action, 'computed_attribute', 'some content', 'code');

      expect(predicateMock).toHaveBeenCalledWith({
        contextType: 'computed_attribute',
        currentContent: 'some content',
        fieldType: 'code'
      });
    });

    it('custom predicate takes precedence over showForContextTypes', () => {
      const action = createMockAction({
        showForContextTypes: ['computed_attribute'],
        isVisible: () => false
      });

      expect(isActionVisible(action, 'computed_attribute', '', 'code')).toBe(false);
    });

    it('custom predicate takes precedence over hideForContextTypes', () => {
      const action = createMockAction({
        hideForContextTypes: ['computed_attribute'],
        isVisible: () => true
      });

      expect(isActionVisible(action, 'computed_attribute', '', 'code')).toBe(true);
    });
  });

  describe('hideForContextTypes (blacklist)', () => {
    it('hides action when context is in blacklist', () => {
      const action = createMockAction({
        hideForContextTypes: ['computed_attribute', 'ui_action']
      });

      expect(isActionVisible(action, 'computed_attribute', '', 'code')).toBe(false);
      expect(isActionVisible(action, 'ui_action', '', 'code')).toBe(false);
    });

    it('shows action when context is not in blacklist', () => {
      const action = createMockAction({
        hideForContextTypes: ['computed_attribute']
      });

      expect(isActionVisible(action, 'ui_action', '', 'code')).toBe(true);
      expect(isActionVisible(action, 'bpmn_script_task', '', 'code')).toBe(true);
    });

    it('shows action when blacklist is empty array', () => {
      const action = createMockAction({
        hideForContextTypes: []
      });

      expect(isActionVisible(action, 'computed_attribute', '', 'code')).toBe(true);
    });

    it('blacklist takes precedence over whitelist', () => {
      const action = createMockAction({
        showForContextTypes: ['computed_attribute', 'ui_action'],
        hideForContextTypes: ['computed_attribute']
      });

      expect(isActionVisible(action, 'computed_attribute', '', 'code')).toBe(false);
      expect(isActionVisible(action, 'ui_action', '', 'code')).toBe(true);
    });
  });

  describe('showForContextTypes (whitelist)', () => {
    it('shows action when context is in whitelist', () => {
      const action = createMockAction({
        showForContextTypes: ['computed_attribute', 'computed_role']
      });

      expect(isActionVisible(action, 'computed_attribute', '', 'code')).toBe(true);
      expect(isActionVisible(action, 'computed_role', '', 'code')).toBe(true);
    });

    it('hides action when context is not in whitelist', () => {
      const action = createMockAction({
        showForContextTypes: ['computed_attribute']
      });

      expect(isActionVisible(action, 'ui_action', '', 'code')).toBe(false);
      expect(isActionVisible(action, 'bpmn_script_task', '', 'code')).toBe(false);
    });

    it('hides action when whitelist is defined but context is empty', () => {
      const action = createMockAction({
        showForContextTypes: ['computed_attribute']
      });

      expect(isActionVisible(action, '', '', 'code')).toBe(false);
    });

    it('shows action when whitelist is empty array (backward compatible)', () => {
      const action = createMockAction({
        showForContextTypes: []
      });

      expect(isActionVisible(action, 'computed_attribute', '', 'code')).toBe(true);
      expect(isActionVisible(action, '', '', 'code')).toBe(true);
    });
  });

  describe('no visibility conditions (backward compatible)', () => {
    it('shows action when no conditions are defined', () => {
      const action = createMockAction();

      expect(isActionVisible(action, 'computed_attribute', '', 'code')).toBe(true);
      expect(isActionVisible(action, '', '', 'code')).toBe(true);
      expect(isActionVisible(action, 'any_context', 'some content', 'text')).toBe(true);
    });
  });
});

describe('getAvailableActions', () => {
  describe('content requirement filtering', () => {
    it('shows actions that require content when content exists', () => {
      const actions = getAvailableActions(FIELD_TYPES.CODE, 'some code', '');
      const explainAction = actions.find(a => a.id === 'explain');

      expect(explainAction).toBeDefined();
    });

    it('hides actions that require content when content is empty', () => {
      const actions = getAvailableActions(FIELD_TYPES.CODE, '', '');
      const explainAction = actions.find(a => a.id === 'explain');

      expect(explainAction).toBeUndefined();
    });

    it('shows actions that do not require content when content is empty', () => {
      const actions = getAvailableActions(FIELD_TYPES.CODE, '', 'computed_attribute');
      const generateAction = actions.find(a => a.id === 'generate-computed-attribute');

      expect(generateAction).toBeDefined();
    });
  });

  describe('context type filtering', () => {
    it('shows generate-computed-attribute only for computed_attribute context', () => {
      const actionsWithContext = getAvailableActions(FIELD_TYPES.CODE, '', 'computed_attribute');
      const actionsWithoutContext = getAvailableActions(FIELD_TYPES.CODE, '', '');
      const actionsOtherContext = getAvailableActions(FIELD_TYPES.CODE, '', 'ui_action');

      expect(actionsWithContext.find(a => a.id === 'generate-computed-attribute')).toBeDefined();
      expect(actionsWithoutContext.find(a => a.id === 'generate-computed-attribute')).toBeUndefined();
      expect(actionsOtherContext.find(a => a.id === 'generate-computed-attribute')).toBeUndefined();
    });
  });

  describe('backward compatibility', () => {
    it('works without contextType parameter (defaults to empty string)', () => {
      const actions = getAvailableActions(FIELD_TYPES.TEXT, 'some text');

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.find(a => a.id === 'improve')).toBeDefined();
    });

    it('returns correct actions for TEXT field type', () => {
      const actions = getAvailableActions(FIELD_TYPES.TEXT, 'some text', '');

      expect(actions.find(a => a.id === 'improve')).toBeDefined();
      expect(actions.find(a => a.id === 'translate')).toBeDefined();
    });

    it('returns correct actions for TEXTAREA field type', () => {
      const actions = getAvailableActions(FIELD_TYPES.TEXTAREA, 'some text', '');

      expect(actions.find(a => a.id === 'expand')).toBeDefined();
      expect(actions.find(a => a.id === 'summarize')).toBeDefined();
      expect(actions.find(a => a.id === 'fix-grammar')).toBeDefined();
    });
  });

  describe('combined filtering', () => {
    it('applies both content requirement and context type filtering', () => {
      // With content and correct context - should show all applicable actions
      const actionsWithBoth = getAvailableActions(FIELD_TYPES.CODE, 'some code', 'computed_attribute');

      // Actions requiring content should be visible
      expect(actionsWithBoth.find(a => a.id === 'explain')).toBeDefined();
      expect(actionsWithBoth.find(a => a.id === 'fix')).toBeDefined();
      expect(actionsWithBoth.find(a => a.id === 'optimize')).toBeDefined();

      // Context-specific action should also be visible
      expect(actionsWithBoth.find(a => a.id === 'generate-computed-attribute')).toBeDefined();
    });

    it('filters out actions when content is missing but keeps context-specific ones', () => {
      const actionsNoContent = getAvailableActions(FIELD_TYPES.CODE, '', 'computed_attribute');

      // Actions requiring content should be hidden
      expect(actionsNoContent.find(a => a.id === 'explain')).toBeUndefined();
      expect(actionsNoContent.find(a => a.id === 'fix')).toBeUndefined();

      // Context-specific action that doesn't require content should be visible
      expect(actionsNoContent.find(a => a.id === 'generate-computed-attribute')).toBeDefined();
    });
  });
});
