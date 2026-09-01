// EcosForm sits on a circular import chain (PreSettings -> recordActions -> ... -> EcosFormModal),
// which does not resolve under jest. The chain is cut here so that the component itself — and with
// it the real `softReload` — can be required.
jest.mock('@/components/admin/PreSettings', () => ({
  __esModule: true,
  PRE_SETTINGS_TYPES: { FORM: 'FORM' },
  PreSettings: class {
    open() {}
  }
}));

jest.mock('../builder/EcosFormBuilderModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../builder/EcosFormBuilder', () => ({ __esModule: true, default: () => null }));

jest.mock('../EcosFormUtils', () => ({
  __esModule: true,
  default: {
    getFormById: jest.fn(),
    getForm: jest.fn(),
    getFormInputs: jest.fn(() => []),
    getData: jest.fn()
  }
}));

const EcosForm = require('../EcosForm').default;
const EcosFormUtils = require('../EcosFormUtils').default;

const DEFINITION = { components: [{ key: 'title', type: 'textfield' }] };

/**
 * `softReload` is called on the live component, so the test builds the smallest instance the
 * method touches instead of rendering the whole form.
 */
function createInstance({ data = { title: 'old' }, formData = {} } = {}) {
  const form = {
    data: { ...data, buttonOnlyInForm: true },
    setValue: jest.fn(),
    getAllComponents: jest.fn(() => form.components)
  };

  form.components = [
    { component: { key: 'title' }, redraw: jest.fn() },
    { component: { key: 'untouched' }, redraw: jest.fn() }
  ];

  const instance = Object.create(EcosForm.prototype);

  Object.assign(instance, {
    _form: form,
    _lastLoadedData: data,
    _lastLoadedFormData: { formId: 'form-1', definition: DEFINITION },
    props: { record: 'app/rec@1', options: {}, onToggleLoader: jest.fn() },
    state: { recordId: 'app/rec@1', containerId: 'ecos-ui-form-0', formDefinition: DEFINITION },
    onReload: jest.fn()
  });

  EcosFormUtils.getForm.mockResolvedValue({ formId: 'form-1', definition: DEFINITION, ...formData });

  return { instance, form };
}

describe('EcosForm.softReload', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should do nothing when the record data has not changed', async () => {
    const { instance, form } = createInstance();
    EcosFormUtils.getData.mockResolvedValue({ inputs: [], submission: { title: 'old' } });

    const result = await instance.softReload();

    expect(result).toEqual({ changed: false, rebuilt: false, changedKeys: [] });
    expect(form.setValue).not.toHaveBeenCalled();
    expect(instance.onReload).not.toHaveBeenCalled();
    form.components.forEach(c => expect(c.redraw).not.toHaveBeenCalled());
  });

  it('should patch and repaint only the components whose value has changed', async () => {
    const { instance, form } = createInstance();
    EcosFormUtils.getData.mockResolvedValue({ inputs: [], submission: { title: 'new' } });

    const result = await instance.softReload();

    expect(result.changed).toBe(true);
    expect(result.rebuilt).toBe(false);
    expect(result.changedKeys).toEqual(['title']);
    expect(instance.onReload).not.toHaveBeenCalled();
    // the keys the form owns but the record does not must survive the patch
    expect(form.setValue).toHaveBeenCalledWith({ data: { title: 'new', buttonOnlyInForm: true } });
    expect(instance.props.onToggleLoader).not.toHaveBeenCalled();
    expect(form.components[0].redraw).toHaveBeenCalledTimes(1);
    expect(form.components[1].redraw).not.toHaveBeenCalled();
    expect(instance._lastLoadedData).toEqual({ title: 'new' });
  });

  // The state's record id is the edit alias (`<id>-alias-<n>`) — a browser-side routing detail the
  // backend resolves to nothing once the alias record is dropped from the registry. The re-read
  // must go through the base id `initForm` published, or a background update on a long-lived page
  // reads an empty submission and wipes the whole form (COREDEV-429 follow-up).
  it('should re-read the record by its base id, not by the edit alias', async () => {
    const { instance, form } = createInstance();
    instance.state = { ...instance.state, recordId: 'app/rec@1-alias-3' };
    form.options = { baseRecordId: 'app/rec@1' };
    EcosFormUtils.getData.mockResolvedValue({ inputs: [], submission: { title: 'new' } });

    const result = await instance.softReload();

    expect(EcosFormUtils.getData).toHaveBeenCalledWith('app/rec@1', [], 'ecos-ui-form-0');
    expect(result.changed).toBe(true);
    expect(result.rebuilt).toBe(false);
  });

  // A keyless submission on a form that holds data is a failed read, not a diff: patching it in
  // would overwrite every value with `undefined` (selects fall to "None", rich text to its
  // placeholder). The full reload path owns such states.
  it('should fall back to the full reload when the re-read comes back empty', async () => {
    const { instance, form } = createInstance();
    EcosFormUtils.getData.mockResolvedValue({ inputs: [], submission: {} });

    const result = await instance.softReload();

    expect(result).toEqual({ changed: true, rebuilt: true });
    expect(instance.onReload).toHaveBeenCalledTimes(1);
    expect(instance.props.onToggleLoader).toHaveBeenCalledWith(true);
    expect(form.setValue).not.toHaveBeenCalled();
    expect(instance._lastLoadedData).toEqual({ title: 'old' });
  });

  it('should fall back to the full reload when the form definition has changed', async () => {
    const { instance, form } = createInstance();
    EcosFormUtils.getForm.mockResolvedValue({
      formId: 'form-1',
      definition: { components: [{ key: 'title', type: 'textarea' }] }
    });

    const result = await instance.softReload();

    expect(result).toEqual({ changed: true, rebuilt: true });
    expect(instance.onReload).toHaveBeenCalledTimes(1);
    // the host masks the teardown only if the loader is raised before it starts — directly,
    // past the submit-scoped withoutLoader gate an inline save leaves on the form
    expect(instance.props.onToggleLoader).toHaveBeenCalledWith(true);
    expect(form.setValue).not.toHaveBeenCalled();
  });

  it('should fall back to the full reload when there is no form to patch yet', async () => {
    const { instance } = createInstance();
    instance._form = null;

    const result = await instance.softReload();

    expect(result).toEqual({ changed: true, rebuilt: true });
    expect(instance.onReload).toHaveBeenCalledTimes(1);
    expect(instance.props.onToggleLoader).toHaveBeenCalledWith(true);
    expect(EcosFormUtils.getData).not.toHaveBeenCalled();
  });

  // A value cleared on the server has no key in the re-read submission at all (null attributes are
  // skipped in post-processing) — the patch must reset such keys, not keep the stale value.
  it('should reset a value the server no longer returns', async () => {
    const { instance, form } = createInstance({ data: { title: 'old', assignee: 'user@1' } });
    // the re-read returns title but the assignee was cleared
    EcosFormUtils.getData.mockResolvedValue({ inputs: [], submission: { title: 'old' } });

    const result = await instance.softReload();

    expect(result.changed).toBe(true);
    expect(result.changedKeys).toEqual(['assignee']);
    expect(form.setValue).toHaveBeenCalledWith({ data: { title: 'old', assignee: null, buttonOnlyInForm: true } });
  });

  // The awaits can outlive the form they started for: a concurrent full reload replaces
  // `this._form` with a successor that loads its own data — patching it with the predecessor's
  // read would race the two.
  it('should bail out without patching when the form is replaced mid-read', async () => {
    const { instance, form } = createInstance();
    EcosFormUtils.getData.mockImplementation(() => {
      instance._form = { replaced: true };
      return Promise.resolve({ inputs: [], submission: { title: 'new' } });
    });

    const result = await instance.softReload();

    expect(result).toEqual({ changed: false, rebuilt: false });
    expect(form.setValue).not.toHaveBeenCalled();
    expect(instance.onReload).not.toHaveBeenCalled();
    expect(instance._lastLoadedData).toEqual({ title: 'old' });
  });

  // A key open for inline editing belongs to the user while they type: the background patch must
  // neither overwrite the live value nor advance its snapshot — the delta stays pending and is
  // re-detected once the editor closes.
  it('should leave a field that is being edited inline untouched', async () => {
    const { instance, form } = createInstance({ data: { title: 'old', assignee: 'user@1' } });
    form.components[0]._isInlineEditingMode = true; // the 'title' component
    form.data.title = 'typing…';
    EcosFormUtils.getData.mockResolvedValue({ inputs: [], submission: { title: 'server', assignee: 'user@2' } });

    const result = await instance.softReload();

    expect(result.changed).toBe(true);
    expect(result.changedKeys).toEqual(['assignee']);
    // the live text survives, the other field is patched
    expect(form.setValue).toHaveBeenCalledWith({ data: { title: 'typing…', assignee: 'user@2', buttonOnlyInForm: true } });
    // no redraw of the open editor
    expect(form.components[0].redraw).not.toHaveBeenCalled();
    // the skipped delta stays pending for the next diff
    expect(instance._lastLoadedData).toEqual({ title: 'old', assignee: 'user@2' });
  });

  // The other half of the inline protection: the server did NOT change the edited key, but the
  // re-read still returns its (stale relative to the typing) value — the spread would push it
  // into the live input all the same.
  it('should leave an inline-edited field alone even when the server did not change it', async () => {
    const { instance, form } = createInstance({ data: { title: 'old', assignee: 'user@1' } });
    form.components[0]._isInlineEditingMode = true; // the 'title' component
    form.data.title = 'typing…';
    EcosFormUtils.getData.mockResolvedValue({ inputs: [], submission: { title: 'old', assignee: 'user@2' } });

    const result = await instance.softReload();

    expect(result.changedKeys).toEqual(['assignee']);
    expect(form.setValue).toHaveBeenCalledWith({ data: { title: 'typing…', assignee: 'user@2', buttonOnlyInForm: true } });
  });

  // The re-read that follows an inline save answers with the value the user has just saved, so
  // the field on screen is already right. Repainting it anyway tears the freshly built component
  // down and builds an identical one — for a rich-text field that is a whole React root going
  // away and coming back, i.e. the flicker of the edited field. COREDEV-427.
  it('should not repaint a key the form already shows, however far behind the snapshot is', async () => {
    const { instance, form } = createInstance();
    // the inline save has already put the new value on the form and redrawn the field once
    form.data.title = 'new';
    EcosFormUtils.getData.mockResolvedValue({ inputs: [], submission: { title: 'new' } });

    const result = await instance.softReload();

    // the record HAS changed relative to the snapshot — that part of the contract is unchanged
    expect(result).toEqual({ changed: true, rebuilt: false, changedKeys: ['title'] });
    expect(form.setValue).toHaveBeenCalledWith({ data: { title: 'new', buttonOnlyInForm: true } });
    expect(instance._lastLoadedData).toEqual({ title: 'new' });
    // ...but nothing on screen has to move
    expect(form.components[0].redraw).not.toHaveBeenCalled();
  });

  it('should still repaint the keys the form does not show yet when another one is already current', async () => {
    const { instance, form } = createInstance();
    form.components[1].component.key = 'assignee';
    form.data.title = 'new'; // just saved inline
    form.data.assignee = 'user@1'; // changed by somebody else in the background
    EcosFormUtils.getData.mockResolvedValue({ inputs: [], submission: { title: 'new', assignee: 'user@2' } });

    const result = await instance.softReload();

    expect(result.changedKeys).toEqual(['title', 'assignee']);
    expect(form.components[0].redraw).not.toHaveBeenCalled();
    expect(form.components[1].redraw).toHaveBeenCalledTimes(1);
  });

  // A FAILED read of the form description is not a CHANGED description — a transient error must
  // not tear a perfectly good form down.
  it('should leave the form alone when the description read fails', async () => {
    const { instance, form } = createInstance();
    EcosFormUtils.getForm.mockRejectedValue(new Error('network hiccup'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await instance.softReload();

    expect(result).toEqual({ changed: false, rebuilt: false });
    expect(instance.onReload).not.toHaveBeenCalled();
    expect(form.setValue).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
