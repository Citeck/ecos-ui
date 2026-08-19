import { cloneNode } from '../utils';

describe('sortableHoc cloneNode', () => {
  // COREDEV-356: the clone lives in the document next to the original for the whole drag, so any
  // id it carries makes `getElementById` ambiguous — tooltips then bind their hover listeners to
  // the clone and are left hanging when it is thrown away at drop.
  it('strips the id from the clone and from every descendant, leaving the original untouched', () => {
    const node = document.createElement('div');
    node.id = 'drag-source';
    node.innerHTML = '<span id="inner-label">tab</span><button id="inner-close" type="button">x</button>';

    const clone = cloneNode(node);

    expect(clone.hasAttribute('id')).toBe(false);
    expect(clone.querySelectorAll('[id]').length).toBe(0);

    expect(node.id).toBe('drag-source');
    expect(node.querySelector('#inner-label')).not.toBeNull();
    expect(node.querySelector('#inner-close')).not.toBeNull();
  });

  it('still copies field values onto the clone', () => {
    const node = document.createElement('div');
    node.innerHTML = '<input id="the-input" type="text">';
    node.querySelector('input').value = 'typed';

    const clone = cloneNode(node);
    const clonedInput = clone.querySelector('input');

    expect(clonedInput.value).toBe('typed');
    expect(clonedInput.hasAttribute('id')).toBe(false);
  });
});
