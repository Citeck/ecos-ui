import { URL as Urls } from '@citeck/constants/index';

import ModelEditorPage from '../ModelEditor';

// The dirty-state machine drives the unsaved-changes warnings (browser beforeunload and the page-tab
// close guard). It is exercised here directly on an instance, without rendering: every entry point is
// an arrow method, and the "designer" only needs to answer saveXML with the current model text.
describe('ModelEditorPage dirty state — what "unsaved changes" means to the close guards', () => {
  const makeEditor = ({ pathname = Urls.BPMN_EDITOR, xml = '<model version="loaded"/>' } = {}) => {
    const instance = new ModelEditorPage({ location: { pathname } });

    instance.designer = {
      xml,
      saveXML: ({ callback }) => callback({ xml: instance.designer.xml }),
      destroy: jest.fn()
    };

    return instance;
  };

  // The baseline capture and the edits below go through the same debounced serializer the component
  // uses; flushing it stands for "the burst of events is over".
  const settle = instance => instance.syncDirtyState.flush();

  const loadDiagram = instance => {
    instance.resetDirtyBaseline();
    settle(instance);
  };

  const edit = (instance, xml) => {
    instance.designer.xml = xml;
    instance.handleModelChanged({ trigger: 'execute' });
  };

  // What the saga does after `saveModel`: remembers what was sent, then confirms it with a new
  // `savedModel` prop once the server answers.
  const sendSave = instance => {
    instance._savedChangeCount = instance._changeCount;
    instance._pendingSavedXml = instance.designer.xml;
  };

  const confirmSave = instance => {
    const prevProps = instance.props;

    instance.props = { ...instance.props, savedModel: { rev: {} } };
    instance.componentDidUpdate(prevProps, instance.state);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('a freshly imported diagram is not dirty — the import wipe (`trigger: "clear"`) is not an edit', () => {
    const instance = makeEditor();

    loadDiagram(instance);
    instance.handleModelChanged({ trigger: 'clear' });

    // Before the debounced verification: the wipe must not have been counted as an edit at all —
    // the immediate flip and the change counter are the guard's only observable effects
    expect(instance.hasUnsavedChanges()).toBe(false);
    expect(instance._changeCount).toBe(0);

    settle(instance);
    expect(instance.hasUnsavedChanges()).toBe(false);
  });

  it('an edit flips dirty on immediately — before the debounced verification has run', () => {
    const instance = makeEditor();

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');

    // Warn first, verify after: the guard must already answer true inside the debounce window
    expect(instance.hasUnsavedChanges()).toBe(true);

    settle(instance);
    expect(instance.hasUnsavedChanges()).toBe(true);
  });

  it('drops the flag when the model text matches the baseline — the properties form writing values back on init, or undo to the original', () => {
    const instance = makeEditor();

    loadDiagram(instance);
    // The command stack fires, but serialization comes out identical to what was loaded
    instance.handleModelChanged({ trigger: 'execute' });

    expect(instance.hasUnsavedChanges()).toBe(true);
    settle(instance);
    expect(instance.hasUnsavedChanges()).toBe(false);
  });

  it('a confirmed save moves the baseline to what was sent and clears the flag', () => {
    const instance = makeEditor();

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');
    sendSave(instance);
    confirmSave(instance);
    settle(instance);

    expect(instance.hasUnsavedChanges()).toBe(false);
    expect(instance._baselineXml).toBe('<model version="edited"/>');
    expect(instance._pendingSavedXml).toBeNull();
  });

  it('stays dirty when an edit lands while the save request is in flight', () => {
    const instance = makeEditor();

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');
    sendSave(instance);
    edit(instance, '<model version="edited-again"/>');
    confirmSave(instance);

    // The change counters answer for the debounce window: the save confirmation itself must leave
    // the flag up, before the serialized diff gets a chance to re-derive it
    expect(instance.hasUnsavedChanges()).toBe(true);

    settle(instance);
    expect(instance.hasUnsavedChanges()).toBe(true);
  });

  it('a save that never gets confirmed keeps the editor dirty', () => {
    const instance = makeEditor();

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');
    sendSave(instance);
    // No new savedModel prop arrives — the request failed
    settle(instance);

    expect(instance.hasUnsavedChanges()).toBe(true);
  });

  it('handleBeforeUnload arms the browser prompt only while dirty', () => {
    const instance = makeEditor();

    loadDiagram(instance);

    const cleanEvent = { preventDefault: jest.fn(), returnValue: undefined };
    instance.handleBeforeUnload(cleanEvent);
    expect(cleanEvent.preventDefault).not.toHaveBeenCalled();

    edit(instance, '<model version="edited"/>');

    const dirtyEvent = { preventDefault: jest.fn(), returnValue: undefined };
    instance.handleBeforeUnload(dirtyEvent);
    expect(dirtyEvent.preventDefault).toHaveBeenCalled();
    expect(dirtyEvent.returnValue).toBe('');
  });

  it('the CMMN editor stays out — the same editors as the workspace-change confirm', () => {
    const instance = makeEditor({ pathname: Urls.CMMN_EDITOR });

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');
    settle(instance);

    expect(instance.hasUnsavedChanges()).toBe(false);
  });
});
