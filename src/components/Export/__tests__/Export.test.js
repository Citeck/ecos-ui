import { render, screen } from '@testing-library/react';
import React from 'react';

import ConfigService from '../../../services/config/ConfigService';
import Export from '../Export';

describe('Export component tests', () => {
  test('should render Export component', () => {
    const spy = jest.spyOn(ConfigService, 'getValue').mockImplementation(() => Promise.resolve(true));

    const { container } = render(<Export />);

    expect(spy).toHaveBeenCalled();
    expect(container).toMatchSnapshot();
  });

  test('should render Export component with empty className props', () => {
    const { container } = render(<Export />);
    expect(container.getElementsByClassName('ecos-btn-export')).toHaveLength(1);
  });

  test('should render Export component with className props', () => {
    const { container } = render(<Export className={'ecos-journal__settings-bar-export'} />);
    expect(container.getElementsByClassName('ecos-journal__settings-bar-export')).toHaveLength(1);
  });

  test('test equal dropdown with alfresco source and snapshots data', async () => {
    const spy = jest.spyOn(ConfigService, 'getValue').mockImplementation(() => Promise.resolve(true));

    const { container } = render(<Export />);

    expect(spy).toHaveBeenCalled();

    const dropdownSource = new Export().dropdownSourceVariants(true, false);
    const list = container.getElementsByTagName('ul').item(0);

    for (let node of Array.from(list.children)) {
      expect(node.textContent).toEqual(dropdownSource[dropdownSource.length - 1]['title']);
    }
  });

  test('test equal dropdown withoutAlfresco source and snapshots data', () => {
    const { container } = render(<Export />);

    const dropdownSource = new Export().dropdownSourceVariants(false, false);
    const list = container.getElementsByTagName('ul').item(0);

    for (let i = 0; i < list.length; i++) {
      expect(list[i].textContent).toEqual(dropdownSource[i]['title']);
    }
  });
});
