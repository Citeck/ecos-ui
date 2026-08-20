import { TestForm } from '../../../../test/forms2/TestForm';
import { TAB_ERROR_ICON_CLASS, TAB_ERRORS_CLASS, TAB_INVALID_CLASS } from '../tabErrors';

const TOP_ALERT_SELECTOR = '.alert.alert-danger';

const tabsDefinition = {
  components: [
    {
      type: 'tabs',
      key: 'tabs',
      input: false,
      persistent: false,
      components: [
        {
          label: 'General',
          key: 'tabGeneral',
          components: [
            {
              type: 'textfield',
              input: true,
              key: 'generalField',
              label: 'General field',
              validate: { required: true }
            }
          ]
        },
        {
          label: 'Extra',
          key: 'tabExtra',
          components: [
            {
              type: 'panel',
              key: 'extraPanel',
              title: 'Extra panel',
              input: false,
              components: [
                {
                  type: 'textfield',
                  input: true,
                  key: 'extraField',
                  label: 'Extra field',
                  validate: { required: true }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

/** A row of tabs opening the pane of another row — what the MDM forms on the stand are built of. */
const nestedTabsDefinition = {
  components: [
    {
      type: 'tabs',
      key: 'outerTabs',
      input: false,
      persistent: false,
      components: [
        {
          label: 'Outer with tabs',
          key: 'outerWithTabs',
          components: [
            {
              type: 'tabs',
              key: 'innerTabs',
              input: false,
              persistent: false,
              components: [
                {
                  label: 'Inner first',
                  key: 'innerFirst',
                  components: [
                    {
                      type: 'textfield',
                      input: true,
                      key: 'innerField',
                      label: 'Inner field',
                      validate: { required: true }
                    }
                  ]
                },
                {
                  label: 'Inner second',
                  key: 'innerSecond',
                  components: [
                    {
                      type: 'textfield',
                      input: true,
                      key: 'innerOtherField',
                      label: 'Inner other field'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: 'Outer plain',
          key: 'outerPlain',
          components: [
            {
              type: 'textfield',
              input: true,
              key: 'outerField',
              label: 'Outer field',
              validate: { required: true }
            }
          ]
        }
      ]
    }
  ]
};

const plainDefinition = {
  components: [
    {
      type: 'textfield',
      input: true,
      key: 'plainField',
      label: 'Plain field',
      validate: { required: true }
    },
    {
      type: 'textfield',
      input: true,
      key: 'otherPlainField',
      label: 'Other plain field',
      validate: { required: true }
    }
  ]
};

/**
 * Reproduces what formio does on a failed submit: validate everything as dirty, then hand the
 * failure to `onSubmissionError`, which renders the errors. Going through `onSubmissionError`
 * rather than calling `showErrors(error, true)` directly is the point — that call is what marks a
 * submit the user is waiting for, and other paths (a change on a submitted form, an inline save)
 * reach `showErrors` too.
 */
function submitWithErrors(form, error) {
  form.setPristine(false);
  form.checkValidity(form.submission.data, true);
  return form.onSubmissionError(error);
}

/**
 * Reproduces a keystroke on a form that has already been submitted once: formio re-validates and
 * calls `showErrors` again from `onChange` / `checkData`, this time without `triggerEvent`.
 *
 * Going through `onChange` matters — `setValue` alone leaves `flags.noValidate` on, so the field
 * keeps its stale error and the interesting state (a tab that has just become valid under the
 * user's hands) never happens.
 */
async function typeInto(wrapper, form, key, value) {
  const component = form.getComponent(key);

  await wrapper.setInputValue(key, value);
  form.onChange({}, { instance: component, component: component.component, value });

  return component;
}

function getTabPanes(form) {
  return Array.from(form.element.querySelectorAll('.tab-content > .tab-pane'));
}

function getTabItems(form) {
  return Array.from(form.element.querySelectorAll('.nav-tabs > .nav-item'));
}

/** The form-level alert: a danger alert that does not live inside a tab pane. */
function getTopAlert(form) {
  return Array.from(form.element.querySelectorAll(TOP_ALERT_SELECTOR)).find(el => !el.closest('.tab-pane')) || null;
}

function getTopAlertText(form) {
  const alert = getTopAlert(form);
  return alert ? alert.textContent : null;
}

describe('Form tabs error indication (COREDEV-431)', () => {
  it('lists the errors of each tab inside that tab instead of one list on top of the form', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();

    submitWithErrors(form);

    const panes = getTabPanes(form);
    expect(panes).toHaveLength(2);

    const firstList = panes[0].querySelector(`.${TAB_ERRORS_CLASS}`);
    const secondList = panes[1].querySelector(`.${TAB_ERRORS_CLASS}`);

    expect(firstList).not.toBeNull();
    expect(secondList).not.toBeNull();

    // each list holds only the errors of its own tab
    expect(firstList.textContent).toContain('General field');
    expect(firstList.textContent).not.toContain('Extra field');

    expect(secondList.textContent).toContain('Extra field');
    expect(secondList.textContent).not.toContain('General field');

    // the error list is the first thing inside the pane
    expect(panes[0].firstChild).toBe(firstList);

    // and nothing is left over at the top of the form
    expect(getTopAlert(form)).toBeNull();
  });

  it('marks a tab holding invalid fields, including fields nested in a panel', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();

    submitWithErrors(form);

    const items = getTabItems(form);
    expect(items).toHaveLength(2);

    items.forEach(item => {
      expect(item.classList.contains(TAB_INVALID_CLASS)).toBe(true);
      expect(item.querySelector(`.${TAB_ERROR_ICON_CLASS}`)).not.toBeNull();
    });

    // the second tab only contains a panel — the marker must still light up for the field inside it
    expect(items[1].querySelector(`.${TAB_ERROR_ICON_CLASS}`)).not.toBeNull();
  });

  it('drops the marker and the list of a tab once its fields become valid', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();

    submitWithErrors(form);

    expect(getTabItems(form)[0].classList.contains(TAB_INVALID_CLASS)).toBe(true);

    await wrapper.setInputValue('generalField', 'filled');
    submitWithErrors(form);

    const items = getTabItems(form);
    const panes = getTabPanes(form);

    expect(items[0].classList.contains(TAB_INVALID_CLASS)).toBe(false);
    expect(items[0].querySelector(`.${TAB_ERROR_ICON_CLASS}`)).toBeNull();
    expect(panes[0].querySelector(`.${TAB_ERRORS_CLASS}`)).toBeNull();

    // the still-invalid tab keeps its list
    expect(items[1].classList.contains(TAB_INVALID_CLASS)).toBe(true);
    expect(panes[1].querySelector(`.${TAB_ERRORS_CLASS}`)).not.toBeNull();
  });

  it('keeps errors that belong to no tab in the alert on top of the form', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();

    submitWithErrors(form, { message: 'Server is not available' });

    const topAlertText = getTopAlertText(form);

    expect(topAlertText).not.toBeNull();
    expect(topAlertText).toContain('Server is not available');
    // the field errors moved into the tabs and are not repeated on top
    expect(topAlertText).not.toContain('General field');
    expect(topAlertText).not.toContain('Extra field');
  });

  it('switches to the first tab with errors when the current one is valid', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();
    const tabs = form.getComponent('tabs');

    await wrapper.setInputValue('generalField', 'filled');

    expect(tabs.currentTab).toBe(0);

    submitWithErrors(form);

    expect(tabs.currentTab).toBe(1);
    expect(getTabPanes(form)[1].classList.contains('active')).toBe(true);
  });

  // The switch is the first thing that ever drove a tabs component from code rather than from a
  // click on its own DOM, and the form tree holds copies of components that a click can never
  // reach: same prototype, own properties copied, no `#private` fields (what `cloneDeep` makes of
  // a component). `setTab` on such a copy used to throw out of `showErrors`, which then never got
  // to clear its alert — the form kept the full list on top ON TOP OF the per-tab lists.
  it('switches tabs on a copy of the component that has no private fields', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();
    const tabs = form.getComponent('tabs');

    const copy = Object.assign(Object.create(Object.getPrototypeOf(tabs)), tabs);

    expect(() => copy.setTab(1)).not.toThrow();
    expect(copy.currentTab).toBe(1);
  });

  // formio re-runs `showErrors` on every change once the form has been submitted, and the tab the
  // user is typing in stops being invalid the moment the field is filled. Switching tabs on that
  // pass would drop them onto another tab mid-word, with the focus left in a hidden pane.
  it('does not move the user off the tab they are typing on', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();
    const tabs = form.getComponent('tabs');

    submitWithErrors(form);
    form.submitted = true;

    expect(tabs.currentTab).toBe(0);

    const general = await typeInto(wrapper, form, 'generalField', 'filled');

    // the tab they are on is valid now — and they are still on it
    expect(general.error).toBeFalsy();
    expect(tabs.currentTab).toBe(0);
    // ...while the other tab is still marked, so the way out stays visible
    expect(getTabItems(form)[1].classList.contains(TAB_INVALID_CLASS)).toBe(true);
  });

  // The other way into `showErrors` with `triggerEvent` set: a per-field inline save clears the
  // alert with `showErrors('', true)` once the save has GONE THROUGH (Base.js). A field still
  // carrying an error from an earlier server-side rejection marks its tab, and taking that for a
  // failed submit threw the user onto that tab right after saving on another one.
  it('stays on the tab the user is editing when an inline save goes through', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();
    const tabs = form.getComponent('tabs');

    await wrapper.setInputValue('generalField', 'filled');
    // what a server-side error does to the component it names
    form.getComponent('extraField').setCustomValidity('Vendor already exists', true);

    expect(tabs.currentTab).toBe(0);

    form.showErrors('', true);

    expect(tabs.currentTab).toBe(0);
    // the tab is still marked — the user is told, just not dragged there
    expect(getTabItems(form)[1].classList.contains(TAB_INVALID_CLASS)).toBe(true);
  });

  // An error of an inner row of tabs belongs to a tab of the outer row as well — through the tab
  // that holds the whole inner row — so both rows can claim it. Only the inner one may.
  it('does not repeat the errors of a nested row of tabs in the pane above it', async () => {
    const wrapper = await TestForm.create(nestedTabsDefinition);
    const form = wrapper.getForm();

    const listsWith = text => Array.from(form.element.querySelectorAll(`.${TAB_ERRORS_CLASS}`)).filter(el => el.textContent.includes(text));

    submitWithErrors(form);

    expect(listsWith('Inner field')).toHaveLength(1);
    // and it is the inner tab that got it, not the outer one
    expect(listsWith('Inner field')[0].closest('.formio-component-tabs').getAttribute('id')).toBe(form.getComponent('innerTabs').id);

    // a validation pass with no `showErrors` behind it — `setValue`/`checkData` with flags, a soft
    // reload — goes through `refreshTabErrors`, which works off the deep error list of the component
    form.checkValidity(form.submission.data, true);

    expect(listsWith('Inner field')).toHaveLength(1);
    // the outer tab holding the inner row still carries the marker
    expect(getTabItems(form)[0].classList.contains(TAB_INVALID_CLASS)).toBe(true);
  });

  // The same tabs of the same form can be driven by more than one component instance (a copy of a
  // component keeps the very same DOM — see the private-fields test above), and the instance that
  // renders the lists on submit is not always the one that validates afterwards. The second one
  // used to clear the marker of a tab and leave its list behind: the user fills the field in, the
  // indicator goes out, and the list of that very field stays on the pane.
  it('drops a list another instance of the component rendered, once the errors are gone', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();
    const tabs = form.getComponent('tabs');

    // the other instance: same tabs, same panes, its own bookkeeping
    const other = Object.assign(Object.create(Object.getPrototypeOf(tabs)), tabs);
    other._tabErrorAlerts = {};

    form.setPristine(false);
    form.checkValidity(form.submission.data, true);
    other.showTabErrors(form.errors);

    const panes = getTabPanes(form);
    expect(panes[0].querySelector(`.${TAB_ERRORS_CLASS}`)).not.toBeNull();
    // the instance that validates has never rendered a list of its own
    expect(tabs._tabErrorsShown).toBeFalsy();

    await typeInto(wrapper, form, 'generalField', 'filled');

    expect(getTabItems(form)[0].classList.contains(TAB_INVALID_CLASS)).toBe(false);
    expect(panes[0].querySelector(`.${TAB_ERRORS_CLASS}`)).toBeNull();
    // the tab that is still invalid keeps its list
    expect(panes[1].querySelector(`.${TAB_ERRORS_CLASS}`)).not.toBeNull();
  });

  // The counterpart of the guard above: the error list of a tab must not be torn down and rebuilt
  // on every keystroke, or a selection inside it dies for nothing.
  it('keeps the very same error list node while the user types on another tab', async () => {
    const wrapper = await TestForm.create(tabsDefinition);
    const form = wrapper.getForm();

    submitWithErrors(form);
    form.submitted = true;

    const listBefore = getTabPanes(form)[1].querySelector(`.${TAB_ERRORS_CLASS}`);
    expect(listBefore).not.toBeNull();

    await typeInto(wrapper, form, 'generalField', 'filled');

    expect(getTabPanes(form)[1].querySelector(`.${TAB_ERRORS_CLASS}`)).toBe(listBefore);
  });

  it('leaves a form without tabs with the usual single list on top', async () => {
    const wrapper = await TestForm.create(plainDefinition);
    const form = wrapper.getForm();

    submitWithErrors(form);

    const topAlertText = getTopAlertText(form);

    expect(topAlertText).not.toBeNull();
    expect(topAlertText).toContain('Plain field');
    expect(topAlertText).toContain('Other plain field');
  });
});
