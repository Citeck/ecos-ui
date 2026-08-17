import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';

import TextAreaComponent from './TextArea';
import comp1 from './fixtures/comp1';

import configureStore, { getStoreIfReady } from '@/store';

// D-UI-STORE-EMPTY: `getStore()` answers `store || {}`, and the store itself is only assigned inside
// `configureStore()`, which runs once at application bootstrap. Every root this component builds put
// that value straight into a redux `<Provider>`, which calls `store.getState` while rendering — so
// before bootstrap the root died with `TypeError: store.getState is not a function` and the field's
// AI button simply never appeared, with nothing but a console error to show for it.
//
// The test environment never bootstraps, which is exactly the state the defect lives in: the cases
// below run against a genuinely absent store, and the last one bootstraps one for the other half of
// the contract. Order matters — `configureStore` writes the module-level store for good — so the
// negative cases come first.
describe('TextArea roots are not built before the store exists', () => {
  let warn;

  // `isTextAreaAIEnabled` is the first gate of the method under test; without these two the button
  // is not offered at all and the store would never be consulted.
  const aiTextArea = () => ({ ...cloneDeep(comp1), aiEnabled: true, textAreaAIContextType: 'general' });

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('has no store to hand out before the application bootstraps one', () => {
    expect(getStoreIfReady()).toBeNull();
  });

  it('skips the plain textarea AI button while the store is missing', () => {
    return Harness.testCreate(TextAreaComponent, aiTextArea()).then(component => {
      const textareaElement = component.element.querySelector('textarea');

      expect(() => component.addTextAreaAIButton(textareaElement)).not.toThrow();

      expect(component._textAreaAIButtonRoot).toBeFalsy();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('redux store is not ready'));
    });
  });

  it('answers null from renderLexicalProvider while the store is missing', () => {
    return Harness.testCreate(TextAreaComponent, aiTextArea()).then(component => {
      // `onChange` is what the method normally requires; the store is the second condition
      expect(component.renderLexicalProvider({}, () => {})).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('redux store is not ready'));
    });
  });

  it('skips the script editor AI button while the store is missing', () => {
    // `scriptContextType` is this method's own gate, exactly as `textAreaAIContextType` is the
    // plain button's — without it the store is never consulted and the case would prove nothing.
    return Harness.testCreate(TextAreaComponent, { ...aiTextArea(), scriptContextType: 'computed_attribute' }).then(component => {
      const editorElement = document.createElement('div');
      document.body.appendChild(editorElement);

      expect(() => component.addScriptAIButton(editorElement)).not.toThrow();

      expect(component._scriptAIButtonRoot).toBeFalsy();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('redux store is not ready'));
    });
  });

  it('builds the plain textarea AI button once the store is there', () => {
    configureStore({});
    expect(getStoreIfReady()).not.toBeNull();

    return Harness.testCreate(TextAreaComponent, aiTextArea()).then(component => {
      const textareaElement = component.element.querySelector('textarea');

      component.addTextAreaAIButton(textareaElement);

      expect(component._textAreaAIButtonRoot).toBeTruthy();
    });
  });
});
