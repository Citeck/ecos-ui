import path from 'path';
import postcss from 'postcss';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

// ECOSUI-3467 replaced `$color-blue-dark3` by `var(--primary-color)3` — the sass variable was swapped
// for the css custom property but its trailing digit survived, so every such value is invalid CSS and
// the browser drops the whole declaration. The image resize handles lost their fill and the selected
// image its outline; the handles stayed clickable, but nobody could see them.
const LEXICAL_SHEETS = ['src/components/editors/Lexical/index.scss', 'src/components/editors/LexicalEditor/themes/DefaultTheme/style.scss'];

/** `.citeck-lexical-editor > .editor-shell > .editor-image > (img.focused + .image-resizer)` the way ImageComponent renders a selected image. */
const selectedImage = () => {
  const root = element('citeck-lexical-editor');
  const shell = element('editor-shell');
  const image = element('PlaygroundEditorTheme__image editor-image', {}, 'span');
  const img = element('focused draggable', {}, 'img');
  const handle = element('image-resizer image-resizer-se');

  root.appendChild(shell);
  shell.appendChild(image);
  image.appendChild(img);
  image.appendChild(handle);

  return { img, handle };
};

describe('Lexical image resize handles are visible', () => {
  let sheets;

  beforeAll(() => {
    sheets = LEXICAL_SHEETS.map(file => compileScss(path.join(ROOT, file)));
  });

  it('fills the resize handle with the primary color', () => {
    const { handle } = selectedImage();

    expect(cascade(handle, sheets, 'background-color')).toBe('var(--primary-color)');
  });

  it('outlines the selected image with the primary color', () => {
    const { img } = selectedImage();

    expect(cascade(img, sheets, 'outline')).toBe('2px solid var(--primary-color)');
  });

  // ECOSUI-3474 clipped the paragraph (`overflow: hidden`) to keep a 500px image inside a narrower
  // editor. The outline (2px) and the handles (6px) sit outside the image box, so on an image that
  // starts the paragraph only the right side of the frame survived (COREDEV-475). The image is kept
  // inside the paragraph by its own max-width instead (see imageFitsParagraph.test.tsx).
  it('does not let the paragraph clip the frame around a selected image', () => {
    const paragraph = element('PlaygroundEditorTheme__paragraph', {}, 'p');

    expect(cascade(paragraph, sheets, 'overflow')).toBeNull();
    expect(cascade(paragraph, sheets, 'overflow-x')).toBeNull();
    expect(cascade(paragraph, sheets, 'overflow-y')).toBeNull();
  });

  it('has no custom property followed by a stray digit anywhere in the editor stylesheets', () => {
    const stray = [];

    sheets.forEach((css, i) => {
      postcss.parse(css).walkDecls(decl => {
        if (/var\(--[\w-]+\)\s*\d/.test(decl.value)) {
          stray.push(`${LEXICAL_SHEETS[i]}: ${decl.parent.selector} { ${decl.prop}: ${decl.value} }`);
        }
      });
    });

    expect(stray).toEqual([]);
  });
});
