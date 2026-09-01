import cloneDeep from 'lodash/cloneDeep';

import { basicSectionTest } from '../../../test/builder/helpers';
import Harness from '../../../test/harness';

import TextAreaComponent from './TextArea';
import comp1 from './fixtures/comp1';

basicSectionTest(TextAreaComponent);

describe('TextArea Component', () => {
  it('Should build a TextArea component', done => {
    Harness.testCreate(TextAreaComponent, comp1).then(component => {
      Harness.testElements(component, 'textarea', 1);
      done();
    });
  });

  it('Should be unreadable value', done => {
    const comp = Object.assign(cloneDeep(comp1), { unreadable: true });

    Harness.testCreate(TextAreaComponent, comp, { readOnly: false }).then(component => Harness.testUnreadableField(component, done));
  });

  it('Should recognize monaco as wysiwyg editor', () => {
    const comp = Object.assign(cloneDeep(comp1), {
      editor: 'monaco',
      wysiwyg: true
    });

    return Harness.testCreate(TextAreaComponent, comp).then(component => {
      expect(component.isMonacoEditor).toBe(true);
    });
  });

  it('Should provide fallback display helper', () => {
    const comp = Object.assign(cloneDeep(comp1), {
      editor: 'monaco',
      wysiwyg: true
    });
    return Harness.testCreate(TextAreaComponent, comp).then(component => {
      component.input = document.createElement('div');
      component.dataValue = 'fallback text';
      component.showFallbackWysiwyg();
      expect(component.input.innerHTML).toContain('fallback text');
    });
  });

  describe('Monaco redraw visibility', () => {
    function createMonacoComp(overrides = {}) {
      return Object.assign(cloneDeep(comp1), {
        editor: 'monaco',
        wysiwyg: true,
        hidden: true,
        ...overrides
      });
    }

    it('Should update DOM visibility on redraw when hidden changes to false', () => {
      return Harness.testCreate(TextAreaComponent, createMonacoComp()).then(component => {
        // Initially hidden
        expect(component.component.hidden).toBe(true);

        // Simulate what formio fieldLogic does: change the hidden property, then redraw
        component.component.hidden = false;
        component.redraw();

        expect(component.element.hidden).toBeFalsy();
        expect(component.element.style.visibility).toBe('visible');
      });
    });

    it('Should hide element on redraw when hidden changes to true', () => {
      return Harness.testCreate(TextAreaComponent, createMonacoComp({ hidden: false })).then(component => {
        // Initially visible
        expect(component.element.style.visibility).toBe('visible');

        // Simulate hiding via logic
        component.component.hidden = true;
        component.redraw();

        expect(component.element.style.visibility).toBe('hidden');
      });
    });

    it('Should update visibility via checkConditions with fieldLogic', () => {
      const comp = createMonacoComp({
        hidden: false,
        logic: [
          {
            name: 'showWhenScript',
            trigger: {
              type: 'javascript',
              javascript: "result = _.get(data, 'conditionType') === 'SCRIPT';"
            },
            actions: [
              {
                name: 'showField',
                type: 'property',
                property: {
                  label: 'Hidden',
                  value: 'hidden',
                  type: 'boolean'
                },
                state: false
              }
            ]
          }
        ]
      });

      return Harness.testCreate(TextAreaComponent, comp).then(component => {
        // When conditionType is not SCRIPT, logic doesn't fire — hidden stays as-is
        component.data = { conditionType: 'NONE' };
        component.checkConditions(component.data);

        // When conditionType is SCRIPT, logic sets hidden = false
        component.data = { conditionType: 'SCRIPT' };
        component.checkConditions(component.data);
        expect(component.element.style.visibility).toBe('visible');
        expect(component.element.hidden).toBeFalsy();
      });
    });

    it('Should not destroy Monaco editor on redraw', () => {
      return Harness.testCreate(TextAreaComponent, createMonacoComp({ hidden: false })).then(component => {
        const monacoRoot = component._monacoRoot;

        component.component.hidden = false;
        component.redraw();

        // _monacoRoot should still be the same instance — not destroyed and recreated
        expect(component._monacoRoot).toBe(monacoRoot);
      });
    });
  });
});

// D-B-AIAPPLY-NOSAVE (regr-20260814-r1, case B7): applying an AI edit into a plain textarea set the
// value WITHOUT the `modified`/`changeByUser` flags, so `valueChangedByUser` stayed false, the
// Properties widget's Save bar never appeared and the edit was silently lost on navigate-away
// (a manual keypress in the same field made the bar appear immediately). The AI button's setValue
// wiring now goes through applyAITextAreaValue, which mirrors a real user edit. The full
// setValue→onChange chain needs a live form root, so the two ends are pinned separately.
describe('AI apply marks a plain textarea as changed by the user', () => {
  it('applyAITextAreaValue passes user-edit flags and syncs the DOM element', () => {
    return Harness.testCreate(TextAreaComponent, cloneDeep(comp1)).then(component => {
      component.addTextAreaAIButton = () => {};
      const textareaElement = component.element.querySelector('textarea');
      const setValueSpy = jest.spyOn(component, 'setValue');

      component.applyAITextAreaValue('текст, применённый ИИ', textareaElement);

      expect(setValueSpy).toHaveBeenCalledWith(
        'текст, применённый ИИ',
        expect.objectContaining({ modified: true, changeByUser: true })
      );
      expect(component.dataValue).toBe('текст, применённый ИИ');
      if (textareaElement) {
        expect(textareaElement.value).toBe('текст, применённый ИИ');
      }
    });
  });

  it('onChange with the changeByUser flag marks the component as changed by the user', () => {
    return Harness.testCreate(TextAreaComponent, cloneDeep(comp1)).then(component => {
      component.addTextAreaAIButton = () => {};
      expect(component.valueChangedByUser).toBeFalsy();

      component.onChange({ changeByUser: true });

      expect(component.valueChangedByUser).toBe(true);
    });
  });
});

// D-B-AIAPPLY-NOSAVE-ACE (regr-20260816-r1, cases B5/B7) and its mirror D-G-QA-APPLY-NOOP (G14):
// the flags of an editor edit were read off the editor's own change event, which cannot tell an AI
// apply from a programmatic refresh. On a field that started EMPTY the `autoModified` latch of the
// initial value push was still up — ace reports no change for a no-op `setValue('')` — so a real
// edit arrived as `modified: false` and no Save bar appeared; on a filled field an apply of the
// SAME text still went through `setValue`, whose remove-then-insert raised the flag for an edit
// that never happened. `applyAIEditorValue` states the flags itself and applies nothing when there
// is nothing to apply.
//
// The editor is stubbed: ace and monaco cannot be instantiated under jsdom. The stub reproduces the
// one behaviour that matters here — ace relays a `setValue` to the component synchronously, which
// is what `addAce` wires up (`this.editor.on('change', () => this.updateEditorValue(...))`).
describe('AI apply into a code editor (ace/monaco)', () => {
  const attachFakeAce = (component, initialValue) => {
    let value = initialValue;
    component.component.editor = 'ace';
    component.editor = {
      getValue: () => value,
      setValue: next => {
        value = next;
        component.updateEditorValue(value);
      },
      clearSelection: () => {}
    };
    return component.editor;
  };

  it('marks an apply into an initially EMPTY ace field as changed by the user', () => {
    return Harness.testCreate(TextAreaComponent, cloneDeep(comp1)).then(component => {
      component.addTextAreaAIButton = () => {};
      attachFakeAce(component, '');
      // The latch the initial value push leaves behind and nothing clears on an empty field
      component.autoModified = true;
      const updateValueSpy = jest.spyOn(component, 'updateValue');

      component.applyAIEditorValue('var a = 1;');

      expect(updateValueSpy).toHaveBeenCalledWith(expect.objectContaining({ modified: true, changeByUser: true }), 'var a = 1;');
      expect(component.dataValue).toBe('var a = 1;');
    });
  });

  it('marks an apply into a filled ace field as changed by the user', () => {
    return Harness.testCreate(TextAreaComponent, cloneDeep(comp1)).then(component => {
      component.addTextAreaAIButton = () => {};
      component.setValue('var a = 1;');
      attachFakeAce(component, 'var a = 1;');
      const updateValueSpy = jest.spyOn(component, 'updateValue');

      component.applyAIEditorValue('var a = 2;');

      expect(updateValueSpy).toHaveBeenCalledWith(expect.objectContaining({ modified: true, changeByUser: true }), 'var a = 2;');
      expect(component.dataValue).toBe('var a = 2;');
    });
  });

  it('applies nothing and raises no flag when the value is already in the editor', () => {
    return Harness.testCreate(TextAreaComponent, cloneDeep(comp1)).then(component => {
      component.addTextAreaAIButton = () => {};
      component.setValue('var a = 1;');
      const editor = attachFakeAce(component, 'var a = 1;');
      const editorSetValueSpy = jest.spyOn(editor, 'setValue');
      const updateValueSpy = jest.spyOn(component, 'updateValue');

      component.applyAIEditorValue('var a = 1;');

      expect(editorSetValueSpy).not.toHaveBeenCalled();
      expect(updateValueSpy).not.toHaveBeenCalled();
    });
  });

  it('marks an apply into an initially EMPTY monaco field as changed by the user', () => {
    return Harness.testCreate(TextAreaComponent, cloneDeep(comp1)).then(component => {
      component.addTextAreaAIButton = () => {};
      component.component.editor = 'monaco';
      // No model yet — the branch that falls back to a plain setValue and reports the change itself
      component.editor = { getValue: () => '', getModel: () => null, setValue: () => {} };
      component.autoModified = true;
      const updateValueSpy = jest.spyOn(component, 'updateValue');

      component.applyAIEditorValue('var a = 1;');

      expect(updateValueSpy).toHaveBeenCalledWith(expect.objectContaining({ modified: true, changeByUser: true }), 'var a = 1;');
    });
  });

  it('leaves an ordinary editor edit alone — no changeByUser is invented for it', () => {
    return Harness.testCreate(TextAreaComponent, cloneDeep(comp1)).then(component => {
      component.addTextAreaAIButton = () => {};
      const editor = attachFakeAce(component, '');
      const updateValueSpy = jest.spyOn(component, 'updateValue');

      // A keystroke, not an apply: the component hears the same change event
      editor.setValue('typed by hand');

      expect(updateValueSpy).toHaveBeenCalledWith(expect.not.objectContaining({ changeByUser: true }), 'typed by hand');
    });
  });
});
