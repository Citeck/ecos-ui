import {
  AI_AGENT_ICON_PATH,
  AI_ICON_PATH,
  ECOS_TASK_TYPES,
  ECOS_TASK_TYPE_AI_TASK,
  ECOS_TASK_TYPE_SET_STATUS,
  ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP,
  STATUS_CHANGE_ICON_PATH
} from '../bpmn';

// An ecos task type is wired through several independent places (renderer, palette, context pad,
// replace menu, properties form). These two are the ones a missing entry breaks silently: the
// element renders as a plain task, or its properties panel comes up empty.
describe('ecos task types', () => {
  it('every task type resolves to a properties form element type', () => {
    const withoutForm = ECOS_TASK_TYPES.filter(taskType => !ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP.has(taskType));

    expect(withoutForm).toEqual([]);
  });

  it('the form determiner map describes only known task types', () => {
    const unknown = [...ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP.keys()].filter(
      taskType => !ECOS_TASK_TYPES.includes(taskType)
    );

    expect(unknown).toEqual([]);
  });

  it('keeps the task type identifiers agreed with ecos-process', () => {
    // These strings are the ecos:taskType attribute values; ecos-process matches them literally
    // (ECOS_TASK_SET_STATUS / ECOS_TASK_AI).
    expect(ECOS_TASK_TYPES).toEqual([ECOS_TASK_TYPE_SET_STATUS, ECOS_TASK_TYPE_AI_TASK]);
    expect(ECOS_TASK_TYPE_SET_STATUS).toBe('setStatus');
    expect(ECOS_TASK_TYPE_AI_TASK).toBe('aiTask');
  });

  // An agent is a property of the AI task, not a task type of its own — there is deliberately no
  // aiAgentTask entry here. What the agent does change is the icon on the canvas.
  it('has no separate task type for an agent-backed ai task', () => {
    expect(ECOS_TASK_TYPES).not.toContain('aiAgentTask');
    expect([...ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP.values()]).not.toContain('bpmn:EcosTaskAiAgentTask');
  });

  it('draws a plain and an agent-backed ai task with different icons', () => {
    const icons = [STATUS_CHANGE_ICON_PATH, AI_ICON_PATH, AI_AGENT_ICON_PATH];

    expect(new Set(icons).size).toBe(icons.length);
    icons.forEach(icon => expect(icon).toMatch(/^[Mm]/));
  });
});
