import { render } from '@testing-library/react';
import React from 'react';

import Search from '../Search';

const getInput = container => container.querySelector('.search__input');

describe('<Search /> autoFocus', () => {
  it('should not take the focus by default', () => {
    const { container } = render(<Search />);

    expect(document.activeElement).not.toBe(getInput(container));
  });

  it('should focus the field on mount when it is asked to', () => {
    const { container } = render(<Search autoFocus />);

    expect(document.activeElement).toBe(getInput(container));
  });

  it('should focus the field of an already mounted component when it is asked to', () => {
    const { container, rerender } = render(<Search autoFocus={false} />);

    expect(document.activeElement).not.toBe(getInput(container));

    rerender(<Search autoFocus />);

    expect(document.activeElement).toBe(getInput(container));
  });

  it('should leave the collapsed field alone, as it is hidden behind the search icon', () => {
    const { container } = render(<Search autoFocus collapsed />);

    expect(document.activeElement).not.toBe(getInput(container));
  });
});
