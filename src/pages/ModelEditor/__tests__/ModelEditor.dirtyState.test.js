import { URL as Urls } from '@citeck/constants/index';

import ModelEditorPage from '../ModelEditor';

// The workspace-change guard asks the tab registry for the tab it was registered for
jest.mock('@/services/pageTabs/PageTabList', () => ({
  __esModule: true,
  default: { activeTabId: 'tab-1', tabs: [{ id: 'tab-1', link: '/v2/bpmn-editor?ws=ws-a' }] }
}));

// The current workspace is what a link without an explicit `ws` resolves to — pin it, the real helper
// answers from window.location and the workspaces feature flag
jest.mock('@/helpers/urls', () => ({
  ...jest.requireActual('@/helpers/urls'),
  __esModule: true,
  getWorkspaceId: () => 'ws-a'
}));

// The dirty-state machine drives the unsaved-changes warnings (browser beforeunload, the page-tab
// close guard and the workspace-change confirm). It is exercised here directly on an instance, without
// rendering: every entry point is an arrow method, and the "designer" only needs to answer saveXML with
// the current model text.
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

describe('ModelEditorPage dirty state — what "unsaved changes" means to the close guards', () => {
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

// The url-change guard (`PageService.registerUrlChangeGuard`) — a workspace switch used to ask for
// confirmation unconditionally, which contradicted the silent close of a clean diagram.
describe('ModelEditorPage workspace-change confirm — asks only about changes worth losing', () => {
  let originalConfirm;

  const makeWsEditor = ({ ws = 'ws-a', ...rest } = {}) => {
    const instance = makeEditor(rest);

    // The editor was opened at this url; `ws: null` stands for a link without the parameter
    instance.urlQuery = ws === null ? {} : { ws };
    // The guard reactivates its own tab before asking, and answers through the callback
    instance.props = { ...instance.props, changeTab: jest.fn(({ callback }) => callback()) };

    return instance;
  };

  beforeEach(() => {
    originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    window.confirm = originalConfirm;
    jest.restoreAllMocks();
  });

  it('lets a clean diagram move to another workspace without a word', async () => {
    const instance = makeWsEditor();

    loadDiagram(instance);

    await expect(instance.handleCloseEditor({ link: '/v2/dashboard?ws=ws-b' }, 'tab-1')).resolves.toBeUndefined();

    expect(window.confirm).not.toHaveBeenCalled();
    // Nothing to ask about — the guard must not even reactivate the tab
    expect(instance.props.changeTab).not.toHaveBeenCalled();
  });

  it('asks once when unsaved changes leave for another workspace, and lets the navigation through on confirm', async () => {
    const instance = makeWsEditor();

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');

    await expect(instance.handleCloseEditor({ link: '/v2/dashboard?ws=ws-b' }, 'tab-1')).resolves.toBeUndefined();

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(instance.props.changeTab).toHaveBeenCalledTimes(1);
  });

  it('cancels the navigation when the confirm is dismissed', async () => {
    const instance = makeWsEditor();

    window.confirm = jest.fn(() => false);

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');

    await expect(instance.handleCloseEditor({ link: '/v2/dashboard?ws=ws-b' }, 'tab-1')).rejects.toBeTruthy();
    expect(window.confirm).toHaveBeenCalledTimes(1);
  });

  it('stays silent inside the current workspace even with unsaved changes — nothing is being left behind', async () => {
    const instance = makeWsEditor();

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');

    await expect(instance.handleCloseEditor({ link: '/v2/dashboard?ws=ws-a' }, 'tab-1')).resolves.toBeUndefined();

    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('stays silent inside the current workspace when the editor was opened by a link without `ws`', async () => {
    // Both sides of the comparison fall back to the current workspace, otherwise every navigation
    // would look like a workspace switch to an editor opened without the parameter
    const instance = makeWsEditor({ ws: null });

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');

    await expect(instance.handleCloseEditor({ link: '/v2/dashboard?ws=ws-a' }, 'tab-1')).resolves.toBeUndefined();
    await expect(instance.handleCloseEditor({ link: '/v2/dashboard' }, 'tab-1')).resolves.toBeUndefined();

    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('goes quiet again once the changes are saved', async () => {
    const instance = makeWsEditor();

    loadDiagram(instance);
    edit(instance, '<model version="edited"/>');
    sendSave(instance);
    confirmSave(instance);
    settle(instance);

    await expect(instance.handleCloseEditor({ link: '/v2/dashboard?ws=ws-b' }, 'tab-1')).resolves.toBeUndefined();

    expect(window.confirm).not.toHaveBeenCalled();
  });
});
