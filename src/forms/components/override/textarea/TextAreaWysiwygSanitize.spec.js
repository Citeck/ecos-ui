import FormIOTextAreaComponent from 'formiojs/components/textarea/TextArea';
import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';

import TextAreaComponent from './TextArea';
import comp1 from './fixtures/comp1';

const PAYLOAD = '<p>ok <b>bold</b></p><img src="x" onerror="window.__coredev546 = true"><script>window.__coredev546 = true;</script>';

const assertSanitized = html => {
  const holder = document.createElement('div');

  holder.innerHTML = html;

  expect(holder.querySelector('b')).not.toBeNull();
  expect(holder.querySelector('script')).toBeNull();
  holder.querySelectorAll('*').forEach(node => {
    Array.from(node.attributes).forEach(attribute => expect(attribute.name).not.toMatch(/^on/i));
  });
};

/**
 * Quill 1.x `clipboard.convert(html)` parses the markup through `innerHTML` of a container attached
 * to the document, so an `onerror` handler in a stored value runs while the value is merely being
 * set. The Properties widget builds its edit form hidden on every record card open — the handler
 * ran for anyone who opened the card, in edit mode, even with the view-mode value sanitized.
 * Cause: COREDEV-546
 */
describe('TextArea wysiwyg: stored markup reaches the editor sanitized (COREDEV-546)', () => {
  const wysiwyg = extra => Object.assign(cloneDeep(comp1), { wysiwyg: true, ...extra });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('hands Quill a sanitized value', () => {
    const superSet = jest.spyOn(FormIOTextAreaComponent.prototype, 'setWysiwygValue').mockImplementation(() => {});

    return Harness.testCreate(TextAreaComponent, wysiwyg()).then(component => {
      superSet.mockClear();
      component.setWysiwygValue(PAYLOAD);

      expect(superSet).toHaveBeenCalledTimes(1);
      assertSanitized(superSet.mock.calls[0][0]);
    });
  });

  it('hands an ace editor its source untouched', () => {
    const superSet = jest.spyOn(FormIOTextAreaComponent.prototype, 'setWysiwygValue').mockImplementation(() => {});
    const source = 'if (a<b) { return "<c>"; }';

    return Harness.testCreate(TextAreaComponent, wysiwyg({ editor: 'ace' })).then(component => {
      superSet.mockClear();
      component.setWysiwygValue(source);

      expect(superSet).toHaveBeenCalledWith(source, undefined, undefined);
    });
  });

  it('writes a read-only wysiwyg value into the input sanitized', () => {
    return Harness.testCreate(TextAreaComponent, wysiwyg(), { readOnly: true }).then(component => {
      component.input = document.createElement('div');
      component.setValue(PAYLOAD);

      assertSanitized(component.input.innerHTML);
    });
  });

  it('writes the fallback view of an editor that failed to start sanitized', () => {
    return Harness.testCreate(TextAreaComponent, wysiwyg()).then(component => {
      component.input = document.createElement('div');
      component.dataValue = PAYLOAD;
      component.showFallbackWysiwyg();

      assertSanitized(component.input.innerHTML);
    });
  });
});
