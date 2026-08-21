import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';

import TextAreaComponent from './TextArea';
import comp1 from './fixtures/comp1';

const MARKUP =
  '<p class="PlaygroundEditorTheme__paragraph" dir="ltr"><span class="LEd__embedBlock" style="white-space: pre-wrap;">Описание задачи</span></p>';

/**
 * The `dd` a read-only rich-text field builds is not a leftover of some older implementation: the
 * read-only Lexical editor that replaces it is mounted a macrotask later (`createViewOnlyValue`),
 * so this node IS what the user sees in between. Painting the value with `textContent` put the
 * stored markup on screen with every tag visible — for one frame on an idle page, long enough to
 * read right after an inline save, when the whole dashboard repaints on the same tick.
 * Cause: https://citeck.atlassian.net/browse/COREDEV-427
 */
describe('TextArea view-mode value (COREDEV-427)', () => {
  const richText = extra => Object.assign(cloneDeep(comp1), { editor: 'lexical', ...extra });

  const renderInto = component => {
    const element = document.createElement('dd');

    component.setupValueElement(element);

    return element;
  };

  it('renders the stored markup of a rich-text field as elements, not as its source', () => {
    return Harness.testCreate(TextAreaComponent, richText(), { readOnly: true, viewAsHtml: true }).then(component => {
      component.dataValue = MARKUP;

      const element = renderInto(component);

      expect(element.querySelectorAll('p')).toHaveLength(1);
      expect(element.textContent).toBe('Описание задачи');
      expect(element.textContent).not.toContain('<p');
      expect(element.textContent).not.toContain('PlaygroundEditorTheme__paragraph');
    });
  });

  // The other side of the same contract: a plain textarea holds text, and text that happens to
  // look like markup must stay literal — it is not a document, and it must not become one.
  it('keeps a plain textarea value literal', () => {
    return Harness.testCreate(TextAreaComponent, cloneDeep(comp1), { readOnly: true, viewAsHtml: true }).then(component => {
      component.dataValue = '<b>not bold</b>';

      const element = renderInto(component);

      expect(element.querySelector('b')).toBeNull();
      expect(element.textContent).toBe('<b>not bold</b>');
    });
  });

  // `ckeditor` and `quill` hold markup too, so the rich-text branch must not be narrowed down to
  // lexical alone while chasing the code editors below.
  it('renders the stored markup of the other rich-text editors as elements', () => {
    return Promise.all(
      ['ckeditor', 'quill'].map(editor =>
        Harness.testCreate(TextAreaComponent, richText({ editor }), { readOnly: true, viewAsHtml: true }).then(component => {
          component.dataValue = '<p>text</p>';

          const element = renderInto(component);

          expect(element.querySelectorAll('p')).toHaveLength(1);
          expect(element.textContent).toBe('text');
        })
      )
    );
  });

  // A code editor is not a rich-text one: its value is source, and `i < n` in it is a comparison,
  // not the start of a tag. Parsing it as HTML eats everything up to the next `>` — a JavaScript
  // function came out as `if (a`, a JSON config lost half its keys. COREDEV-427.
  it.each([['ace'], ['monaco']])('keeps the value of the %s editor literal', editor => {
    const source = 'function f(n) {\n  for (let i = 0; i<n; i++) { g("<b>"); }\n}';

    return Harness.testCreate(TextAreaComponent, richText({ editor }), { readOnly: true, viewAsHtml: true }).then(component => {
      component.dataValue = source;

      const element = renderInto(component);

      expect(element.textContent).toBe(source);
      expect(element.children).toHaveLength(0);
    });
  });

  // The markup reaching the DOM here is stored, user-authored content: the Lexical renderer that
  // takes this node over parses it into editor nodes and drops anything executable, and this
  // stand-in must not be the one place where it lands raw.
  it('drops executable markup from a rich-text value', () => {
    return Harness.testCreate(TextAreaComponent, richText(), { readOnly: true, viewAsHtml: true }).then(component => {
      component.dataValue = '<p>text</p><script>window.__coredev427 = true;</script><img src="x" onerror="window.__coredev427 = true">';

      const element = renderInto(component);

      expect(element.querySelector('script')).toBeNull();
      expect(element.querySelector('img[onerror]')).toBeNull();
      expect(element.textContent).toContain('text');
    });
  });
});
