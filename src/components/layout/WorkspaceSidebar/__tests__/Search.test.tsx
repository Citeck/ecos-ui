import { render } from '@testing-library/react';
import React from 'react';

import SearchWorkspaceSidebar from '../Search';

const getInput = (container: HTMLElement) => container.querySelector('.citeck-workspace-sidebar__search .search__input');

describe('<SearchWorkspaceSidebar />', () => {
  it('should focus the field on its own when the sidebar opens', () => {
    const { container } = render(<SearchWorkspaceSidebar onSearch={jest.fn()} autoFocus />);

    expect(document.activeElement).toBe(getInput(container));
  });

  // The sidebar takes the focus back through this ref every time a tab is switched
  it('should pass focus() down to the field it wraps', () => {
    const ref = React.createRef<SearchWorkspaceSidebar>();
    const { container } = render(<SearchWorkspaceSidebar ref={ref} onSearch={jest.fn()} />);

    expect(document.activeElement).not.toBe(getInput(container));

    ref.current!.focus();

    expect(document.activeElement).toBe(getInput(container));
  });
});
