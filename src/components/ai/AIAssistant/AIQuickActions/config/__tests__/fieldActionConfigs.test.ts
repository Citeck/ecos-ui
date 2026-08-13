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

  // D-B-2: the backend has prompts for `simplify`/`formalize` (TextQuickActionsProvider), but the
  // panel never offered them, so those quick actions were unreachable from the UI.
  describe('simplify / formalize quick actions', () => {
    const TEXT_FIELD_TYPES = [FIELD_TYPES.TEXTAREA, FIELD_TYPES.RICHTEXT, FIELD_TYPES.DOCUMENTATION];

    it.each(TEXT_FIELD_TYPES)('exposes simplify and formalize for %s', fieldType => {
      const actions = getAvailableActions(fieldType, 'some text', '');

      expect(actions.find(a => a.id === 'simplify')).toBeDefined();
      expect(actions.find(a => a.id === 'formalize')).toBeDefined();
    });

    it.each(TEXT_FIELD_TYPES)('hides both on an empty %s field, like every content action', fieldType => {
      const actions = getAvailableActions(fieldType, '', '');

      expect(actions.find(a => a.id === 'simplify')).toBeUndefined();
      expect(actions.find(a => a.id === 'formalize')).toBeUndefined();
    });

    // The id is the backend's prompt key, not a display value: renaming it silently breaks the action
    it('keeps the ids the backend resolves prompts by', () => {
      const actions = getAvailableActions(FIELD_TYPES.RICHTEXT, 'some text', '');
      const ids = actions.map(a => a.id);

      expect(ids).toContain('simplify');
      expect(ids).toContain('formalize');
      expect(ids.every(id => id === id.toLowerCase() && !id.includes('_'))).toBe(true);
    });

    it('does not add them to plain TEXT and NAME fields', () => {
      const textActions = getAvailableActions(FIELD_TYPES.TEXT, 'some text', '');
      const nameActions = getAvailableActions(FIELD_TYPES.NAME, 'some text', '');

      expect(textActions.find(a => a.id === 'simplify')).toBeUndefined();
      expect(nameActions.find(a => a.id === 'formalize')).toBeUndefined();
    });
  });

  // Same class as simplify/formalize above, found by the regression pass on 2026-08-12: the backend
  // has a `translate` prompt and Tier A covers it, but the action was configured only for TEXT and
  // NAME — and no component mounts those two field types (TextArea.jsx mounts TEXTAREA and
  // DOCUMENTATION, Lexical mounts RICHTEXT, the script editor mounts CODE). So the capability had no
  // UI entry point at all while looking covered.
  describe('translate quick action', () => {
    // DOCUMENTATION belongs here for the same reason as TEXTAREA: `TextArea.aiFieldType` returns it
    // instead of TEXTAREA whenever the field is configured with `textAreaAIContextType:
    // 'documentation'`, so a list that omits it lets the entry point go missing on a mounted type.
    const MOUNTED_TEXT_FIELD_TYPES = [FIELD_TYPES.TEXTAREA, FIELD_TYPES.DOCUMENTATION, FIELD_TYPES.RICHTEXT];

    it.each(MOUNTED_TEXT_FIELD_TYPES)('exposes translate for %s', fieldType => {
      const actions = getAvailableActions(fieldType, 'some text', '');

      expect(actions.find(a => a.id === 'translate')).toBeDefined();
    });

    it.each(MOUNTED_TEXT_FIELD_TYPES)('hides translate on an empty %s field, like every content action', fieldType => {
      const actions = getAvailableActions(fieldType, '', '');

      expect(actions.find(a => a.id === 'translate')).toBeUndefined();
    });

    // No separate "the id is still `translate`" or "reachable from at least one mounted type" case:
    // the two `it.each` blocks above already look the action up *by* that id, on every mounted type,
    // so either would restate their premise and pass whatever the config says.
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
